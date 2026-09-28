"use client";

import { useState, useEffect } from "react";
import { QrCode, RefreshCw, Printer, Copy, Check, ExternalLink } from "lucide-react";
import QRDisplay from "@/components/QRDisplay";
import Link from "next/link";
import { formatKolkataDateTime } from "@/lib/utils/date";

export default function AdminQRCodesPage() {
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const loadWorkplaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workplaces");
      const data = await res.json();
      setWorkplaces(data.workplaces || []);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkplaces();
  }, []);

  const handleRegenerateQR = async (workplaceId: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to REGENERATE the QR code for "${name}"? The previous QR code token will be permanently invalidated.`
      )
    ) {
      return;
    }

    setRegeneratingId(workplaceId);
    try {
      const res = await fetch(`/api/workplaces/${workplaceId}/qr/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        await loadWorkplaces();
      } else {
        alert("Failed to regenerate QR code.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workplace QR Code Management</h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate, preview, regenerate, and print secure workplace check-in QR codes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          Loading QR codes...
        </div>
      ) : workplaces.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          No workplaces configured. Please add a workplace first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workplaces.map((wp) => {
            const activeQr = wp.qrCodes && wp.qrCodes[0];
            return (
              <div
                key={wp.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{wp.name}</h3>
                      <p className="text-xs text-slate-400">
                        Geofence Radius: {wp.radiusMeters}m
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] uppercase ${
                        wp.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {wp.status}
                    </span>
                  </div>

                  {/* QR Display component */}
                  {activeQr ? (
                    <QRDisplay
                      token={activeQr.token}
                      workplaceName={wp.name}
                      active={activeQr.active && wp.status === "ACTIVE"}
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      No active QR code generated yet.
                    </div>
                  )}
                </div>

                {activeQr && (
                  <div className="text-[11px] text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Token Created:</span>
                      <span className="font-semibold text-slate-800">
                        {formatKolkataDateTime(activeQr.createdAt)}
                      </span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleRegenerateQR(wp.id, wp.name)}
                        disabled={regeneratingId === wp.id}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === wp.id ? "animate-spin" : ""}`} />
                        Regenerate Token
                      </button>

                      <Link
                        href={`/admin/qr-codes/${wp.id}/print`}
                        target="_blank"
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Poster
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
