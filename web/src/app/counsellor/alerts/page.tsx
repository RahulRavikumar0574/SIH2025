import { headers } from "next/headers";

export default async function CounsellorAlertsPage() {
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

  const resp = await fetch(`${base}/api/counsellor/alerts`, { cache: 'no-store', headers: { cookie: hdrs.get('cookie') ?? '' } });
  let items: Array<{ student: { id: string; name: string | null; email: string }, streak: number; lastAt: string | null }> = [];
  if (resp.ok) {
    const data = await resp.json();
    items = data?.items || [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <p className="text-sm text-muted-foreground">Students with current NEGATIVE streaks. Threshold is 3 by default.</p>

      <div className="border rounded divide-y">
        {items.length === 0 && (
          <div className="p-3 text-sm text-muted-foreground">No alerts at the moment.</div>
        )}
        {items.map((it) => (
          <div key={it.student.id} className="p-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{it.student.name || it.student.email}</div>
              <div className="text-xs text-muted-foreground">Last activity: {it.lastAt ? new Date(it.lastAt).toLocaleString() : '—'}</div>
            </div>
            <div>
              <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">Streak: {it.streak}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
