import { useState, useEffect } from "react";
import { CalendarEvent, Notice, ComplianceItem } from "@/api/entities";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const SECTION_CARDS = [
  { id: "admin",   label: "Admin",   icon: "⚙️",  desc: "Credentials, invoices, company settings", color: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  { id: "finance", label: "Finance", icon: "💰",  desc: "Expenses, renewals, bank accounts, audit", color: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
  { id: "hr",      label: "HR",      icon: "👥",  desc: "MPF, contracts, medical, team records",    color: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { id: "brand",   label: "Brand",   icon: "✨",  desc: "5Senses & Simplex-ity brand assets",       color: "#f3e8ff", border: "#c4b5fd", text: "#6d28d9" },
  { id: "tools",   label: "Tools",   icon: "🛠️", desc: "Canva, Looka, TINT, brand tools",          color: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
];

export default function HomeDashboard({ user, setPage }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evts, nots, comps] = await Promise.all([
        CalendarEvent.list(),
        Notice.list(),
        ComplianceItem.list(),
      ]);
      setEvents(evts);
      setNotices(nots.filter(n => n.pinned || n.section === "All"));
      // Reminders: compliance items due in next 30 days
      const soon = comps.filter(c => {
        if (!c.due_date) return false;
        const d = new Date(c.due_date);
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30 && c.status !== "Completed";
      }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setReminders(soon);
    } catch (e) {}
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.due_date && e.due_date.startsWith(dateStr));
  };

  const isToday = (day) => day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>
          Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"}, {user.name} 👋
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{today.toLocaleDateString("en-HK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Reminders strip */}
      {reminders.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>UPCOMING DEADLINES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {reminders.slice(0, 5).map(r => {
                const d = new Date(r.due_date);
                const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                return (
                  <span key={r.id} style={{ background: "#fff", border: "1px solid #fcd34d", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                    {r.title} · {diff === 0 ? "Today" : `${diff}d`}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* LEFT: Calendar + Section cards */}
        <div>
          {/* Calendar */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #ede9fe", padding: "20px", marginBottom: 24, boxShadow: "0 2px 12px rgba(124,58,237,0.06)" }}>
            {/* Calendar header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: "#f3f0ff", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1a0533", margin: 0 }}>{MONTHS[viewMonth]} {viewYear}</h2>
              <button onClick={nextMonth} style={{ background: "#f3f0ff", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const todayMark = isToday(day);
                return (
                  <div key={idx} style={{
                    minHeight: 52, borderRadius: 8, padding: "4px",
                    background: todayMark ? "#7c3aed" : day ? "#faf9ff" : "transparent",
                    border: todayMark ? "none" : day ? "1px solid #f0edff" : "none",
                    position: "relative"
                  }}>
                    {day && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: todayMark ? 800 : 500, color: todayMark ? "#fff" : "#374151", textAlign: "center" }}>{day}</div>
                        {dayEvents.slice(0, 2).map((ev, i) => (
                          <div key={i} style={{ fontSize: 8, background: todayMark ? "rgba(255,255,255,0.2)" : "#ede9fe", color: todayMark ? "#fff" : "#6d28d9", borderRadius: 3, padding: "1px 3px", marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div style={{ fontSize: 7, color: todayMark ? "rgba(255,255,255,0.7)" : "#a78bfa", textAlign: "center" }}>+{dayEvents.length - 2}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section quick-access cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {SECTION_CARDS.map(card => (
              <button key={card.id} onClick={() => setPage(card.id)} style={{
                background: card.color, border: `1.5px solid ${card.border}`, borderRadius: 14,
                padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: card.text }}>{card.label}</div>
                <div style={{ fontSize: 10, color: card.text, opacity: 0.7, marginTop: 3, lineHeight: 1.4 }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Notice board */}
        <div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #ede9fe", padding: "18px", boxShadow: "0 2px 12px rgba(124,58,237,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a0533", margin: 0 }}>📋 Notice Board</h3>
            </div>

            {notices.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "30px 0" }}>No notices yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notices.map(n => {
                  const typeColors = {
                    "Announcement": { bg: "#ede9fe", text: "#6d28d9" },
                    "Reminder": { bg: "#fef3c7", text: "#92400e" },
                    "HR Notice": { bg: "#dbeafe", text: "#1e40af" },
                    "Admin Alert": { bg: "#fce7f3", text: "#9d174d" },
                    "Finance Alert": { bg: "#d1fae5", text: "#065f46" },
                  };
                  const tc = typeColors[n.type] || { bg: "#f1f5f9", text: "#475569" };
                  return (
                    <div key={n.id} style={{ background: "#faf9ff", borderRadius: 10, padding: "12px", border: "1px solid #f0edff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ background: tc.bg, color: tc.text, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>{n.type}</span>
                        {n.pinned && <span style={{ fontSize: 10 }}>📌</span>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a0533", marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{n.content}</div>
                      {n.posted_by && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>— {n.posted_by}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
