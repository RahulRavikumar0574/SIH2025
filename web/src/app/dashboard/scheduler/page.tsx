"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Slot = {
  id: string;
  counsellorId: string;
  startTime: string;
  endTime: string;
};

type Assigned = { id: string; name: string | null; email: string } | null;

export default function SchedulerPage() {
  const router = useRouter();
  const [counsellorId, setCounsellorId] = useState("");
  const [counsellor, setCounsellor] = useState<Assigned>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reason, setReason] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-detect assigned counsellor for the logged-in student
  useEffect(() => {
    const loadAssigned = async () => {
      try {
        const res = await fetch("/api/assignments", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.counsellor?.id) {
          setCounsellorId(data.counsellor.id);
          setCounsellor({ id: data.counsellor.id, name: data.counsellor.name ?? null, email: data.counsellor.email });
        }
      } catch {}
    };
    loadAssigned();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!counsellorId) return;
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/availability", window.location.origin);
        url.searchParams.set("counsellorId", counsellorId);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch availability");
        setSlots(data.slots);
      } catch (e: any) {
        setError(e.message || "Failed to fetch availability");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [counsellorId]);

  const onBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return setError("Please select a slot");
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) return setError("Invalid slot selected");
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          counsellorId: slot.counsellorId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setSuccess("Meeting booked successfully.");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (e: any) {
      setError(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Meeting Scheduler</h1>
      <p className="text-sm text-[var(--color-foreground)]/70">Book a session with your counsellor.</p>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm mb-1">Assigned counsellor</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={counsellor ? `${counsellor.name || counsellor.email} (${counsellor.id})` : "Detecting..."}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Counsellor ID</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white/60 dark:bg-black/20"
              value={counsellorId}
              readOnly
            />
          </div>
        </div>

        <div>
          <h2 className="font-medium mb-2">Available Slots</h2>
          {loading && <p>Loading...</p>}
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          {!loading && slots.length === 0 && <p className="text-sm">No available slots.</p>}
          <ul className="divide-y border rounded">
            {slots.map((s) => (
              <li key={s.id} className="p-3 flex items-center gap-3">
                <input
                  type="radio"
                  name="slot"
                  value={s.id}
                  checked={selectedSlotId === s.id}
                  onChange={() => setSelectedSlotId(s.id)}
                />
                <div>
                  <div className="text-sm font-medium">
                    {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-600">Counsellor: {s.counsellorId}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onBook} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Reason for meeting</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>
          {success && (
            <p className="text-sm text-green-700" role="status">{success}</p>
          )}
          <button
            type="submit"
            className="rounded px-4 py-2 bg-[var(--color-primary)] text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Booking..." : "Book Meeting"}
          </button>
        </form>
      </div>
    </div>
  );
}
