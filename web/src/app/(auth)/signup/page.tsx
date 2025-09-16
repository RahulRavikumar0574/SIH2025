"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [degree, setDegree] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          instituteName,
          degree,
          rollNo,
          age: typeof age === "string" ? Number(age) : age,
          email,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
      } else {
        setSuccess("Account created. You can login now.");
        setTimeout(() => router.push("/login"), 800);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-1">Sign Up</h1>
        <p className="text-sm text-[var(--color-foreground)]/70 mb-4">Student Portal — Create your account.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ananya Singh"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Gender</label>
            <select
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">College email (Gmail)</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., studentname@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Institute name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              placeholder="e.g., XYZ Institute of Technology"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Degree</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g., B.Tech CSE"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Student roll number</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g., 21CSE1234"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Age</label>
            <input
              type="number"
              min={15}
              max={100}
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={age}
              onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 bg-white/80 dark:bg-black/20"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={8}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700" role="status">
              {success}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded py-2 disabled:opacity-60 bg-[var(--color-primary)] text-white hover:opacity-90 transition"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="text-sm mt-4">
          Already have an account? {" "}
          <a className="underline text-[var(--color-accent)]" href="/login">Login</a>
        </p>
        <p className="text-sm mt-1">
          Counsellor? {" "}
          <a className="underline text-[var(--color-accent)]" href="/counsellor/login">Login here</a>
        </p>
      </div>
    </div>
  );
}
