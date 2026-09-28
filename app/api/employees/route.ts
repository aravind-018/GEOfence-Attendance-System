import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth/session";
import { employeeCreateSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (status && (status === "ACTIVE" || status === "INACTIVE")) {
      whereClause.status = status;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { active: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("GET Employees Error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const result = employeeCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid employee data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, name, departmentId, organization, email, mobileNumber, password, status } =
      result.data;

    // Check existing email / employeeId
    const existingEmp = await prisma.employee.findFirst({
      where: {
        OR: [{ employeeId }, { email: email.toLowerCase() }],
      },
    });

    if (existingEmp) {
      return NextResponse.json(
        { error: "An employee with this Employee ID or Email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Transaction to create User and Employee
    const newEmployee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: "EMPLOYEE",
          active: status === "ACTIVE",
        },
      });

      return tx.employee.create({
        data: {
          employeeId,
          userId: user.id,
          name,
          departmentId,
          organization,
          email: email.toLowerCase(),
          mobileNumber,
          status,
        },
        include: { department: true },
      });
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error) {
    console.error("POST Employee Error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
