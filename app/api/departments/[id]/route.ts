import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { departmentSchema } from "@/lib/validation/schemas";

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
    const result = departmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ success: true, department });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
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

    // Check dependent employees
    const employeeCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete department. There are ${employeeCount} active/assigned employees.` },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Department deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
