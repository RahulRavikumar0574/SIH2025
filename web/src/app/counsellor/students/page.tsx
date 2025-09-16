"use client";

import { useEffect, useState } from "react";

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
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Roll No</th>
                <th className="py-2 px-3">Institute</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 px-3">{s.name || "—"}</td>
                  <td className="py-2 px-3">{s.email}</td>
                  <td className="py-2 px-3">{s.rollNo}</td>
                  <td className="py-2 px-3">{s.instituteName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
