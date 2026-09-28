import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { departmentSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const result = departmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid department data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: result.data,
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    console.error("POST Department Error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
