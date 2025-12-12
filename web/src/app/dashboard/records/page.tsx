'use client';

import { useState } from 'react';

export default function SessionRecordsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ predicted_emotion: string; prediction_time: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }
    const form = new FormData();
    form.append('file', file, file.name);
    setLoading(true);
    try {
      const resp = await fetch('/api/emotion', { method: 'POST', body: form });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Upload failed');
      } else {
        setResult(data);
        // Persist to localStorage for later analysis (flagging/reports)
        try {
          const key = 'emotion_records';
          const prev = JSON.parse(localStorage.getItem(key) || '[]') as Array<{ predicted_emotion: string; prediction_time: string }>;
          prev.push({ predicted_emotion: data.predicted_emotion, prediction_time: data.prediction_time });
          localStorage.setItem(key, JSON.stringify(prev));
        } catch {}
        // Best-effort persist on server for counsellor analytics/alerts
        try {
          await fetch('/api/predictions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ emotion: data.predicted_emotion, at: data.prediction_time }),
          });
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-4">Session Records</h1>
      <p className="text-sm text-muted-foreground mb-4">Upload a CSV with a <code>Label</code> column and numeric features to get an emotion prediction.</p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div>
          <button
            type="submit"
            disabled={loading || !file}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {loading ? 'Uploading…' : 'Upload & Predict'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-4 p-3 rounded border">
          <div className="font-medium">Prediction</div>
          <div className="mt-1">Emotion: <span className="font-semibold">{result.predicted_emotion}</span></div>
          <div className="text-xs text-muted-foreground">Time: {result.prediction_time}</div>
        </div>
      )}
    </div>
  );
}
