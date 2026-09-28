import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { generateQRToken } from "@/lib/qr/generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qrCode = await prisma.workplaceQRCode.findFirst({
      where: { workplaceId: id, active: true },
      include: { workplace: { select: { id: true, name: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (!qrCode) {
      return NextResponse.json({ active: false, qrCode: null });
    }

    return NextResponse.json({ active: true, qrCode });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch QR code" }, { status: 500 });
  }
}

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

    const qrCode = await prisma.workplaceQRCode.create({
      data: {
        workplaceId: id,
        token,
        active: true,
      },
      include: { workplace: true },
    });

    return NextResponse.json({ success: true, qrCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
