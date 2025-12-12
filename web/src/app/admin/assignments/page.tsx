"use client";

import { useEffect, useState } from "react";

type Student = { id: string; name: string | null; email: string; rollNo: string | null; instituteName: string | null };

export default function AdminAssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await fetch('/api/admin/assignments/unassigned', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to load unassigned students');
      setStudents(data.students || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load unassigned students');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function assignRandom() {
    setError(null);
    setMessage(null);
    try {
      const resp = await fetch('/api/admin/assign-random', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to assign');
      setMessage(`Assigned ${data.updated || 0} students`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to assign');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Assignments</h1>
      <div className="flex items-center gap-2">
        <button onClick={assignRandom} className="px-3 py-2 rounded bg-blue-600 text-white">Assign All Unassigned Randomly</button>
        <button onClick={load} className="px-3 py-2 rounded border">Refresh</button>
      </div>
      {message && <div className="text-sm text-green-700">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      <div className="border rounded divide-y">
        {students.length === 0 && !loading && (
          <div className="p-3 text-sm text-muted-foreground">Everyone is assigned.</div>
        )}
        {students.map((s) => (
          <div key={s.id} className="p-3">
            <div className="font-medium">{s.name || s.email}</div>
            <div className="text-xs text-muted-foreground">{s.rollNo || '—'} • {s.instituteName || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
