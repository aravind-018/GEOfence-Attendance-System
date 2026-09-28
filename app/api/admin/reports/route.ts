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
    const reportType = searchParams.get("type") || "daily"; // daily, monthly, department, workplace
    const date = searchParams.get("date") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const workplaceId = searchParams.get("workplaceId") || "";

    const whereClause: any = {};
    if (date) whereClause.date = date;
    if (workplaceId) whereClause.workplaceId = workplaceId;
    if (departmentId) whereClause.employee = { departmentId };

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
      // Build Excel-compatible CSV string with BOM (\uFEFF)
      const headers = [
        "Attendance ID",
        "Employee ID",
        "Employee Name",
        "Department",
        "Organization",
        "Workplace",
        "Date",
        "Check-In Time (IST)",
        "Latitude",
        "Longitude",
        "GPS Accuracy (m)",
        "Distance from Workplace (m)",
        "Status",
      ];

      const rows = records.map((r) => [
        `"${r.id}"`,
        `"${r.employee.employeeId}"`,
        `"${r.employee.name.replace(/"/g, '""')}"`,
        `"${r.employee.department.name.replace(/"/g, '""')}"`,
        `"${r.employee.organization.replace(/"/g, '""')}"`,
        `"${r.workplace.name.replace(/"/g, '""')}"`,
        `"${r.date}"`,
        `"${formatKolkataDateTime(r.checkInTime)}"`,
        r.latitude,
        r.longitude,
        r.gpsAccuracyMeters,
        r.distanceFromWorkplaceMeters,
        `"${r.status}"`,
      ]);

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
