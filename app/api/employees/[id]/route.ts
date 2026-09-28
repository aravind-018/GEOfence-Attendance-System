import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth/session";
import { employeeUpdateSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true, user: { select: { active: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const result = employeeUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, departmentId, organization, email, mobileNumber, status, password } =
      result.data;

    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      // Update User if email/status/password changed
      const userUpdates: any = {
        email: email.toLowerCase(),
        active: status === "ACTIVE",
      };

      if (password && password.trim().length >= 6) {
        userUpdates.passwordHash = await hashPassword(password.trim());
      }

      await tx.user.update({
        where: { id: existing.userId },
        data: userUpdates,
      });

      return tx.employee.update({
        where: { id },
        data: {
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

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    console.error("PATCH Employee Error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Cascade deletion removes User & Employee & Attendances
    await prisma.user.delete({ where: { id: employee.userId } });

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("DELETE Employee Error:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
