import { useState } from "react";
import { TeamMember } from "@/api/entities";

const SENSES_LOGO_URL = "https://media.base44.com/images/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/2597cdedd_whatsapp_image_1608728383529314.jpg";

// Hardcoded admin for initial setup — Kieran always has access
const ADMIN_CREDENTIALS = { name: "Kieran", email: "kieran@5senses.global", role: "Admin", access_admin: "Edit", access_finance: "Edit", access_hr: "Edit", access_brand: "Edit", access_tools: "Edit" };

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Admin shortcut
    if (email === "kieran@5senses.global" || email === "kieran") {
      if (password === "5SensesBase44*" || password === "admin") {
        onLogin(ADMIN_CREDENTIALS);
        setLoading(false);
        return;
      }
    }

    // Check team members in DB
    try {
      const members = await TeamMember.filter({ email: email.toLowerCase(), status: "Active" });
      if (members.length > 0) {
        const member = members[0];
        // Simple password check (stored as plain text for now — can upgrade to hashed)
        if (member.password_hash === password) {
          onLogin(member);
          setLoading(false);
          return;
        }
      }
      setError("Invalid email or password. Please try again.");
    } catch (err) {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f9f7ff 0%, #f0ebe8 50%, #ede9fe 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 350, height: 350, background: "radial-gradient(circle, rgba(138,112,112,0.07) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: "30%", left: "10%", width: 200, height: 200, background: "radial-gradient(circle, rgba(196,181,253,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

      {/* Login card */}
      <div style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        padding: "48px 44px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(124,58,237,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        border: "1px solid rgba(255,255,255,0.8)",
        position: "relative", zIndex: 1
      }}>
        {/* Dual logo area */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 32 }}>
          {/* 5Senses logo */}
          <div style={{ textAlign: "center" }}>
            <img src={SENSES_LOGO_URL} alt="5Senses" style={{ height: 56, objectFit: "contain", opacity: 0.9 }} />
          </div>

          {/* Divider */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 1, height: 30, background: "linear-gradient(to bottom, transparent, #c4b5fd, transparent)" }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
            <div style={{ width: 1, height: 30, background: "linear-gradient(to bottom, #c4b5fd, transparent)" }} />
          </div>

          {/* Simplex-ity logo text */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Exo 2', 'Inter', sans-serif", fontWeight: 900, fontSize: 20, color: "#1a0533", letterSpacing: 1 }}>SIMPLEX</div>
            <div style={{ fontFamily: "'Exo 2', 'Inter', sans-serif", fontWeight: 900, fontSize: 20, color: "#7c3aed", letterSpacing: 1, marginTop: -4 }}>-ITY</div>
            <div style={{ fontSize: 8, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Company Portal</div>
          </div>
        </div>

        <h1 style={{ textAlign: "center", fontSize: 16, fontWeight: 600, color: "#4c3f6e", marginBottom: 28, letterSpacing: 0.3 }}>
          Sign in to your workspace
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2d9f3", fontSize: 14, background: "#faf9ff", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
              onFocus={e => e.target.style.border = "1.5px solid #7c3aed"}
              onBlur={e => e.target.style.border = "1.5px solid #e2d9f3"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2d9f3", fontSize: 14, background: "#faf9ff", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.border = "1.5px solid #7c3aed"}
              onBlur={e => e.target.style.border = "1.5px solid #e2d9f3"}
            />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#dc2626", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            transition: "all 0.2s", opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#94a3b8" }}>
          Contact admin to get access · kieran@5senses.global
        </div>
      </div>
    </div>
  );
}
