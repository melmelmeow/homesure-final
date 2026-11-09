"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const field = "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

// Only same-site paths are honoured, so /auth/login?next=https://evil.example cannot bounce a
// freshly signed-in user to another site.
function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError("Wrong email or password, or the email is not verified yet.");
        return;
      }
      // The session is now in a cookie. Go to /auth/continue, which picks the right dashboard for
      // the account's role on the server; refresh() makes every server component re-read the cookie.
      const target = safeNext(next);
      router.push(target ?? "/auth/continue");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-medium">Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={`${field} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={`${field} mt-1.5`} />
      </label>
      <div className="text-right"><a href="/auth/forgot-password.html" className="text-xs font-semibold text-primary">Forgot password?</a></div>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-text-muted">No account? <Link href="/auth/signup" className="font-semibold text-primary">Sign up</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "buyer" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fullName: `${form.firstName} ${form.lastName}`.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error ?? "Could not create the account.");
      else setDone(true);
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h2 className="text-lg font-bold">Check your email</h2>
        <p className="mt-2 text-sm text-text-muted">We sent a link to <strong>{form.email}</strong>. Open it to verify your account, then sign in.</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-semibold text-primary">Go to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">First name
          <input value={form.firstName} onChange={set("firstName")} required maxLength={50} className={`${field} mt-1.5`} />
        </label>
        <label className="text-sm font-medium">Last name
          <input value={form.lastName} onChange={set("lastName")} required maxLength={50} className={`${field} mt-1.5`} />
        </label>
      </div>
      <label className="text-sm font-medium">Email
        <input type="email" value={form.email} onChange={set("email")} required maxLength={254} autoComplete="email" className={`${field} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">Password
        <input type="password" value={form.password} onChange={set("password")} required minLength={8} maxLength={128} autoComplete="new-password" className={`${field} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">I want to
        <select value={form.role} onChange={set("role")} className={`${field} mt-1.5`}>
          <option value="buyer">Buy or rent</option>
          <option value="seller">Sell or list property</option>
        </select>
      </label>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-60">
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-text-muted">Already registered? <Link href="/auth/login" className="font-semibold text-primary">Sign in</Link></p>
    </form>
  );
}
