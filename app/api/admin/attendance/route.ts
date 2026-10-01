import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const workplaceId = searchParams.get("workplaceId") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (date) {
      whereClause.date = date;
    }

    if (workplaceId) {
      whereClause.workplaceId = workplaceId;
    }

    if (status && ["PRESENT", "LATE", "INVALID"].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { departmentName: { contains: search, mode: "insensitive" } },
        { employee: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (departmentId) {
      whereClause.OR = [
        { employee: { departmentId } },
        { departmentName: { contains: departmentId, mode: "insensitive" } },
      ];
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              email: true,
              department: { select: { id: true, name: true } },
            },
          },
          workplace: { select: { id: true, name: true } },
        },
        orderBy: { checkInTime: "desc" },
        take: limit,
        skip,
      }),
      prisma.attendance.count({ where: whereClause }),
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
    console.error("GET Admin Attendance Error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 });
  }
}
