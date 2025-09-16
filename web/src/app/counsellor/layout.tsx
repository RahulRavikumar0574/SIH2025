import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import CounsellorSidebar from "@/components/CounsellorSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function CounsellorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "COUNSELLOR") {
    redirect("/counsellor-login");
  }
  return (
    <div className="flex min-h-screen">
      <CounsellorSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <main className="flex-1 bg-[var(--background)] p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

