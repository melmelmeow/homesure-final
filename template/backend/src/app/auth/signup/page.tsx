
import { useState } from "react";
import { createClient } from "@/lib/supabase/server-client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "landowner">("buyer");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await createClient();
    setError("");
    if (!supabase) { setError("Supabase not configured"); return; }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone_number: phone, role },
      },
    });
    if (error) setError(error.message);
    else router.push("/auth/login");
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <a href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)', fontWeight: 700, fontSize: '18px', textDecoration: 'none' }}>
            <img src="/assets/img/image.png" alt="HomeSure" height="30" style={{ display: 'block' }} />
            HomeSure
          </a>
          <a href="/" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
            Back to Home
          </a>
        </header>

        <div style={{ flex: 1, maxWidth: '400px', width: '100%', margin: '0 auto', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>Join HomeSure as a buyer or landowner</p>

          {error && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Enter your full name" style={{ width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" style={{ width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Enter your phone number" style={{ width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a password" style={{ width: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '7px' }}>I am a...</label>
              <div style={{ display: 'flex', background: 'var(--card)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
                <button type="button" onClick={() => setRole("buyer")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: role === "buyer" ? '#1a9e8f' : 'transparent', border: 'none', color: role === "buyer" ? '#fff' : 'var(--muted)', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '7px', cursor: 'pointer' }}>Buyer</button>
                <button type="button" onClick={() => setRole("landowner")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: role === "landowner" ? '#1a9e8f' : 'transparent', border: 'none', color: role === "landowner" ? '#fff' : 'var(--muted)', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '7px', cursor: 'pointer' }}>Landowner</button>
              </div>
            </div>
            <button type="submit" style={{ width: '100%', background: '#1a9e8f', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
              Sign up
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '20px' }}>
            Already have an account? <a href="/auth/login" style={{ color: '#1fc8b4', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
          </p>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <span>© 2026 HomeSure.com</span>
        </footer>
      </div>

      <div className="auth-right" style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(/assets/img/house_image.jpg) center/cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,36,32,0.88) 0%, rgba(6,36,32,0.3) 45%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', zIndex: 2 }}>
          <div style={{ fontSize: '18px', marginBottom: '14px', letterSpacing: '3px', color: '#f59e0b' }}>★★★★★</div>
          <blockquote style={{ fontSize: '17px', fontWeight: 500, color: '#fff', lineHeight: 1.6, marginBottom: '22px', fontStyle: 'italic' }}>
            &ldquo;HomeSure made finding our dream land incredibly easy. The verified listings gave us confidence.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff' }}>JC</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Jose Carpio</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>Verified buyer in Sta. Maria</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
