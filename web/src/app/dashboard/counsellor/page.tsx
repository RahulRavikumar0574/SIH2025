"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Counsellor = {
  id: string;
  name: string | null;
  email: string;
  rollNo?: string | null; // employee ID
  instituteName?: string | null;
  profileImageUrl?: string | null;
};

export default function CounsellorDetailsPage() {
  const [counsellor, setCounsellor] = useState<Counsellor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/assignments", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setCounsellor(data.counsellor || null);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Counsellor Details</h1>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : !counsellor ? (
        <div className="rounded border p-4 bg-[var(--color-surface)]">
          <p className="text-sm">You don't have an assigned counsellor yet.</p>
          <p className="text-xs text-[var(--color-foreground)]/70 mt-1">Tip: open the Messaging page once; we auto-assign a counsellor if one isn't set.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/dashboard/messaging" className="px-3 py-2 rounded bg-[var(--color-primary)] text-white text-sm">Open Messaging</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-primary)]/10 flex items-center justify-center">
              {counsellor.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={counsellor.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg text-[var(--color-primary)]">👩‍🏫</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{counsellor.name || counsellor.email}</h2>
              <p className="text-sm text-[var(--color-foreground)]/80">{counsellor.email}</p>
              <div className="mt-2 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 border rounded">
                  <div className="opacity-70">Employee ID</div>
                  <div className="font-medium break-all">{counsellor.rollNo || "—"}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="opacity-70">Institute</div>
                  <div className="font-medium">{counsellor.instituteName || "—"}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Link href="/dashboard/messaging" className="px-3 py-2 rounded bg-[var(--color-primary)] text-white text-sm">Message</Link>
                <Link href="/dashboard/scheduler" className="px-3 py-2 rounded border text-sm">Schedule a Meeting</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
