import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
