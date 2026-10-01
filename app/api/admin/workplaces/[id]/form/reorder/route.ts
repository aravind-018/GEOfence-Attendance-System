import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workplaceId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { orderedFieldIds } = body || {};

    if (!Array.isArray(orderedFieldIds)) {
      return NextResponse.json(
        { error: "orderedFieldIds must be an array of field IDs" },
        { status: 400 }
      );
    }

    // Update displayOrder sequentially inside transaction
    await prisma.$transaction(
      orderedFieldIds.map((fieldId: string, index: number) =>
        prisma.formField.update({
          where: { id: fieldId },
          data: { displayOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Field order updated successfully" });
  } catch (error) {
    console.error("Reorder Fields Error:", error);
    return NextResponse.json({ error: "Failed to reorder fields" }, { status: 500 });
  }
}
