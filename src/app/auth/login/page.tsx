"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!supabase) { setError("Supabase not configured"); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/dashboard");
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <header className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <a href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)', fontWeight: 700, fontSize: '18px', textDecoration: 'none' }}>
            <img src="/assets/img/image.png" alt="HomeSure" height="30" style={{ display: 'block' }} />
            HomeSure
          </a>
          <a href="/" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
            Back to Home
          </a>
        </header>

        <div className="auth-form-wrap" style={{ flex: 1, maxWidth: '400px', width: '100%', margin: '0 auto', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 className="auth-title" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Welcome Back</h1>
          <p className="auth-sub" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>Sign in to access your HomeSure account</p>

          {error && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)',
                  color: 'var(--text)', padding: '10px 14px', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)',
                  color: 'var(--text)', padding: '10px 14px', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <a href="/auth/forgot-password" style={{ fontSize: '12px', fontWeight: 600, color: '#1fc8b4', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <button type="submit" style={{
              width: '100%', background: '#1a9e8f', color: '#fff', border: 'none',
              padding: '12px', borderRadius: '8px', fontFamily: 'inherit',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer'
            }}>
              Sign in
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '20px' }}>
            Don&apos;t have an account? <a href="/auth/signup" style={{ color: '#1fc8b4', fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
          </p>
        </div>

        <footer className="auth-page-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <span>© 2026 HomeSure.com</span>
        </footer>
      </div>

      <div className="auth-right" style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(/assets/img/house_image.jpg) center/cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,36,32,0.88) 0%, rgba(6,36,32,0.3) 45%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', zIndex: 2 }}>
          <div style={{ fontSize: '18px', marginBottom: '14px', letterSpacing: '3px', color: '#f59e0b' }}>★★★★★</div>
          <blockquote style={{ fontSize: '17px', fontWeight: 500, color: '#fff', lineHeight: 1.6, marginBottom: '22px', fontStyle: 'italic' }}>
            &ldquo;Renting my property through HomeSure was effortless. The process gave me complete peace of mind.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff' }}>MR</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Michael Rodriguez</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>Verified property renter in Pulong Buhangin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
