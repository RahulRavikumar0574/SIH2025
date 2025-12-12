import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "ADMIN") {
    redirect("/admin-login");
  }
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <main className="flex-1 bg-[var(--background)] p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
