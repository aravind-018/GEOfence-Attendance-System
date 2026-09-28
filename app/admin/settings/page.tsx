import { Settings, Globe, Shield, Clock, Database, Server } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-xs text-slate-500 font-medium">
          Global application settings, timezone strategy, and security parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timezone Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Timezone Strategy</h2>
              <p className="text-xs text-slate-500">Attendance date uniqueness calculation</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Configured Timezone</span>
              <span className="font-bold font-mono text-slate-900">Asia/Kolkata (IST)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">UTC Offset</span>
              <span className="font-bold font-mono text-slate-900">+05:30</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Check-In Uniqueness Rule</span>
              <span className="font-bold text-emerald-600">1 Check-In / Employee / Day</span>
            </div>
          </div>
        </div>

        {/* Security & Database */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Security Architecture</h2>
              <p className="text-xs text-slate-500">Server-side verification parameters</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Geofence Logic</span>
              <span className="font-bold text-slate-900">Haversine Distance (Server)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Authentication</span>
              <span className="font-bold text-slate-900">JOSE JWT in HttpOnly Cookie</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">ORM / Database</span>
              <span className="font-bold text-slate-900">Prisma 6.x PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
