"use client";

import { useEffect, useMemo, useState } from "react";

type RecordItem = { predicted_emotion: string; prediction_time: string };

function useRecords() {
  const [items, setItems] = useState<RecordItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("emotion_records");
      const parsed = raw ? (JSON.parse(raw) as RecordItem[]) : [];
      parsed.sort((a, b) => new Date(a.prediction_time).getTime() - new Date(b.prediction_time).getTime());
      setItems(parsed);
    } catch {}
  }, []);
  return items;
}

function EmotionDistribution({ items }: { items: RecordItem[] }) {
  const slices = useMemo(() => {
    const c = { NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 } as Record<string, number>;
    for (const it of items) {
      const k = String(it.predicted_emotion).toUpperCase();
      if (k in c) c[k]++;
    }
    const series = [
      { label: "NEGATIVE", value: c.NEGATIVE, color: "Red" },
      { label: "NEUTRAL", value: c.NEUTRAL, color: "Yellow" },
      { label: "POSITIVE", value: c.POSITIVE, color: "Green" },
    ];
    const total = series.reduce((acc, s) => acc + s.value, 0) || 1; // avoid divide by zero
    return { series, total };
  }, [items]);

  const size = 220;
  const radius = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;

  let startAngle = -Math.PI / 2; // start at top
  const paths = slices.series.map((s, idx) => {
    const frac = s.value / slices.total;
    const angle = frac * Math.PI * 2;
    const endAngle = startAngle + angle;
    // Compute arc endpoints
    const x0 = cx + radius * Math.cos(startAngle);
    const y0 = cy + radius * Math.sin(startAngle);
    const x1 = cx + radius * Math.cos(endAngle);
    const y1 = cy + radius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    startAngle = endAngle;
    return { d, color: s.color, label: s.label, value: s.value, frac };
  });

  return (
    <div className="p-3 rounded border">
      <div className="font-medium mb-3">Emotion Distribution</div>
      <div className="flex items-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded">
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={radius} fill="#F3F4F6" />
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} />
          ))}
          {/* Center label */}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={14} fill="#374151">
            {slices.total} total
          </text>
        </svg>
        <div className="space-y-2">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="inline-block w-3 h-3 rounded" style={{ background: p.color }} />
              <span className="w-20">{p.label}</span>
              <span className="font-semibold">{p.value}</span>
              <span className="text-xs text-muted-foreground">({Math.round(p.frac * 100)}%)</span>
            </div>
          ))}
          {slices.total === 1 && items.length === 0 && (
            <div className="text-sm text-muted-foreground">No data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SevenDayTrend({ items }: { items: RecordItem[] }) {
  // Build last 7 days date keys
  const days = useMemo(() => {
    const out: { label: string; date: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const iso = d.toISOString().slice(0, 10);
      out.push({ label, date: iso });
    }
    return out;
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) map.set(d.date, 0);
    for (const it of items) {
      const iso = new Date(it.prediction_time).toISOString().slice(0, 10);
      if (map.has(iso)) map.set(iso, (map.get(iso) || 0) + 1);
    }
    return days.map((d) => ({ label: d.label, value: map.get(d.date) || 0 }));
  }, [items, days]);

  const max = Math.max(1, ...counts.map((c) => c.value));
  const width = 400;
  const height = 160;
  const padding = 24;
  const stepX = (width - padding * 2) / (counts.length - 1);

  const points = counts.map((c, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - c.value / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="p-3 rounded border">
      <div className="font-medium mb-2">7-Day Prediction Count</div>
      <svg width={width} height={height} className="bg-white dark:bg-black/10 rounded">
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#9CA3AF" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#9CA3AF" />
        {/* Polyline */}
        <polyline fill="none" stroke="#3B82F6" strokeWidth={2} points={points.join(" ")} />
        {/* Dots */}
        {counts.map((c, i) => {
          const x = padding + i * stepX;
          const y = padding + (1 - c.value / max) * (height - padding * 2);
          return <circle key={i} cx={x} cy={y} r={3} fill="#3B82F6" />;
        })}
        {/* Labels */}
        {counts.map((c, i) => {
          const x = padding + i * stepX;
          return (
            <text key={i} x={x} y={height - padding + 14} fontSize={10} textAnchor="middle" fill="#6B7280">
              {c.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ReportsPage() {
  const items = useRecords();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Reports</h1>
      <p className="text-sm text-muted-foreground">These charts summarize your recent predictions. Upload more CSVs in the Records page.</p>

      <EmotionDistribution items={items} />
      <SevenDayTrend items={items} />

      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">No data yet. Make a prediction first.</div>
      )}
    </div>
  );
}

