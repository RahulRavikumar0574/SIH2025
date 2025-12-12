"use client";

export default function AdminRecordsPage() {
  async function downloadCsv() {
    const resp = await fetch('/api/admin/records/export', { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      alert(`Export failed: ${text || resp.status}`);
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadPredictions() {
    const resp = await fetch('/api/admin/records/predictions', { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      alert(`Export failed: ${text || resp.status}`);
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Student Session Records Export</h1>
      <p className="text-sm text-muted-foreground">Download all meeting records as a CSV (includes student and counsellor details).</p>
      <div className="flex items-center gap-2">
        <button onClick={downloadCsv} className="px-3 py-2 rounded bg-blue-600 text-white">Download Meetings CSV</button>
        <button onClick={downloadPredictions} className="px-3 py-2 rounded bg-emerald-600 text-white">Download Predictions CSV</button>
      </div>
    </div>
  );
}
