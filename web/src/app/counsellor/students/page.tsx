"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string | null; email: string; rollNo: string; instituteName?: string | null };

export default function CounsellorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/assignments", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setStudents(Array.isArray(data.students) ? data.students : []);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">All Student List</h1>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : students.length === 0 ? (
        <p className="text-sm">No assigned students yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <div key={s.id} className="rounded-xl bg-[var(--color-surface)] border p-4 shadow-sm flex flex-col gap-3">
              <div>
                <div className="text-base font-semibold">{s.name || s.email}</div>
                <div className="text-xs text-[var(--color-foreground)]/80">{s.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 border rounded">
                  <div className="opacity-70 text-xs">Roll No</div>
                  <div className="font-medium break-all">{s.rollNo}</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="opacity-70 text-xs">Institute</div>
                  <div className="font-medium">{s.instituteName || "—"}</div>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/counsellor/chats?sid=${s.id}`} className="px-3 py-2 rounded bg-[var(--color-primary)] text-white text-sm">Message</Link>
                <Link href={`/counsellor/student-data?sid=${s.id}`} className="px-3 py-2 rounded border text-sm">View Data</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
