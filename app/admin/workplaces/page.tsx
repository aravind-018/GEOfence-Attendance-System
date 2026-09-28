"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin, QrCode, Shield, CheckCircle, XCircle, X } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import Link from "next/link";

export default function AdminWorkplacesPage() {
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    latitude: 12.971598,
    longitude: 77.594562,
    radiusMeters: 100,
    maxGpsAccuracyMeters: 100,
    status: "ACTIVE",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      latitude: 12.971598,
      longitude: 77.594562,
      radiusMeters: 100,
      maxGpsAccuracyMeters: 100,
      status: "ACTIVE",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (wp: any) => {
    setEditingWorkplace(wp);
    setFormData({
      name: wp.name,
      latitude: wp.latitude,
      longitude: wp.longitude,
      radiusMeters: wp.radiusMeters,
      maxGpsAccuracyMeters: wp.maxGpsAccuracyMeters,
      status: wp.status,
    });
    setFormError(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/workplaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          radiusMeters: Number(formData.radiusMeters),
          maxGpsAccuracyMeters: Number(formData.maxGpsAccuracyMeters),
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create workplace.");
      } else {
        setShowAddModal(false);
        loadWorkplaces();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkplace) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/workplaces/${editingWorkplace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          radiusMeters: Number(formData.radiusMeters),
          maxGpsAccuracyMeters: Number(formData.maxGpsAccuracyMeters),
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update workplace.");
      } else {
        setEditingWorkplace(null);
        loadWorkplaces();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workplace "${name}"?`)) return;

    try {
      const res = await fetch(`/api/workplaces/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadWorkplaces();
      } else {
        alert("Failed to delete workplace.");
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workplace Management</h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure workplace coordinates, geofence radius, and GPS accuracy thresholds
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Workplace
        </button>
      </div>

      {/* Grid of Workplaces */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          Loading workplaces...
        </div>
      ) : workplaces.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          No workplaces configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workplaces.map((wp) => (
            <div
              key={wp.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{wp.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Lat: {wp.latitude}, Lon: {wp.longitude}
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

              {/* Map Preview */}
              <MapPicker
                latitude={wp.latitude}
                longitude={wp.longitude}
                radiusMeters={wp.radiusMeters}
                onLocationSelect={() => {}}
                readOnly={true}
              />

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Radius</p>
                  <p className="font-bold text-slate-900">{wp.radiusMeters} m</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Max Accuracy</p>
                  <p className="font-bold text-slate-900">{wp.maxGpsAccuracyMeters} m</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Check-Ins</p>
                  <p className="font-bold text-sky-700">{wp._count?.attendances || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href="/admin/qr-codes"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 hover:underline"
                >
                  <QrCode className="w-4 h-4" /> Manage QR Code
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(wp)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition"
                    title="Edit Workplace"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(wp.id, wp.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition"
                    title="Delete Workplace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT WORKPLACE MODAL */}
      {(showAddModal || editingWorkplace) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingWorkplace ? "Edit Workplace" : "Add New Workplace"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingWorkplace(null);
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

            <form onSubmit={editingWorkplace ? handleSubmitEdit : handleSubmitAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workplace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HQ Tech Park, Branch Office 2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Map Location Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Location on Map <span className="text-slate-400 font-normal">(Click map to pick lat/lon)</span>
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  radiusMeters={formData.radiusMeters}
                  onLocationSelect={(lat, lng) => {
                    setFormData({ ...formData, latitude: lat, longitude: lng });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="5000"
                    value={formData.radiusMeters}
                    onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max GPS Accuracy (m)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="1000"
                    value={formData.maxGpsAccuracyMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, maxGpsAccuracyMeters: parseInt(e.target.value, 10) || 100 })
                    }
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
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingWorkplace(null);
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
                  {submitting ? "Saving..." : editingWorkplace ? "Update Workplace" : "Create Workplace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
