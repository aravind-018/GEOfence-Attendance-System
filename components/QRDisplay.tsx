"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Check, ExternalLink } from "lucide-react";
import { buildQRCheckInUrl } from "@/lib/qr/generator";

interface QRDisplayProps {
  token: string;
  workplaceName: string;
  active?: boolean;
}

export default function QRDisplay({ token, workplaceName, active = true }: QRDisplayProps) {
  const [copied, setCopied] = useState(false);
  const checkInUrl = buildQRCheckInUrl(token, typeof window !== "undefined" ? window.location.origin : "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${token}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 80;
      canvas.height = img.height + 120;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Text
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(workplaceName, canvas.width / 2, 40);

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("Scan to Mark Attendance", canvas.width / 2, 65);

        ctx.drawImage(img, 40, 80);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${workplaceName.replace(/\s+/g, "_")}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto">
      <h3 className="font-bold text-slate-800 text-lg mb-1 text-center">{workplaceName}</h3>
      <p className="text-xs text-slate-500 mb-4 text-center">Workplace Attendance QR Code</p>

      <div className={`relative p-4 rounded-xl border-2 ${active ? "border-sky-500 bg-sky-50/50" : "border-slate-300 bg-slate-100 opacity-60"}`}>
        <QRCodeSVG
          id={`qr-svg-${token}`}
          value={checkInUrl}
          size={200}
          level="H"
          includeMargin={true}
        />
        {!active && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded">
              Inactive
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 w-full flex flex-col gap-2">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          {copied ? "Check-In Link Copied!" : "Copy Check-In Link"}
        </button>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Download Printable QR
        </button>

        <a
          href={checkInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 text-xs text-sky-600 hover:underline mt-1"
        >
          Open Check-In Page <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
