export default function CounsellorDashboardPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Counsellor Dashboard</h1>
      <p className="text-sm text-[var(--color-foreground)]/70">Overview of your students, alerts and schedule.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Upcoming Meetings</h2>
          <p className="text-sm">Coming soon.</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Flagged Students</h2>
          <p className="text-sm">Auto-generated when 3 consecutive negatives. Coming soon.</p>
        </div>
      </div>
    </div>
  );
}

