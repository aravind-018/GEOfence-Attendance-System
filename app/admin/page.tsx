import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getFormattedTodayDate, formatKolkataTime } from "@/lib/utils/date";
import Link from "next/link";
import { Users, UserCheck, UserX, MapPin, Percent, ArrowRight, Clock, Building } from "lucide-react";

export default async function AdminDashboardPage() {
  const todayStr = getFormattedTodayDate();

  const [
    totalEmployees,
    activeEmployees,
    todayPresentCount,
    totalWorkplaces,
    recentCheckIns,
    departments,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({ where: { date: todayStr } }),
    prisma.workplace.count(),
    prisma.attendance.findMany({
      take: 8,
      orderBy: { checkInTime: "desc" },
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
            department: { select: { name: true } },
          },
        },
        workplace: { select: { name: true } },
      },
    }),
    prisma.department.findMany({
      include: {
        _count: { select: { employees: true } },
      },
    }),
  ]);

  const todayAbsentCount = Math.max(0, activeEmployees - todayPresentCount);
  const attendancePercentage =
    activeEmployees > 0 ? Math.round((todayPresentCount / activeEmployees) * 100) : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium">
          Real-time workforce geofence attendance analytics for {todayStr} (IST)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalEmployees}</p>
          <p className="text-[10px] text-slate-500 mt-1">{activeEmployees} Active Accounts</p>
        </div>

        {/* Today Present */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{todayPresentCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Checked in today</p>
        </div>

        {/* Today Absent */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{todayAbsentCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Pending check-in</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rate</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{attendancePercentage}%</p>
          <p className="text-[10px] text-slate-500 mt-1">Turnout percentage</p>
        </div>

        {/* Total Workplaces */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Workplaces</span>
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalWorkplaces}</p>
          <p className="text-[10px] text-slate-500 mt-1">Configured geofences</p>
        </div>

        {/* Date Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Timezone</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Asia/Kolkata</p>
            <p className="text-[10px] text-slate-400">UTC+05:30</p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Check-Ins Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Geofence Check-Ins</h2>
              <p className="text-xs text-slate-500">Latest employee check-in activity</p>
            </div>
            <Link
              href="/admin/attendance"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No check-ins recorded today yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Workplace</th>
                    <th className="px-5 py-3">Check-In Time</th>
                    <th className="px-5 py-3">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCheckIns.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{rec.name || rec.employee?.name || "Attendee"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rec.employeeCode || rec.employee?.employeeId || "Public Entry"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {rec.departmentName || rec.employee?.department?.name || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold">{rec.workplace.name}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {formatKolkataTime(rec.checkInTime)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono">
                        {rec.distanceFromWorkplaceMeters} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Department Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Department Summary</h2>
              <p className="text-xs text-slate-500">Staff distribution by team</p>
            </div>
            <Building className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div>
                  <h3 className="font-bold text-xs text-slate-800">{dept.name}</h3>
                  <p className="text-[10px] text-slate-500">{dept.organization}</p>
                </div>
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
                  {dept._count.employees} Staff
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/departments"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              Manage Departments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
