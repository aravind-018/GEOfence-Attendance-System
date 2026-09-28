import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { generateQRToken } from "@/lib/qr/generator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const workplace = await prisma.workplace.findUnique({ where: { id } });
    if (!workplace) {
      return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
    }

    const token = generateQRToken();

    // Transaction to deactivate existing tokens and issue new one
    const newQrCode = await prisma.$transaction(async (tx) => {
      await tx.workplaceQRCode.updateMany({
        where: { workplaceId: id, active: true },
        data: { active: false },
      });

      return tx.workplaceQRCode.create({
        data: {
          workplaceId: id,
          token,
          active: true,
        },
        include: { workplace: true },
      });
    });

    return NextResponse.json({ success: true, qrCode: newQrCode });
  } catch (error) {
    console.error("Regenerate QR Error:", error);
    return NextResponse.json({ error: "Failed to regenerate QR code" }, { status: 500 });
  }
}
