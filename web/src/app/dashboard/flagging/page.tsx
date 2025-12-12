"use client";

import { useEffect, useMemo, useState } from "react";

type RecordItem = { predicted_emotion: string; prediction_time: string };

function computeNegativeStreak(items: RecordItem[]): { current: number; longest: number } {
  let current = 0;
  let longest = 0;
  for (const it of items) {
    if (String(it.predicted_emotion).toUpperCase() === "NEGATIVE") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return { current, longest };
}

export default function AutoFlaggingPage() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [threshold, setThreshold] = useState(3);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("emotion_records");
      const parsed = raw ? (JSON.parse(raw) as RecordItem[]) : [];
      // Sort by time ascending to compute streaks correctly
      parsed.sort((a, b) => new Date(a.prediction_time).getTime() - new Date(b.prediction_time).getTime());
      setItems(parsed);
    } catch {}
  }, []);

  const { current, longest } = useMemo(() => computeNegativeStreak(items), [items]);
  const flagged = current >= threshold;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Auto-Flagging</h1>

      <div className="mb-4 p-3 border rounded">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Current NEGATIVE streak</div>
            <div className="text-2xl font-semibold">{current}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Longest NEGATIVE streak</div>
            <div className="text-2xl font-semibold">{longest}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Flag threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value || "3", 10))}
                className="w-20 px-2 py-1 border rounded"
              />
              <span className={`px-2 py-1 rounded text-white ${flagged ? "bg-red-600" : "bg-green-600"}`}>
                {flagged ? "FLAGGED" : "OK"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium mb-2">Recent results</div>
        <div className="space-y-2">
          {[...items].reverse().slice(0, 10).map((it, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">{new Date(it.prediction_time).toLocaleString()}</div>
              <div className={`font-semibold ${it.predicted_emotion === "NEGATIVE" ? "text-red-600" : it.predicted_emotion === "POSITIVE" ? "text-green-600" : "text-yellow-600"}`}>
                {it.predicted_emotion}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No records yet. Upload CSVs in Records to generate predictions.</div>
          )}
        </div>
      </div>
    </div>
  );
}

