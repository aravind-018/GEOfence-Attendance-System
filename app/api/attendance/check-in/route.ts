import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateGeofence } from "@/lib/geo/haversine";
import { getFormattedTodayDate } from "@/lib/utils/date";
import { getOrCreateWorkplaceFormFields } from "@/lib/form/fields";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, latitude, longitude, gpsAccuracyMeters, formData } = body || {};

    if (!token || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Invalid request payload. Token and valid GPS coordinates are required." },
        { status: 400 }
      );
    }

    // Optional user check if currently logged in
    const currentUser = await getCurrentUser();
    const loggedInEmployeeId = currentUser?.role === "EMPLOYEE" ? currentUser.employee?.id : null;

    // 1. Resolve QR Token & Workplace
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
        { error: "Workplace is currently inactive." },
        { status: 400 }
      );
    }

    // 2. Server-side Geofence Validation
    const geofenceResult = validateGeofence({
      workplaceLat: workplace.latitude,
      workplaceLon: workplace.longitude,
      radiusMeters: workplace.radiusMeters,
      maxGpsAccuracyMeters: workplace.maxGpsAccuracyMeters,
      employeeLat: latitude,
      employeeLon: longitude,
      gpsAccuracyMeters: gpsAccuracyMeters || 0,
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

    // 3. Server-side Dynamic Form Fields Validation
    const allFields = await getOrCreateWorkplaceFormFields(workplace.id);
    const activeFormFields = allFields.filter((f) => f.active);

    const submissionData: Record<string, any> = formData || {};
    const validationErrors: string[] = [];

    for (const field of activeFormFields) {
      const value = submissionData[field.key];

      // Check required
      if (field.required) {
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0)
        ) {
          validationErrors.push(`Field "${field.label}" is required.`);
          continue;
        }
      }

      // Check field types if value is provided
      if (value !== undefined && value !== null && value !== "") {
        const valStr = String(value).trim();

        if (field.type === "EMAIL") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(valStr)) {
            validationErrors.push(`"${field.label}" must be a valid email address.`);
          }
        } else if (field.type === "PHONE") {
          const phoneClean = valStr.replace(/[\s\-\+\(\)]/g, "");
          if (phoneClean.length < 7 || isNaN(Number(phoneClean))) {
            validationErrors.push(`"${field.label}" must be a valid phone number.`);
          }
        } else if (field.type === "NUMBER") {
          if (isNaN(Number(valStr))) {
            validationErrors.push(`"${field.label}" must be a valid number.`);
          }
        } else if (field.type === "DROPDOWN" || field.type === "RADIO") {
          const allowedOptions = Array.isArray(field.options) ? (field.options as string[]) : [];
          if (allowedOptions.length > 0 && !allowedOptions.includes(valStr)) {
            validationErrors.push(`Invalid option selected for "${field.label}".`);
          }
        } else if (field.type === "CHECKBOX") {
          const allowedOptions = Array.isArray(field.options) ? (field.options as string[]) : [];
          const selectedList = Array.isArray(value) ? value : [valStr];
          if (allowedOptions.length > 0) {
            for (const item of selectedList) {
              if (!allowedOptions.includes(String(item))) {
                validationErrors.push(`Invalid option selected for "${field.label}".`);
                break;
              }
            }
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors[0], details: validationErrors },
        { status: 400 }
      );
    }

    // 4. Save Attendance Submission
    const todayDateStr = getFormattedTodayDate();

    // Extract standard top-level fields for convenience
    const submittedName =
      submissionData.fullName || submissionData.name || currentUser?.employee?.name || "Public Attendee";
    const submittedEmail =
      submissionData.email || currentUser?.employee?.email || null;
    const submittedMobile =
      submissionData.mobileNumber || submissionData.mobile || currentUser?.employee?.mobileNumber || null;
    const submittedDept =
      submissionData.departmentName || submissionData.department || currentUser?.employee?.departmentName || null;
    const submittedOrg =
      submissionData.organization || currentUser?.employee?.organization || null;
    const submittedEmpCode =
      submissionData.employeeCode || submissionData.employeeId || currentUser?.employee?.employeeId || null;

    const newAttendance = await prisma.attendance.create({
      data: {
        employeeId: loggedInEmployeeId,
        workplaceId: workplace.id,
        date: todayDateStr,
        checkInTime: new Date(),
        latitude,
        longitude,
        gpsAccuracyMeters: geofenceResult.gpsAccuracyMeters,
        distanceFromWorkplaceMeters: geofenceResult.distanceMeters,
        qrCodeId: qrCode.id,
        status: "PRESENT",
        name: submittedName,
        email: submittedEmail,
        mobileNumber: submittedMobile,
        departmentName: submittedDept,
        organization: submittedOrg,
        employeeCode: submittedEmpCode,
        formData: submissionData,
      },
      include: {
        workplace: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully!",
      attendance: {
        id: newAttendance.id,
        workplaceName: newAttendance.workplace.name,
        name: newAttendance.name,
        date: newAttendance.date,
        checkInTime: newAttendance.checkInTime,
        distanceMeters: newAttendance.distanceFromWorkplaceMeters,
        accuracyMeters: newAttendance.gpsAccuracyMeters,
        status: newAttendance.status,
      },
    });
  } catch (error: any) {
    console.error("Check-In API Error:", error);
    return NextResponse.json(
      { error: "Failed to save attendance submission due to a server error." },
      { status: 500 }
    );
  }
}
