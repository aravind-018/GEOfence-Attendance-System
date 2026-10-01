"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  X,
  FileText,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface AdminFormBuilderProps {
  params: Promise<{ id: string }>;
}

export default function AdminWorkplaceFormBuilderPage({ params }: AdminFormBuilderProps) {
  const { id: workplaceId } = use(params);

  const [workplace, setWorkplace] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    label: "",
    type: "TEXT",
    placeholder: "",
    helpText: "",
    required: true,
    active: true,
    optionsRaw: "", // Newline or comma separated options string
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wpRes, fieldsRes] = await Promise.all([
        fetch(`/api/workplaces/${workplaceId}`),
        fetch(`/api/admin/workplaces/${workplaceId}/form`),
      ]);

      const wpData = await wpRes.json();
      const fieldsData = await fieldsRes.json();

      setWorkplace(wpData.workplace);
      setFields(fieldsData.formFields || []);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workplaceId]);

  const handleOpenAdd = () => {
    setFormData({
      label: "",
      type: "TEXT",
      placeholder: "",
      helpText: "",
      required: true,
      active: true,
      optionsRaw: "",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (field: any) => {
    setEditingField(field);
    const opts = Array.isArray(field.options) ? (field.options as string[]).join("\n") : "";
    setFormData({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      required: field.required,
      active: field.active,
      optionsRaw: opts,
    });
    setFormError(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const options = ["DROPDOWN", "RADIO", "CHECKBOX"].includes(formData.type)
      ? formData.optionsRaw
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : null;

    try {
      const res = await fetch(`/api/admin/workplaces/${workplaceId}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label,
          type: formData.type,
          placeholder: formData.placeholder,
          helpText: formData.helpText,
          required: formData.required,
          active: formData.active,
          options,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create field.");
      } else {
        setShowAddModal(false);
        loadData();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    setSubmitting(true);
    setFormError(null);

    const options = ["DROPDOWN", "RADIO", "CHECKBOX"].includes(formData.type)
      ? formData.optionsRaw
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : null;

    try {
      const res = await fetch(`/api/admin/workplaces/${workplaceId}/form`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: editingField.id,
          label: formData.label,
          type: formData.type,
          placeholder: formData.placeholder,
          helpText: formData.helpText,
          required: formData.required,
          active: formData.active,
          options,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update field.");
      } else {
        setEditingField(null);
        loadData();
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: string, label: string) => {
    if (
      !confirm(
        `Are you sure you want to delete field "${label}"? Historical attendance records containing this field will remain intact.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/workplaces/${workplaceId}/form?fieldId=${fieldId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        loadData();
      } else {
        alert("Failed to delete field.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    setFields(newFields);

    // Save new order to backend
    const orderedFieldIds = newFields.map((f) => f.id);
    try {
      await fetch(`/api/admin/workplaces/${workplaceId}/form/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedFieldIds }),
      });
    } catch {
      // Revert if error
      loadData();
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/workplaces"
            className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workplaces
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Attendance Form Builder: {workplace?.name || "Loading..."}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure, order, and customize public check-in form fields for this workplace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4" /> Preview Form
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>
      </div>

      {/* Form Fields List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Configured Form Fields</span>
          <span>Actions & Order</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading form configuration...</div>
        ) : fields.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No fields configured. Click "Add Field" to begin.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center gap-1 pt-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === fields.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{field.label}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      {!field.active && (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono">
                      Internal Key: <code className="text-slate-700">{field.key}</code>
                    </p>

                    {field.options && Array.isArray(field.options) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(field.options as string[]).map((opt, i) => (
                          <span key={i} className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-semibold rounded">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(field)}
                    className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Field"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id, field.label)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {(showAddModal || editingField) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingField ? "Edit Form Field" : "Add Form Field"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingField(null);
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

            <form onSubmit={editingField ? handleSubmitEdit : handleSubmitAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purpose of Visit, Vehicle Number"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="DATE">Date</option>
                  <option value="DROPDOWN">Dropdown / Select</option>
                  <option value="RADIO">Radio Buttons</option>
                  <option value="CHECKBOX">Checkboxes</option>
                  <option value="LONGTEXT">Long Text / Textarea</option>
                </select>
              </div>

              {["DROPDOWN", "RADIO", "CHECKBOX"].includes(formData.type) && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Options <span className="text-[10px] text-slate-400 font-normal">(One option per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Meeting&#10;Interview&#10;Training&#10;Other"
                    value={formData.optionsRaw}
                    onChange={(e) => setFormData({ ...formData, optionsRaw: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placeholder (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Enter details..."
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Help Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Provide registration badge number"
                  value={formData.helpText}
                  onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Required Field</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Active</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingField(null);
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
                  {submitting ? "Saving..." : editingField ? "Update Field" : "Create Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW FORM MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Public Form Preview</span>
                <h3 className="font-bold text-slate-900 text-base">{workplace?.name} Attendance</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800">
              This is a live preview of how public QR scanners will see this form. No test data will be saved.
            </div>

            <div className="space-y-4 text-xs pt-2">
              {fields
                .filter((f) => f.active)
                .map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}

                    {["TEXT", "EMAIL", "PHONE", "NUMBER", "DATE"].includes(field.type) && (
                      <input
                        disabled
                        type="text"
                        placeholder={field.placeholder || ""}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === "LONGTEXT" && (
                      <textarea
                        disabled
                        rows={3}
                        placeholder={field.placeholder || ""}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === "DROPDOWN" && (
                      <select disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-400 cursor-not-allowed">
                        <option>Select option...</option>
                        {Array.isArray(field.options) &&
                          (field.options as string[]).map((o, i) => <option key={i}>{o}</option>)}
                      </select>
                    )}

                    {field.type === "RADIO" && (
                      <div className="space-y-1 pt-1">
                        {Array.isArray(field.options) &&
                          (field.options as string[]).map((o, i) => (
                            <label key={i} className="flex items-center gap-2 text-slate-600">
                              <input disabled type="radio" /> {o}
                            </label>
                          ))}
                      </div>
                    )}

                    {field.type === "CHECKBOX" && (
                      <div className="space-y-1 pt-1">
                        {Array.isArray(field.options) &&
                          (field.options as string[]).map((o, i) => (
                            <label key={i} className="flex items-center gap-2 text-slate-600">
                              <input disabled type="checkbox" /> {o}
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
