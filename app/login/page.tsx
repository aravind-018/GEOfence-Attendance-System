"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, User, ShieldCheck, Lock, Mail, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [roleTab, setRoleTab] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: roleTab,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
      } else {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (data.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/employee");
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const setSampleCredentials = (type: "admin" | "employee") => {
    if (type === "admin") {
      setRoleTab("ADMIN");
      setEmail("admin@geopresence.com");
      setPassword("Admin@123");
    } else {
      setRoleTab("EMPLOYEE");
      setEmail("rahul@geopresence.com");
      setPassword("Employee@123");
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-600/30">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">GEOPresence</h2>
        <p className="text-xs text-slate-500 font-medium">Sign in to access attendance portal</p>
      </div>

      {/* Role Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setRoleTab("EMPLOYEE");
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            roleTab === "EMPLOYEE"
              ? "bg-white text-sky-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-3.5 h-3.5" /> Employee Login
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleTab("ADMIN");
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            roleTab === "ADMIN"
              ? "bg-white text-sky-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Admin Login
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={roleTab === "ADMIN" ? "admin@geopresence.com" : "rahul@geopresence.com"}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-sky-600/20 disabled:opacity-50"
        >
          {loading ? "Signing in..." : `Sign In as ${roleTab}`}
        </button>
      </form>

      {/* Demo Quick Credentials */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] font-semibold text-slate-500 mb-2">Development Seed Credentials:</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setSampleCredentials("admin")}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
          >
            Fill Admin
          </button>
          <button
            type="button"
            onClick={() => setSampleCredentials("employee")}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
          >
            Fill Employee
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading Login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
