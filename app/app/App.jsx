import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import HomeDashboard from "./pages/HomeDashboard";
import AdminPage from "./pages/AdminPage";
import FinancePage from "./pages/FinancePage";
import HRPage from "./pages/HRPage";
import BrandPage from "./pages/BrandPage";
import ToolsPage from "./pages/ToolsPage";

const SECTIONS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "admin", label: "Admin", icon: "⚙️", accessKey: "access_admin" },
  { id: "finance", label: "Finance", icon: "💰", accessKey: "access_finance" },
  { id: "hr", label: "HR", icon: "👥", accessKey: "access_hr" },
  { id: "brand", label: "Brand", icon: "✨", accessKey: "access_brand" },
  { id: "tools", label: "Tools", icon: "🛠️", accessKey: "access_tools" },
];

const SIMPLEX_PURPLE = "#7c3aed";
const DARK_BG = "#1a0533";
const SENSES_TAUPE = "#8a7070";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");

  // Load user from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("portal_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleLogin = (userData) => {
    sessionStorage.setItem("portal_user", JSON.stringify(userData));
    setUser(userData);
    setPage("home");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("portal_user");
    setUser(null);
    setPage("home");
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = user.role === "Admin";

  const canAccess = (section) => {
    if (isAdmin) return true;
    if (section.id === "home") return true;
    if (!section.accessKey) return true;
    const access = user[section.accessKey];
    return access === "View" || access === "Edit";
  };

  const visibleSections = SECTIONS.filter(canAccess);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#f8f7ff" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: DARK_BG, display: "flex", flexDirection: "column", boxShadow: "3px 0 20px rgba(124,58,237,0.2)", overflowY: "auto", flexShrink: 0 }}>
        {/* Dual brand header */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            {/* 5Senses brand mark */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: SENSES_TAUPE, fontWeight: 700, letterSpacing: 2 }}>정</div>
              <div style={{ fontSize: 7, color: "#6b5e5e", letterSpacing: 1 }}>5SENSES</div>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />
            {/* Simplex-ity brand mark */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#c4b5fd", fontWeight: 800, letterSpacing: 0.5 }}>SIMPLEX</div>
              <div style={{ fontSize: 7, color: "#a78bfa", letterSpacing: 1 }}>-ITY</div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 8, color: "#4c3f6e", letterSpacing: 1.5, textTransform: "uppercase" }}>Company Portal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {visibleSections.map(section => (
            <button key={section.id} onClick={() => setPage(section.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 18px", border: "none", cursor: "pointer",
              background: page === section.id ? "rgba(124,58,237,0.28)" : "transparent",
              color: page === section.id ? "#c4b5fd" : "#8b9dc3",
              fontSize: 13, fontWeight: page === section.id ? 700 : 400,
              borderLeft: page === section.id ? "3px solid #7c3aed" : "3px solid transparent",
              transition: "all 0.15s", textAlign: "left"
            }}>
              <span style={{ fontSize: 16 }}>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, color: "#4c3f6e" }}>Logged in as</div>
          <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, marginTop: 2 }}>{user.name}</div>
          <div style={{ fontSize: 10, color: "#6d5d8e", marginTop: 1 }}>{user.role}</div>
          <button onClick={handleLogout} style={{ marginTop: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 6, color: "#a78bfa", fontSize: 10, padding: "4px 10px", cursor: "pointer", width: "100%" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {page === "home"    && <HomeDashboard user={user} setPage={setPage} />}
        {page === "admin"   && <AdminPage user={user} />}
        {page === "finance" && <FinancePage user={user} />}
        {page === "hr"      && <HRPage user={user} />}
        {page === "brand"   && <BrandPage user={user} />}
        {page === "tools"   && <ToolsPage user={user} />}
      </div>
    </div>
  );
}
