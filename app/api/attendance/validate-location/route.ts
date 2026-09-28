import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateLocationSchema } from "@/lib/validation/schemas";
import { validateGeofence } from "@/lib/geo/haversine";
import { getFormattedTodayDate } from "@/lib/utils/date";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required", requiresLogin: true },
        { status: 401 }
      );
    }

    if (currentUser.role !== "EMPLOYEE" || !currentUser.employee) {
      return NextResponse.json(
        { error: "Only active employees can validate attendance location." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = validateLocationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid location parameters", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, latitude, longitude, gpsAccuracyMeters } = result.data;

    // Resolve QR Code and Workplace
    const qrCode = await prisma.workplaceQRCode.findUnique({
      where: { token },
      include: { workplace: true },
    });

    if (!qrCode || !qrCode.active) {
      return NextResponse.json(
        { error: "The scanned QR code is invalid or has been deactivated." },
        { status: 404 }
      );
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return NextResponse.json(
        { error: "The scanned QR code has expired." },
        { status: 410 }
      );
    }

    const workplace = qrCode.workplace;
    if (!workplace || workplace.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "The workplace associated with this QR code is currently inactive." },
        { status: 400 }
      );
    }

    // Server-side Geofence Validation
    const geofenceResult = validateGeofence({
      workplaceLat: workplace.latitude,
      workplaceLon: workplace.longitude,
      radiusMeters: workplace.radiusMeters,
      maxGpsAccuracyMeters: workplace.maxGpsAccuracyMeters,
      employeeLat: latitude,
      employeeLon: longitude,
      gpsAccuracyMeters,
    });

    // Check if attendance already marked today
    const todayDateStr = getFormattedTodayDate();
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: currentUser.employee.id,
          date: todayDateStr,
        },
      },
    });

    return NextResponse.json({
      success: true,
      workplace: {
        id: workplace.id,
        name: workplace.name,
        radiusMeters: workplace.radiusMeters,
        maxGpsAccuracyMeters: workplace.maxGpsAccuracyMeters,
      },
      employee: currentUser.employee,
      geofence: geofenceResult,
      alreadyCheckedIn: !!existingAttendance,
      existingAttendance: existingAttendance
        ? {
            checkInTime: existingAttendance.checkInTime,
            status: existingAttendance.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Validate Location API Error:", error);
    return NextResponse.json(
      { error: "Server error validating location." },
      { status: 500 }
    );
  }
}
