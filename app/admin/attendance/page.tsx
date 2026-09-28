"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Filter, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { formatKolkataTime } from "@/lib/utils/date";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<any[]>([]);

  // Filters
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data.departments || []));

    fetch("/api/workplaces")
      .then((res) => res.json())
      .then((data) => setWorkplaces(data.workplaces || []));
  }, []);

  const loadAttendance = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: "20",
      });

      if (date) query.set("date", date);
      if (search) query.set("search", search);
      if (departmentId) query.set("departmentId", departmentId);
      if (workplaceId) query.set("workplaceId", workplaceId);
      if (status) query.set("status", status);

      try {
        const res = await fetch(`/api/admin/attendance?${query.toString()}`);
        const data = await res.json();
        setRecords(data.attendances || []);
        if (data.pagination) setPagination(data.pagination);
      } catch {
        // Error
      } finally {
        setLoading(false);
      }
    },
    [date, search, departmentId, workplaceId, status]
  );

  useEffect(() => {
    loadAttendance(1);
  }, [loadAttendance]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Records</h1>
        <p className="text-xs text-slate-500 font-medium">
          Comprehensive audit logs for all employee geofenced check-ins
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee Search</label>
          <input
            type="text"
            placeholder="Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Workplace */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Workplace</label>
          <select
            value={workplaceId}
            onChange={(e) => setWorkplaceId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="">All Workplaces</option>
            {workplaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-bold"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="INVALID">INVALID</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading attendance records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No attendance records found matching filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Workplace</th>
                    <th className="px-4 py-3">Check-In Time</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">GPS Accuracy</th>
                    <th className="px-4 py-3">Coordinates</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{r.date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">{r.employee?.employeeId}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.employee?.name}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{r.employee?.department?.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.workplace?.name}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatKolkataTime(r.checkInTime)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{r.distanceFromWorkplaceMeters} m</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{r.gpsAccuracyMeters} m</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-slate-400">
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing page <strong className="text-slate-900">{pagination.page}</strong> of{" "}
                <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} total records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadAttendance(pagination.page - 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadAttendance(pagination.page + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
