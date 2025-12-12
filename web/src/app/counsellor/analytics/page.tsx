import { headers } from "next/headers";
type Summary = { total: number; NEGATIVE: number; NEUTRAL: number; POSITIVE: number };

export default async function CounsellorAnalyticsPage() {
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const resp = await fetch(`${base}/api/counsellor/analytics`, { cache: 'no-store', headers: { cookie: hdrs.get('cookie') ?? '' } });
  let summary: Summary = { total: 0, NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 };
  let perStudent: Array<{ student: { id: string; name: string | null; email: string }; NEGATIVE: number; NEUTRAL: number; POSITIVE: number; lastAt: string | null }> = [];
  if (resp.ok) {
    const data = await resp.json();
    summary = data?.summary || summary;
    perStudent = data?.perStudent || [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Total predictions</div><div className="text-xl font-semibold">{summary.total}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Negative</div><div className="text-xl font-semibold text-red-600">{summary.NEGATIVE}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Neutral</div><div className="text-xl font-semibold text-yellow-600">{summary.NEUTRAL}</div></div>
        <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Positive</div><div className="text-xl font-semibold text-green-600">{summary.POSITIVE}</div></div>
      </div>

      <div className="border rounded">
        <div className="p-3 font-medium border-b">By Student</div>
        <div className="divide-y">
          {perStudent.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No data yet.</div>
          )}
          {perStudent.map((row) => (
            <div key={row.student.id} className="p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{row.student.name || row.student.email}</div>
                <div className="text-xs text-muted-foreground">Last activity: {row.lastAt ? new Date(row.lastAt).toLocaleString() : '—'}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-red-600">NEG: {row.NEGATIVE}</span>
                <span className="text-yellow-600">NEU: {row.NEUTRAL}</span>
                <span className="text-green-600">POS: {row.POSITIVE}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
