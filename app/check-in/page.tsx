import { getCurrentUser } from "@/lib/auth/session";
import Navbar from "@/components/Navbar";
import AttendanceCheckInFlow from "@/components/AttendanceCheckInFlow";

interface CheckInPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CheckInPage({ searchParams }: CheckInPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const token = params.token || "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 px-4 py-6">
        <AttendanceCheckInFlow token={token} />
      </main>
    </div>
  );
}
