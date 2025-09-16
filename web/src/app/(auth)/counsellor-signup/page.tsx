"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CounsellorSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    gender: "",
    instituteName: "",
    email: "",
    phone: "",
    employeeId: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/counsellor-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setSuccess("Counsellor account created. Redirecting to login…");
      setTimeout(() => router.push("/counsellor-login"), 1200);
    } catch (e: any) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-[var(--color-surface)] p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Counsellor Signup</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" name="name" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Gender</label>
            <select className="w-full border rounded px-3 py-2" name="gender" value={form.gender} onChange={onChange} required>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Institute name</label>
            <input className="w-full border rounded px-3 py-2" name="instituteName" value={form.instituteName} onChange={onChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">College email (Gmail)</label>
            <input type="email" className="w-full border rounded px-3 py-2" name="email" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone number</label>
            <input className="w-full border rounded px-3 py-2" name="phone" value={form.phone} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Employee ID</label>
            <input className="w-full border rounded px-3 py-2" name="employeeId" value={form.employeeId} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" name="password" value={form.password} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm password</label>
            <input type="password" className="w-full border rounded px-3 py-2" name="confirmPassword" value={form.confirmPassword} onChange={onChange} required />
          </div>

          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <Link href="/" className="text-sm text-[var(--color-primary)]">Back to home</Link>
            <div className="flex items-center gap-2">
              <Link href="/counsellor-login" className="px-4 py-2 rounded border hover:border-[var(--color-primary)] font-medium">
                Login
              </Link>
              <button disabled={loading} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded font-medium hover:opacity-90">
                {loading ? "Creating…" : "Create account"}
              </button>
            </div>
          </div>
        </form>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        {success && <p className="text-green-700 text-sm mt-3">{success}</p>}
      </div>
    </div>
  );
}
