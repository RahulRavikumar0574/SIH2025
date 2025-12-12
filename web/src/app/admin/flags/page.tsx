"use client";

import { useEffect, useState } from "react";

type Item = { student: { id: string; name: string | null; email: string }; streak: number; lastAt: string | null };

export default function AdminFlagsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/flags', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to load flags');
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Flags</h1>
      <div className="flex items-center gap-2">
        <button onClick={load} className="px-3 py-2 rounded border">Refresh</button>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="border rounded divide-y">
        {items.length === 0 && !loading && (
          <div className="p-3 text-sm text-muted-foreground">No flagged students.</div>
        )}
        {items.map((it) => (
          <div key={it.student.id} className="p-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{it.student.name || it.student.email}</div>
              <div className="text-xs text-muted-foreground">Last activity: {it.lastAt ? new Date(it.lastAt).toLocaleString() : '—'}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">Streak: {it.streak}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
