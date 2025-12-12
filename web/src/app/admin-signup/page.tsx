"use client";

import { FormEvent, useState } from "react";

export default function AdminSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Signup failed');
      setOk('Admin created. You can now log in.');
    } catch (e: any) {
      setError(e?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Signup</h1>
      <p className="text-sm text-muted-foreground mb-3">This endpoint allows creating the first admin only. Once an admin exists, this page is disabled.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {ok && <div className="text-sm text-green-700">{ok}</div>}
        <button type="submit" disabled={loading} className="w-full px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
          {loading ? 'Creating…' : 'Create Admin'}
        </button>
      </form>
      <div className="text-sm mt-3">
        Already an admin? <a className="text-blue-600 underline" href="/admin-login">Login</a>
      </div>
    </div>
  );
}
