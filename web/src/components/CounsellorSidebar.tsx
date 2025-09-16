"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Profile", href: "/counsellor/profile" },
  { label: "All Student List", href: "/counsellor/students" },
  { label: "Student Session Data", href: "/counsellor/student-data" },
  { label: "Chats", href: "/counsellor/chats" },
  { label: "Scheduler", href: "/counsellor/scheduler" },
  { label: "Alerts", href: "/counsellor/alerts" },
  { label: "Analytics", href: "/counsellor/analytics" },
];

export default function CounsellorSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-[var(--color-surface)] border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-screen p-4">
      <h2 className="text-lg font-bold mb-6 text-[var(--color-primary)]">Counsellor Portal</h2>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-2 font-medium text-[var(--color-foreground)] hover:bg-[var(--color-primary)]/10 transition ${
              pathname === item.href ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
