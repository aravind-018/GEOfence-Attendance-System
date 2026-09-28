import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";
import { MapPin, ShieldCheck, QrCode, Smartphone } from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/employee");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col justify-between">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/30">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight leading-tight">GEOPresence</h1>
            <p className="text-xs text-sky-400 font-semibold tracking-wider uppercase">Attendance System</p>
          </div>
        </div>

        <Link
          href="/login"
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-sky-600/20"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-sky-400" /> Enterprise QR + GPS Geofencing
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Secure, Precise & Contactless Workplace Attendance
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Verify employee presence with sub-meter GPS accuracy, dynamic workplace QR codes, and server-side geofence logic built for modern distributed operations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-base transition shadow-xl shadow-sky-500/25"
          >
            Employee / Admin Login
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl backdrop-blur">
            <QrCode className="w-8 h-8 text-sky-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Dynamic QR Codes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Workplace QR codes contain encrypted tokens for location validation without exposing employee data.
            </p>
          </div>

          <div className="p-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl backdrop-blur">
            <MapPin className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Server Geofencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Haversine mathematical verification calculates exact distances and rejects spoofed coordinates.
            </p>
          </div>

          <div className="p-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl backdrop-blur">
            <Smartphone className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Mobile First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamless mobile check-in experience designed for high precision GPS hardware on iOS and Android.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-800/80">
        © 2026 GEOfence Attendance System. All rights reserved.
      </footer>
    </div>
  );
}
