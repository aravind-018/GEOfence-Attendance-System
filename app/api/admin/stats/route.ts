import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getFormattedTodayDate } from "@/lib/utils/date";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const todayStr = getFormattedTodayDate();

    const [totalEmployees, activeEmployees, todayPresentCount, totalWorkplaces, recentCheckIns, deptSummary] =
      await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: "ACTIVE" } }),
        prisma.attendance.count({ where: { date: todayStr } }),
        prisma.workplace.count(),
        prisma.attendance.findMany({
          take: 10,
          orderBy: { checkInTime: "desc" },
          include: {
            employee: {
              select: {
                employeeId: true,
                name: true,
                department: { select: { name: true } },
              },
            },
            workplace: { select: { name: true } },
          },
        }),
        prisma.department.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { employees: true } },
          },
        }),
      ]);

    const todayAbsentCount = Math.max(0, activeEmployees - todayPresentCount);
    const attendancePercentage =
      activeEmployees > 0 ? Math.round((todayPresentCount / activeEmployees) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeEmployees,
        todayPresent: todayPresentCount,
        todayAbsent: todayAbsentCount,
        attendancePercentage,
        totalWorkplaces,
      },
      recentCheckIns,
      departments: deptSummary,
    });
  } catch (error) {
    console.error("GET Admin Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
