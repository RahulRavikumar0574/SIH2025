"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string | null;
  rollNo: string; // Employee ID
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  instituteName?: string | null;
  email: string;
  emailVerified?: string | Date | null;
  profileImageUrl?: string | null;
  phone?: string | null;
};

export default function CounsellorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [instituteName, setInstituteName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Activity
  const [activity, setActivity] = useState<Array<{ id: string; action: string; details?: string | null; createdAt?: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const ct = res.headers.get("content-type") || "";
        let data: any = null;
        if (ct.includes("application/json")) data = await res.json();
        else {
          const text = await res.text();
          if (text) { try { data = JSON.parse(text); } catch {} }
        }
        if (!res.ok) throw new Error(data?.error || `Failed to load profile (${res.status})`);
        const u: Profile = data.user;
        setProfile(u);
        setName(u.name ?? "");
        setGender((u.gender as any) ?? "");
        setInstituteName(u.instituteName ?? "");
        setPhone((u as any).phone ?? "");
        setProfileImageUrl((u as any).profileImageUrl ?? "");
      } catch (e: any) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await fetch("/api/profile/activity", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setActivity(Array.isArray(data.items) ? data.items : []);
      } catch {}
    };
    loadActivity();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender: gender || null,
          instituteName: instituteName || null,
          phone: phone || null,
          profileImageUrl: profileImageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setProfile(data.user);
      setSuccess("Profile updated");
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!profile) return <p>No profile found.</p>;

  const verified = !!profile.emailVerified;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Profile</h1>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm">
        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Gender</label>
              <select className="w-full border rounded px-3 py-2" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Institute name</label>
              <input className="w-full border rounded px-3 py-2" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Employee ID</label>
              <input className="w-full border rounded px-3 py-2 bg-white/60 dark:bg-black/10" value={profile.rollNo} disabled />
            </div>
            <div>
              <label className="block text-sm mb-1">College email</label>
              <div className="flex items-center gap-2">
                <input className="w-full border rounded px-3 py-2 bg-white/60 dark:bg-black/10" value={profile.email} disabled />
                <span className={`text-xs px-2 py-1 rounded ${verified ? "bg-[var(--color-success)]/20 text-[var(--color-success)]" : "bg-[var(--color-alert)]/20 text-[var(--color-alert)]"}`}>{verified ? "Verified" : "Unverified"}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            {/* Profile picture */}
            <div>
              <label className="block text-sm mb-1">Profile picture URL</label>
              <div className="flex items-center gap-3">
                <input type="url" className="w-full border rounded px-3 py-2" placeholder="https://.../photo.jpg" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} />
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-primary)]/10 flex items-center justify-center">
                  {profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[var(--color-primary)]">No img</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <details className="text-sm">
                <summary className="cursor-pointer px-3 py-2 rounded border hover:border-[var(--color-primary)]">Change password</summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 bg-white/40 dark:bg-black/10 p-3 rounded">
                  <input type="password" placeholder="Current" className="border rounded px-2 py-1" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <input type="password" placeholder="New (min 8)" className="border rounded px-2 py-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <input type="password" placeholder="Confirm" className="border rounded px-2 py-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null); setSuccess(null);
                      try {
                        const res = await fetch("/api/profile/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to change password");
                        setSuccess("Password changed successfully");
                        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                      } catch (e: any) {
                        setError(e.message || "Failed to change password");
                      }
                    }}
                    className="md:col-span-3 bg-[var(--color-primary)] text-white px-3 py-2 rounded font-medium hover:opacity-90"
                  >
                    Update Password
                  </button>
                </div>
              </details>
              <button type="submit" disabled={saving} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-4 text-sm">
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-700">{success}</p>}
      </div>

      <div className="mt-6 bg-[var(--color-surface)] rounded-xl p-4">
        <h2 className="font-semibold mb-3">Account activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 && (
                <tr><td className="py-3 text-[var(--color-foreground)]/70" colSpan={3}>No activity yet.</td></tr>
              )}
              {activity.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-3">{row.action}</td>
                  <td className="py-2"><pre className="whitespace-pre-wrap text-xs bg-white/40 dark:bg-black/10 p-2 rounded">{row.details}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
 
