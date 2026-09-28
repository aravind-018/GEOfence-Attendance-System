"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Calendar, Building, MapPin, Filter } from "lucide-react";

export default function AdminReportsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<any[]>([]);

  const [date, setDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [reportType, setReportType] = useState("daily");

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data.departments || []));

    fetch("/api/workplaces")
      .then((res) => res.json())
      .then((data) => setWorkplaces(data.workplaces || []));
  }, []);

  const handleExportCsv = () => {
    const query = new URLSearchParams({
      export: "true",
      type: reportType,
    });

    if (date) query.set("date", date);
    if (departmentId) query.set("departmentId", departmentId);
    if (workplaceId) query.set("workplaceId", workplaceId);

    window.open(`/api/admin/reports?${query.toString()}`, "_blank");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Reports</h1>
        <p className="text-xs text-slate-500 font-medium">
          Generate and export Excel-compatible CSV reports for daily, monthly, and team attendance
        </p>
      </div>

      {/* Report Generator Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-2xl space-y-6">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600" /> Custom Attendance Report Generator
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Report Scope</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none"
            >
              <option value="daily">Daily Attendance Summary</option>
              <option value="monthly">Monthly Attendance Log</option>
              <option value="department">Department Attendance</option>
              <option value="workplace">Workplace Geofence Audit</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Filter Date (Optional)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workplace</label>
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
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Format: UTF-8 CSV with Excel BOM compatibility
          </span>

          <button
            onClick={handleExportCsv}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export CSV File
          </button>
        </div>
      </div>
    </main>
  );
}
