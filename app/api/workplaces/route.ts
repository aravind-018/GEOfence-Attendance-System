import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { workplaceSchema } from "@/lib/validation/schemas";
import { generateQRToken } from "@/lib/qr/generator";

export async function GET() {
  try {
    const workplaces = await prisma.workplace.findMany({
      include: {
        qrCodes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { attendances: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ workplaces });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workplaces" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const result = workplaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid workplace data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const token = generateQRToken();

    // Create workplace and initial QR code in a transaction
    const workplace = await prisma.$transaction(async (tx) => {
      const wp = await tx.workplace.create({
        data: result.data,
      });

      await tx.workplaceQRCode.create({
        data: {
          workplaceId: wp.id,
          token,
          active: true,
        },
      });

      return wp;
    });

    return NextResponse.json({ success: true, workplace }, { status: 201 });
  } catch (error) {
    console.error("POST Workplace Error:", error);
    return NextResponse.json({ error: "Failed to create workplace" }, { status: 500 });
  }
}
