import { headers } from "next/headers";
type Meeting = {
  id: string;
  studentId: string;
  counsellorId: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  status: string;
  createdAt: string;
};

function groupByDate(meetings: Meeting[]) {
  const map = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const key = new Date(m.startTime).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  // Sort each day's meetings by time
  for (const [, arr] of map) arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  // Return sorted by date asc
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default async function CounsellorDashboardPage() {
  // Build absolute base URL for server-side fetch
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

  // Fetch meetings (role-aware endpoint)
  const resp = await fetch(`${base}/api/meetings`, { cache: 'no-store', headers: { cookie: hdrs.get('cookie') ?? '' } });
  let meetings: Meeting[] = [];
  if (resp.ok) {
    const data = await resp.json();
    meetings = data?.meetings || [];
  }
  const upcoming = meetings.filter((m) => new Date(m.endTime).getTime() >= Date.now());
  const grouped = groupByDate(upcoming);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Counsellor Dashboard</h1>
      <p className="text-sm text-[var(--color-foreground)]/70">Overview of your students, alerts and schedule.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Upcoming Meetings</h2>
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
          )}
          <div className="space-y-3">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{new Date(date).toDateString()}</div>
                <div className="space-y-2">
                  {items.map((m) => (
                    <div key={m.id} className="p-2 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(m.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-muted-foreground">With: {(m as any).student?.name || (m as any).student?.email || 'Student'}</div>
                        <div className="text-xs text-muted-foreground">Reason: {m.reason || '—'}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border">{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Flagged Students</h2>
          <p className="text-sm">Alerts page will list students who cross the NEGATIVE streak threshold.</p>
        </div>
      </div>
    </div>
  );
}

