import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "EMPLOYEE" || !user.employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId: user.employee.id },
        include: {
          workplace: { select: { name: true } },
        },
        orderBy: { checkInTime: "desc" },
        take: limit,
        skip,
      }),
      prisma.attendance.count({
        where: { employeeId: user.employee.id },
      }),
    ]);

    return NextResponse.json({
      attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Employee Attendance API Error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance history" }, { status: 500 });
  }
}
