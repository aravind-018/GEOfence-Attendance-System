import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { workplaceSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workplace = await prisma.workplace.findUnique({
      where: { id },
      include: {
        qrCodes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!workplace) {
      return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
    }

    return NextResponse.json({ workplace });
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
    const result = workplaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const workplace = await prisma.workplace.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ success: true, workplace });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update workplace" }, { status: 500 });
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

    await prisma.workplace.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Workplace deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete workplace" }, { status: 500 });
  }
}
