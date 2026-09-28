import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { buildQRCheckInUrl } from "@/lib/qr/generator";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, ShieldCheck } from "lucide-react";
import PrintButton from "./PrintButton";

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintQRPage({ params }: PrintPageProps) {
  const { id } = await params;

  const workplace = await prisma.workplace.findUnique({
    where: { id },
    include: {
      qrCodes: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!workplace || workplace.qrCodes.length === 0) {
    notFound();
  }

  const qrCode = workplace.qrCodes[0];
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const checkInUrl = buildQRCheckInUrl(qrCode.token, baseUrl);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="no-print mb-6 flex gap-4">
        <PrintButton />
      </div>

      {/* Printable Poster Card */}
      <div className="w-full max-w-lg bg-white border-4 border-slate-900 rounded-3xl p-10 shadow-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">GEOPresence</span>
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{workplace.name}</h1>
          <p className="text-sm font-bold text-sky-600 uppercase tracking-wider mt-1">
            Workplace Attendance Check-In Point
          </p>
        </div>

        <div className="flex justify-center p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
          <QRCodeSVG value={checkInUrl} size={280} level="H" includeMargin={true} />
        </div>

        <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-6">
          <p className="font-bold text-slate-900 text-sm flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Geofence Verified Check-In
          </p>
          <p>1. Open your mobile camera or scanner app.</p>
          <p>2. Scan this QR code to access your attendance portal.</p>
          <p>3. Allow GPS location permission when prompted.</p>
          <p>4. Verify your details and tap <strong>CHECK IN</strong>.</p>
        </div>

        <div className="pt-2 text-[10px] text-slate-400 font-mono">
          Authorized Radius: {workplace.radiusMeters} meters | Max GPS Accuracy: {workplace.maxGpsAccuracyMeters}m
        </div>
      </div>
    </div>
  );
}
