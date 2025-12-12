'use client';

import { useEffect, useState } from 'react';

type Student = { id: string; name: string | null; email: string; rollNo: string | null; instituteName: string | null };
type Prediction = { emotion: string; createdAt: string };
type Meeting = { id: string; startTime: string; endTime: string; reason: string | null; status: string };

export default function CounsellorStudentDataPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const resp = await fetch('/api/counsellor/students', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Failed to load students');
        const data = await resp.json();
        if (!ignore) setStudents(data.students || []);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load students');
      } finally {
        if (!ignore) setLoadingStudents(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  async function loadDetail(stu: Student) {
    setSelected(stu);
    setError(null);
    setLoadingDetail(true);
    setPredictions([]);
    setUpcoming([]);
    setRecent([]);
    try {
      const resp = await fetch(`/api/counsellor/student/${stu.id}/session-data`, { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to load data');
      setPredictions(data.predictions || []);
      setUpcoming(data.meetings?.upcoming || []);
      setRecent(data.meetings?.recent || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoadingDetail(false);
    }
  }

  function countByEmotion(items: Prediction[]) {
    const c = { NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 } as Record<string, number>;
    for (const p of items) {
      const k = String(p.emotion || '').toUpperCase();
      if (k in c) c[k]++;
    }
    return c;
  }

  const counts = countByEmotion(predictions);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 border rounded p-3">
        <h1 className="text-lg font-semibold mb-2">Assigned Students</h1>
        {loadingStudents && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loadingStudents && students.length === 0 && (
          <div className="text-sm text-muted-foreground">No students assigned.</div>
        )}
        <div className="mt-2 space-y-1 max-h-[60vh] overflow-auto">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => loadDetail(s)}
              className={`w-full text-left px-2 py-2 rounded border hover:bg-[var(--color-primary)]/10 ${selected?.id === s.id ? 'bg-[var(--color-primary)]/20' : ''}`}
            >
              <div className="font-medium">{s.name || s.email}</div>
              <div className="text-xs text-muted-foreground">{s.rollNo || '—'} • {s.instituteName || '—'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 border rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-semibold">Student Session Data</div>
            <div className="text-sm text-muted-foreground">{selected ? (selected.name || selected.email) : 'Select a student from the list'}</div>
          </div>
          {selected && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">NEGATIVE</div><div className="font-semibold text-red-600">{counts.NEGATIVE}</div></div>
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">NEUTRAL</div><div className="font-semibold text-yellow-600">{counts.NEUTRAL}</div></div>
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">POSITIVE</div><div className="font-semibold text-green-600">{counts.POSITIVE}</div></div>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {loadingDetail && selected && <div className="text-sm text-muted-foreground">Loading data…</div>}

        {selected && !loadingDetail && (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="border rounded p-2">
              <div className="font-medium mb-2">Recent Predictions</div>
              <div className="space-y-1 max-h-64 overflow-auto">
                {predictions.length === 0 && (
                  <div className="text-sm text-muted-foreground">No predictions yet.</div>
                )}
                {predictions.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-1 rounded border">
                    <span className={`${p.emotion === 'NEGATIVE' ? 'text-red-600' : p.emotion === 'POSITIVE' ? 'text-green-600' : 'text-yellow-600'}`}>{p.emotion}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded p-2">
              <div className="font-medium mb-2">Upcoming Meetings</div>
              <div className="space-y-1 max-h-64 overflow-auto">
                {upcoming.length === 0 && (
                  <div className="text-sm text-muted-foreground">No upcoming meetings.</div>
                )}
                {upcoming.map((m) => (
                  <div key={m.id} className="p-1 rounded border text-sm">
                    <div className="font-medium">{new Date(m.startTime).toLocaleString()} → {new Date(m.endTime).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Reason: {m.reason || '—'} • {m.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded p-2 md:col-span-2">
              <div className="font-medium mb-2">Recent Meetings</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {recent.length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent meetings.</div>
                )}
                {recent.map((m) => (
                  <div key={m.id} className="p-1 rounded border text-sm">
                    <div className="font-medium">{new Date(m.startTime).toLocaleString()} → {new Date(m.endTime).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Reason: {m.reason || '—'} • {m.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
