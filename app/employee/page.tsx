import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getFormattedTodayDate, formatKolkataDateTime, formatKolkataTime } from "@/lib/utils/date";
import Navbar from "@/components/Navbar";
import { User, MapPin, Calendar, Clock, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "EMPLOYEE" || !user.employee) {
    redirect("/login");
  }

  const todayStr = getFormattedTodayDate();

  // Fetch today's check-in
  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: user.employee.id,
        date: todayStr,
      },
    },
    include: { workplace: { select: { name: true } } },
  });

  // Fetch recent attendance history
  const recentAttendances = await prisma.attendance.findMany({
    where: { employeeId: user.employee.id },
    include: { workplace: { select: { name: true } } },
    orderBy: { checkInTime: "desc" },
    take: 15,
  });

  const employee = user.employee;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Profile & Today Status Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
                  <p className="text-xs text-slate-500 font-medium">{employee.departmentName}</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono text-xs font-bold rounded-lg border border-sky-200">
                {employee.employeeId}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-700">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Email</p>
                <p className="font-semibold text-slate-800 truncate">{employee.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Mobile</p>
                <p className="font-semibold text-slate-800">{employee.mobileNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Organization</p>
                <p className="font-semibold text-slate-800">{employee.organization}</p>
              </div>
            </div>
          </div>

          {/* Today's Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Status</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            <div className="my-4">
              {todayAttendance ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                    <CheckCircle2 className="w-6 h-6" /> Present
                  </div>
                  <p className="text-xs text-slate-500">
                    Checked in at <span className="font-semibold text-slate-800">{formatKolkataTime(todayAttendance.checkInTime)}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">Workplace: {todayAttendance.workplace.name}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-lg">
                    <Clock className="w-6 h-6 animate-pulse" /> Not Checked In
                  </div>
                  <p className="text-xs text-slate-500">Please scan workplace QR code to check in.</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2">
              Date: {todayStr} (IST)
            </p>
          </div>
        </div>

        {/* Recent Attendance History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">My Attendance History</h2>
              <p className="text-xs text-slate-500">Recent check-in records and verified GPS metrics</p>
            </div>
          </div>

          {recentAttendances.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No attendance records found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Check-In Time</th>
                    <th className="px-5 py-3">Workplace</th>
                    <th className="px-5 py-3">Distance</th>
                    <th className="px-5 py-3">GPS Accuracy</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendances.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-medium font-mono text-slate-900">{rec.date}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {formatKolkataTime(rec.checkInTime)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{rec.workplace.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{rec.distanceFromWorkplaceMeters} m</td>
                      <td className="px-5 py-3.5 text-slate-600">{rec.gpsAccuracyMeters} m</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
