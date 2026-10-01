import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { formatKolkataDateTime } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get("export") === "true";
    const reportType = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const workplaceId = searchParams.get("workplaceId") || "";

    const whereClause: any = {};
    if (date) whereClause.date = date;
    if (workplaceId) whereClause.workplaceId = workplaceId;
    if (departmentId) {
      whereClause.OR = [
        { employee: { departmentId } },
        { departmentName: { contains: departmentId, mode: "insensitive" } },
      ];
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          include: { department: true },
        },
        workplace: true,
      },
      orderBy: { checkInTime: "desc" },
    });

    if (exportCsv) {
      // Find all custom keys present in formData objects
      const customKeysSet = new Set<string>();
      const standardKeys = ["fullName", "name", "email", "mobileNumber", "mobile", "departmentName", "department", "organization", "employeeCode", "employeeId"];

      records.forEach((r) => {
        if (r.formData && typeof r.formData === "object") {
          Object.keys(r.formData as Record<string, any>).forEach((k) => {
            if (!standardKeys.includes(k)) {
              customKeysSet.add(k);
            }
          });
        }
      });

      const customKeys = Array.from(customKeysSet);

      // Standard Headers
      const headers = [
        "Attendance ID",
        "Date",
        "Check-In Time (IST)",
        "Workplace",
        "Full Name",
        "Email",
        "Mobile Number",
        "Department",
        "Organization",
        "Employee ID / Code",
        ...customKeys.map((k) => `"${k.replace(/([A-Z])/g, " $1").trim()}"`),
        "Latitude",
        "Longitude",
        "GPS Accuracy (m)",
        "Distance (m)",
        "Status",
      ];

      const rows = records.map((r) => {
        const formDataObj = (r.formData as Record<string, any>) || {};

        const nameVal = r.name || r.employee?.name || formDataObj.fullName || "";
        const emailVal = r.email || r.employee?.email || formDataObj.email || "";
        const mobileVal = r.mobileNumber || r.employee?.mobileNumber || formDataObj.mobileNumber || "";
        const deptVal = r.departmentName || r.employee?.department?.name || formDataObj.departmentName || "";
        const orgVal = r.organization || r.employee?.organization || formDataObj.organization || "";
        const codeVal = r.employeeCode || r.employee?.employeeId || formDataObj.employeeCode || "";

        const customVals = customKeys.map((k) => {
          const val = formDataObj[k];
          if (val === undefined || val === null) return '""';
          if (Array.isArray(val)) return `"${val.join("; ").replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        });

        return [
          `"${r.id}"`,
          `"${r.date}"`,
          `"${formatKolkataDateTime(r.checkInTime)}"`,
          `"${r.workplace.name.replace(/"/g, '""')}"`,
          `"${nameVal.replace(/"/g, '""')}"`,
          `"${emailVal.replace(/"/g, '""')}"`,
          `"${mobileVal.replace(/"/g, '""')}"`,
          `"${deptVal.replace(/"/g, '""')}"`,
          `"${orgVal.replace(/"/g, '""')}"`,
          `"${codeVal.replace(/"/g, '""')}"`,
          ...customVals,
          r.latitude,
          r.longitude,
          r.gpsAccuracyMeters,
          r.distanceFromWorkplaceMeters,
          `"${r.status}"`,
        ];
      });

      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Attendance_Report_${
            date || "All"
          }_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      reportType,
      totalRecords: records.length,
      records,
    });
  } catch (error) {
    console.error("GET Reports Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
