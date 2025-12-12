import { headers } from "next/headers";

export default async function AdminDashboardPage() {
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

  const resp = await fetch(`${base}/api/admin/analytics`, { cache: 'no-store', headers: { cookie: hdrs.get('cookie') ?? '' } });
  let summary: { total: number; NEGATIVE: number; NEUTRAL: number; POSITIVE: number } = { total: 0, NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 };
  let users: { STUDENT: number; COUNSELLOR: number; ADMIN: number } = { STUDENT: 0, COUNSELLOR: 0, ADMIN: 0 };
  if (resp.ok) {
    const data = await resp.json();
    summary = data?.summary || summary;
    users = data?.users || users;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Total predictions</div><div className="text-xl font-semibold">{summary.total}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Negative</div><div className="text-xl font-semibold text-red-600">{summary.NEGATIVE}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Neutral</div><div className="text-xl font-semibold text-yellow-600">{summary.NEUTRAL}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Positive</div><div className="text-xl font-semibold text-green-600">{summary.POSITIVE}</div></div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Students</div><div className="text-xl font-semibold">{users.STUDENT}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Counsellors</div><div className="text-xl font-semibold">{users.COUNSELLOR}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Admins</div><div className="text-xl font-semibold">{users.ADMIN}</div></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <a className="p-3 border rounded hover:bg-[var(--color-primary)]/5" href="/admin/users"><div className="font-medium">Manage Users</div><div className="text-sm text-muted-foreground">View and filter by role</div></a>
        <a className="p-3 border rounded hover:bg-[var(--color-primary)]/5" href="/admin/assignments"><div className="font-medium">Assignments</div><div className="text-sm text-muted-foreground">Assign unassigned students</div></a>
      </div>
    </div>
  );
}
