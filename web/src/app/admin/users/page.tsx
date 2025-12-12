"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "COUNSELLOR" | "ADMIN";
  rollNo: string | null;
  instituteName: string | null;
  profileImageUrl?: string | null;
  phone?: string | null;
  shareReports?: boolean | null;
  createdAt?: string;
};

export default function AdminUsersPage() {
  const [role, setRole] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = role ? `/api/admin/users?role=${encodeURIComponent(role)}` : "/api/admin/users";
      const resp = await fetch(url, { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Manage Users</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Filter by role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded px-2 py-1">
          <option value="">All</option>
          <option value="STUDENT">Student</option>
          <option value="COUNSELLOR">Counsellor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="border rounded divide-y">
        {users.length === 0 && !loading && (
          <div className="p-3 text-sm text-muted-foreground">No users found.</div>
        )}
        {users.map((u) => (
          <div key={u.id} className="p-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{u.name || u.email}</div>
              <div className="text-xs text-muted-foreground">{u.role} • {u.rollNo || "—"} • {u.instituteName || "—"}</div>
            </div>
            <div className="text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
