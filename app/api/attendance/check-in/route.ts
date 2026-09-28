import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkInSchema } from "@/lib/validation/schemas";
import { validateGeofence } from "@/lib/geo/haversine";
import { getFormattedTodayDate } from "@/lib/utils/date";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required to mark attendance.", requiresLogin: true },
        { status: 401 }
      );
    }

    // 2. Verify EMPLOYEE role & active profile
    if (currentUser.role !== "EMPLOYEE" || !currentUser.employee) {
      return NextResponse.json(
        { error: "Only active employees can check in." },
        { status: 403 }
      );
    }

    if (currentUser.employee.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your employee account is currently inactive." },
        { status: 403 }
      );
    }

    // 3. Input validation
    const body = await req.json();
    const result = checkInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, latitude, longitude, gpsAccuracyMeters } = result.data;

    // 4. Resolve QR Token & Workplace
    const qrCode = await prisma.workplaceQRCode.findUnique({
      where: { token },
      include: { workplace: true },
    });

    if (!qrCode || !qrCode.active) {
      return NextResponse.json(
        { error: "Invalid or inactive QR code." },
        { status: 400 }
      );
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return NextResponse.json(
        { error: "This workplace QR code has expired." },
        { status: 410 }
      );
    }

    const workplace = qrCode.workplace;
    if (!workplace || workplace.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Workplace is inactive." },
        { status: 400 }
      );
    }

    // 5. Server-side Geofence Validation
    const geofenceResult = validateGeofence({
      workplaceLat: workplace.latitude,
      workplaceLon: workplace.longitude,
      radiusMeters: workplace.radiusMeters,
      maxGpsAccuracyMeters: workplace.maxGpsAccuracyMeters,
      employeeLat: latitude,
      employeeLon: longitude,
      gpsAccuracyMeters,
    });

    if (!geofenceResult.isValid) {
      return NextResponse.json(
        {
          error: geofenceResult.message,
          reason: geofenceResult.reason,
          geofence: geofenceResult,
        },
        { status: 422 }
      );
    }

    // 6. Date uniqueness check (Asia/Kolkata timezone string)
    const todayDateStr = getFormattedTodayDate();

    // Check duplicate before write
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: currentUser.employee.id,
          date: todayDateStr,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          error: "Attendance has already been marked for today.",
          alreadyMarked: true,
          attendance: {
            id: existingAttendance.id,
            checkInTime: existingAttendance.checkInTime,
            status: existingAttendance.status,
          },
        },
        { status: 409 }
      );
    }

    const employeeObj = currentUser.employee;
    const empId = employeeObj.id;

    // 7. Atomic transaction write
    const newAttendance = await prisma.$transaction(async (tx) => {
      // Re-verify uniqueness inside transaction
      const doubleCheck = await tx.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: empId,
            date: todayDateStr,
          },
        },
      });

      if (doubleCheck) {
        throw new Error("ALREADY_MARKED");
      }

      return tx.attendance.create({
        data: {
          employeeId: empId,
          workplaceId: workplace.id,
          date: todayDateStr,
          checkInTime: new Date(),
          latitude,
          longitude,
          gpsAccuracyMeters,
          distanceFromWorkplaceMeters: geofenceResult.distanceMeters,
          qrCodeId: qrCode.id,
          status: "PRESENT",
        },
        include: {
          workplace: { select: { name: true } },
          employee: {
            select: {
              employeeId: true,
              name: true,
              organization: true,
              department: { select: { name: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully!",
      attendance: {
        id: newAttendance.id,
        checkInTime: newAttendance.checkInTime,
        date: newAttendance.date,
        workplaceName: newAttendance.workplace.name,
        distanceMeters: newAttendance.distanceFromWorkplaceMeters,
        accuracyMeters: newAttendance.gpsAccuracyMeters,
        status: newAttendance.status,
        employee: {
          employeeId: newAttendance.employee.employeeId,
          name: newAttendance.employee.name,
          department: newAttendance.employee.department.name,
          organization: newAttendance.employee.organization,
        },
      },
    });
  } catch (error: any) {
    if (error?.message === "ALREADY_MARKED" || error?.code === "P2002") {
      return NextResponse.json(
        { error: "Attendance has already been marked for today." },
        { status: 409 }
      );
    }

    console.error("Check-In API Error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in due to a server error." },
      { status: 500 }
    );
  }
}
