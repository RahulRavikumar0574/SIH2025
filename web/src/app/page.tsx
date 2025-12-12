import Link from "next/link";

export default function Home() {
  const cards = [
    {
      title: "Student Portal",
      desc: "Access your dashboard, sessions, and reports",
      href: "/login",
      cta: "Login / Signup",
      accent: "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30",
    },
    {
      title: "Counsellor Portal",
      desc: "Manage students, availability, and messages",
      href: "/counsellor-signup",
      cta: "Counsellor Signup",
      accent: "bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/30",
    },
    {
      title: "Admin Portal",
      desc: "Institute-wide insights and management",
      href: "/admin-login",
      cta: "Admin Login",
      accent: "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-primary)]">Choose your portal</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.title} className={`rounded-xl border p-5 ${c.accent}`}>
              <h2 className="text-lg font-semibold mb-1">{c.title}</h2>
              <p className="text-sm mb-4 opacity-80">{c.desc}</p>
              <Link
                href={c.href}
                className="inline-block bg-[var(--color-primary)] text-white px-4 py-2 rounded font-medium hover:opacity-90"
              >
                {c.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
