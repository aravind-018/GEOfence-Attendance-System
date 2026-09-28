"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building, Users, X } from "lucide-react";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    organization: "GEOPresence Corp",
    status: "ACTIVE",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: "", organization: "GEOPresence Corp", status: "ACTIVE" });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, organization: dept.organization, status: dept.status });
    setFormError(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create department.");
      } else {
        setShowAddModal(false);
        loadDepartments();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/departments/${editingDept.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update department.");
      } else {
        setEditingDept(null);
        loadDepartments();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;

    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cannot delete department.");
      } else {
        loadDepartments();
      }
    } catch {
      alert("Network error deleting department.");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Department Management</h1>
          <p className="text-xs text-slate-500 font-medium">Create and manage organizational departments</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Grid of Department Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          No departments configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                    <p className="text-xs text-slate-400">{dept.organization}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] uppercase ${
                    dept.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {dept.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" /> {dept._count?.employees || 0} Assigned Employees
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition"
                    title="Edit Department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id, dept.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(showAddModal || editingDept) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingDept ? "Edit Department" : "Add New Department"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDept(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={editingDept ? handleSubmitEdit : handleSubmitAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Sales"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization</label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingDept ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
