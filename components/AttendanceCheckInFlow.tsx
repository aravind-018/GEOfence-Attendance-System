"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Clock,
  Navigation,
  FileText,
  Send,
} from "lucide-react";
import { formatKolkataDateTime, formatKolkataTime } from "@/lib/utils/date";

interface AttendanceCheckInFlowProps {
  token: string;
}

export default function AttendanceCheckInFlow({ token }: AttendanceCheckInFlowProps) {
  const [locState, setLocState] = useState<"IDLE" | "REQUESTING" | "DETECTED" | "ERROR">("IDLE");
  const [locationError, setLocationError] = useState<string | null>(null);

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic Form State
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<any>(null);

  // 1. Request Geolocation
  const requestLocation = useCallback(() => {
    setLocState("REQUESTING");
    setLocationError(null);
    setValidationError(null);
    setValidationResult(null);

    if (!navigator.geolocation) {
      setLocState("ERROR");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy: Math.round(accuracy * 10) / 10 });
        setLocState("DETECTED");
      },
      (error) => {
        setLocState("ERROR");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please allow location access in your browser settings to verify attendance."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information unavailable. Please check your device GPS signal."
            );
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("An unknown location error occurred. Please retry.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Auto request location on mount
  useEffect(() => {
    if (!coords && locState === "IDLE") {
      requestLocation();
    }
  }, [coords, locState, requestLocation]);

  // 2. Validate Location & Fetch Form Fields from Server
  const validateWithServer = useCallback(
    async (lat: number, lon: number, accuracy: number) => {
      setValidating(true);
      setValidationError(null);

      try {
        const res = await fetch("/api/attendance/validate-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            latitude: lat,
            longitude: lon,
            gpsAccuracyMeters: accuracy,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.error || "Failed to validate location with server.");
          setValidationResult(data);
        } else {
          setValidationResult(data);
          if (data.formFields) {
            setFormFields(data.formFields);
            // Pre-populate initial form data state
            const initial: Record<string, any> = {};
            data.formFields.forEach((f: any) => {
              if (f.type === "CHECKBOX") {
                initial[f.key] = [];
              } else {
                initial[f.key] = "";
              }
            });
            setFormData(initial);
          }
        }
      } catch (e) {
        setValidationError("Network error validating location.");
      } finally {
        setValidating(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (locState === "DETECTED" && coords) {
      validateWithServer(coords.latitude, coords.longitude, coords.accuracy);
    }
  }, [locState, coords, validateWithServer]);

  // Handle Input Changes
  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleCheckboxToggle = (key: string, option: string) => {
    setFormData((prev) => {
      const currentList: string[] = Array.isArray(prev[key]) ? prev[key] : [];
      if (currentList.includes(option)) {
        return { ...prev, [key]: currentList.filter((item) => item !== option) };
      } else {
        return { ...prev, [key]: [...currentList, option] };
      }
    });
  };

  // 3. Submit Attendance Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords || !token) return;

    // Client-side quick check
    const errors: Record<string, string> = {};
    formFields.forEach((field) => {
      if (field.required) {
        const val = formData[field.key];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[field.key] = `${field.label} is required.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCheckingIn(true);
    setValidationError(null);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          latitude: coords.latitude,
          longitude: coords.longitude,
          gpsAccuracyMeters: coords.accuracy,
          formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setValidationError(data.error || "Form submission failed.");
        if (data.geofence) {
          setValidationResult((prev: any) => ({ ...prev, geofence: data.geofence }));
        }
      } else {
        setCheckInSuccess(data);
      }
    } catch (err) {
      setValidationError("Failed to submit check-in due to a network error.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-xl shadow border border-slate-200 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Invalid QR Code</h2>
        <p className="text-sm text-slate-600 mt-2">
          No workplace QR token detected. Please scan a valid workplace QR code.
        </p>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (checkInSuccess) {
    const { attendance } = checkInSuccess;
    return (
      <div className="max-w-md mx-auto my-6 p-6 bg-white rounded-2xl shadow-xl border border-emerald-100 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Attendance Recorded Successfully!</h2>
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-6">
          Location Verified & Form Submitted ✓
        </p>

        {/* Summary Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 text-xs text-slate-700 mb-6">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Workplace</span>
            <span className="font-bold text-slate-900">{attendance.workplaceName}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Submitted Name</span>
            <span className="font-bold text-slate-900">{attendance.name}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Check-In Time</span>
            <span className="font-bold text-slate-900">{formatKolkataDateTime(attendance.checkInTime)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Date</span>
            <span className="font-bold text-slate-900">{attendance.date}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Verified Distance</span>
            <span className="font-bold text-emerald-600">{attendance.distanceMeters} m from center</span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-md"
        >
          Submit Another Entry
        </button>
      </div>
    );
  }

  const geofence = validationResult?.geofence;
  const isInside = geofence?.isValid;

  return (
    <div className="max-w-md mx-auto my-4 p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-slate-200 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Workplace Attendance Form</h2>
          <p className="text-xs text-slate-500">Scan & Geofence Verification</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
          <MapPin className="w-4 h-4" />
        </div>
      </div>

      {/* Location Status Card */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-sky-600 animate-pulse" /> Location Verification
          </span>
          <button
            onClick={requestLocation}
            disabled={locState === "REQUESTING" || validating}
            className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" /> Refresh GPS
          </button>
        </div>

        {locState === "REQUESTING" && (
          <div className="py-4 text-center">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">Detecting location...</p>
          </div>
        )}

        {locState === "ERROR" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-2">
            <p className="font-semibold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Location Detection Failed
            </p>
            <p>{locationError}</p>
            <button
              onClick={requestLocation}
              className="mt-2 w-full py-1.5 bg-red-600 text-white rounded font-medium text-xs hover:bg-red-700"
            >
              Retry Location Permission
            </button>
          </div>
        )}

        {locState === "DETECTED" && coords && (
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between items-center text-slate-600">
              <span>GPS Status</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Location detected ✓
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Detected Accuracy</span>
              <span
                className={`font-semibold ${
                  geofence?.isAccuracyAcceptable === false ? "text-amber-600" : "text-slate-900"
                }`}
              >
                {coords.accuracy} m
              </span>
            </div>

            {validating && (
              <p className="text-[11px] text-sky-600 font-medium animate-pulse text-center py-1">
                Validating workplace geofence on server...
              </p>
            )}

            {geofence && !validating && (
              <>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Distance from Workplace</span>
                  <span className="font-bold text-slate-900">{geofence.distanceMeters} m</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Allowed Radius</span>
                  <span className="font-semibold text-slate-800">{geofence.radiusMeters} m</span>
                </div>

                <div
                  className={`mt-2 p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                    geofence.isValid
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {geofence.isValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Inside authorized workplace area ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{geofence.message}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <p className="font-bold mb-0.5">Submission Error</p>
          <p>{validationError}</p>
        </div>
      )}

      {/* DYNAMIC PUBLIC ATTENDANCE FORM (Rendered when inside geofence) */}
      {isInside && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" /> Enter Attendance Details
            </span>
            <span className="text-[10px] text-slate-400 font-medium">* Required fields</span>
          </div>

          {formFields.map((field) => {
            const fieldError = formErrors[field.key];
            const options: string[] = Array.isArray(field.options) ? (field.options as string[]) : [];

            return (
              <div key={field.id} className="space-y-1 text-xs">
                <label className="block font-semibold text-slate-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.helpText && (
                  <p className="text-[10px] text-slate-400">{field.helpText}</p>
                )}

                {/* TEXT / EMAIL / PHONE / NUMBER / DATE */}
                {["TEXT", "EMAIL", "PHONE", "NUMBER", "DATE"].includes(field.type) && (
                  <input
                    type={
                      field.type === "EMAIL"
                        ? "email"
                        : field.type === "NUMBER"
                        ? "number"
                        : field.type === "DATE"
                        ? "date"
                        : field.type === "PHONE"
                        ? "tel"
                        : "text"
                    }
                    placeholder={field.placeholder || ""}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 ${
                      fieldError ? "border-red-400 bg-red-50/30" : "border-slate-300"
                    }`}
                  />
                )}

                {/* LONGTEXT / TEXTAREA */}
                {field.type === "LONGTEXT" && (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder || ""}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 ${
                      fieldError ? "border-red-400 bg-red-50/30" : "border-slate-300"
                    }`}
                  />
                )}

                {/* DROPDOWN / SELECT */}
                {field.type === "DROPDOWN" && (
                  <select
                    value={formData[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 ${
                      fieldError ? "border-red-400 bg-red-50/30" : "border-slate-300"
                    }`}
                  >
                    <option value="">Select option...</option>
                    {options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* RADIO BUTTONS */}
                {field.type === "RADIO" && (
                  <div className="space-y-1.5 pt-1">
                    {options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          value={opt}
                          checked={formData[field.key] === opt}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-4 h-4 text-sky-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* CHECKBOXES */}
                {field.type === "CHECKBOX" && (
                  <div className="space-y-1.5 pt-1">
                    {options.map((opt, i) => {
                      const checked = (formData[field.key] || []).includes(opt);
                      return (
                        <label key={i} className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            value={opt}
                            checked={checked}
                            onChange={() => handleCheckboxToggle(field.key, opt)}
                            className="w-4 h-4 text-sky-600 rounded"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {fieldError && <p className="text-[11px] text-red-500 font-medium">{fieldError}</p>}
              </div>
            );
          })}

          {/* Privacy Notice */}
          <div className="pt-2 text-[10px] text-slate-400 text-center leading-relaxed">
            Your information and GPS location are collected solely for workplace attendance and verification purposes.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={checkingIn}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base tracking-wide rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {checkingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying & Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>CHECK IN / SUBMIT</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
