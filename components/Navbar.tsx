"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, MapPin, User, Building, Users, QrCode, FileText, LayoutDashboard, Settings } from "lucide-react";

interface NavbarProps {
  user?: {
    name?: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    employeeId?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const isAdmin = user?.role === "ADMIN";

  const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Attendance", href: "/admin/attendance", icon: FileText },
    { label: "Employees", href: "/admin/employees", icon: Users },
    { label: "Departments", href: "/admin/departments", icon: Building },
    { label: "Workplaces", href: "/admin/workplaces", icon: MapPin },
    { label: "QR Codes", href: "/admin/qr-codes", icon: QrCode },
    { label: "Reports", href: "/admin/reports", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <Link href={isAdmin ? "/admin" : "/employee"} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                  GEOPresence
                </span>
                <span className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">
                  Attendance System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && isAdmin && (
            <nav className="hidden lg:flex items-center gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isActive
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile & Actions */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-white">
                  {user.name || user.email}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {user.role === "ADMIN" ? "Administrator" : `Employee ID: ${user.employeeId || "N/A"}`}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {user.role}
              </span>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile Navigation Sub-bar */}
        {user && isAdmin && (
          <div className="lg:hidden flex items-center gap-2 py-2 border-t border-slate-800 overflow-x-auto no-scrollbar">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium transition ${
                    isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
