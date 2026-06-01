import { useState, useEffect } from "react";
import { Expense, ComplianceItem, BankAccount, Document } from "@/api/entities";

const TABS = ["Expense Summary", "Renewals & Expiry", "Bank Accounts", "Audit"];

export default function FinancePage({ user }) {
  const [tab, setTab] = useState("Expense Summary");
  const [expenses, setExpenses] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const today = new Date();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [e, c, b] = await Promise.all([Expense.list(), ComplianceItem.list(), BankAccount.list()]);
      setExpenses(e.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setCompliance(c);
      setBanks(b);
    } catch (err) {}
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await resp.json();
      await Expense.create({ title: file.name, receipt_url: url, date: new Date().toISOString().split("T")[0], currency: "HKD", status: "Pending", category: "Other", notes: "Auto-imported via upload" });
      await Document.create({ title: file.name, category: "Finance", file_url: url, file_name: file.name, file_type: file.type, tags: ["finance", "invoice"] });
      await loadAll();
      alert("Invoice uploaded and logged to Finance!");
    } catch (err) { alert("Upload failed."); }
    setUploading(false);
    e.target.value = "";
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      if (form.id) await Expense.update(form.id, form);
      else await Expense.create(form);
      await loadAll();
      setShowForm(false);
    } catch (e) {}
    setSaving(false);
  };

  // Summary stats
  const totalHKD = expenses.filter(e => e.currency === "HKD").reduce((s, e) => s + (e.amount || 0), 0);
  const totalUSD = expenses.filter(e => e.currency === "USD").reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === "Pending").length;

  const filteredExpenses = expenses.filter(e => {
    const matchCat = filterCat === "All" || e.category === filterCat;
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    return matchCat && matchStatus;
  });

  // Renewals due in 60 days
  const renewals = compliance.filter(c => {
    if (!c.due_date) return false;
    const d = new Date(c.due_date);
    const diff = (d - today) / (1000 * 60 * 60 * 24);
    return diff >= -30 && diff <= 60;
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Audit: group expenses by category
  const auditByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || "Other";
    if (!acc[cat]) acc[cat] = { count: 0, totalHKD: 0, totalUSD: 0 };
    acc[cat].count++;
    if (e.currency === "HKD") acc[cat].totalHKD += (e.amount || 0);
    if (e.currency === "USD") acc[cat].totalUSD += (e.amount || 0);
    return acc;
  }, {});

  const tabStyle = (t) => ({
    padding: "9px 16px", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: tab === t ? "#7c3aed" : "#f3f0ff", color: tab === t ? "#fff" : "#6d28d9", transition: "all 0.15s"
  });

  const statusColor = { Pending: "#fef3c7", Approved: "#d1fae5", Rejected: "#fef2f2", Reimbursed: "#ede9fe" };
  const statusText = { Pending: "#92400e", Approved: "#065f46", Rejected: "#dc2626", Reimbursed: "#6d28d9" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>💰 Finance</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Expenses, renewals, bank accounts & audit summary</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {uploading ? "Uploading..." : "📎 Upload Invoice"}
            <input type="file" style={{ display: "none" }} onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png" />
          </label>
          {(user.role === "Admin" || user.access_finance === "Edit") && (
            <button onClick={() => { setForm({ currency: "HKD", date: new Date().toISOString().split("T")[0], status: "Pending", category: "Other" }); setShowForm(true); }}
              style={{ background: "#fff", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total HKD", value: `HKD ${totalHKD.toLocaleString()}`, color: "#d1fae5", text: "#065f46" },
          { label: "Total USD", value: `USD ${totalUSD.toLocaleString()}`, color: "#dbeafe", text: "#1e40af" },
          { label: "Pending Items", value: pending, color: "#fef3c7", text: "#92400e" },
          { label: "Total Records", value: expenses.length, color: "#f3e8ff", text: "#6d28d9" },
        ].map(card => (
          <div key={card.label} style={{ background: card.color, borderRadius: 12, padding: "16px", border: `1px solid ${card.text}22` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: card.text, textTransform: "uppercase", letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.text, marginTop: 6 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{t}</button>)}
      </div>

      {loading ? <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>Loading...</div> : (
        <>
          {/* EXPENSE SUMMARY */}
          {tab === "Expense Summary" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {["All", "Office", "Salaries", "MPF", "Marketing", "Professional Fees", "Software", "Other"].map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: filterCat === c ? "#7c3aed" : "#f3f0ff", color: filterCat === c ? "#fff" : "#6d28d9", border: "none" }}>{c}</button>
                ))}
                <div style={{ borderLeft: "1px solid #e2d9f3", marginLeft: 4, paddingLeft: 8, display: "flex", gap: 6 }}>
                  {["All", "Pending", "Approved", "Rejected"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: filterStatus === s ? "#1a0533" : "#f1f5f9", color: filterStatus === s ? "#fff" : "#475569", border: "none" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ede9fe", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8f7ff" }}>
                      {["Date", "Title", "Vendor", "Category", "Amount", "Status", "Receipt"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((e, i) => (
                      <tr key={e.id} style={{ borderTop: "1px solid #f0edff", background: i % 2 === 0 ? "#fff" : "#faf9ff" }}>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{e.date}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1a0533" }}>{e.title}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{e.vendor || "—"}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{e.category}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1a0533" }}>{e.currency} {e.amount?.toLocaleString() || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: statusColor[e.status] || "#f1f5f9", color: statusText[e.status] || "#475569", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{e.status}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {e.receipt_url ? <a href={e.receipt_url} target="_blank" rel="noreferrer" style={{ color: "#7c3aed", fontSize: 11 }}>View</a> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredExpenses.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No expenses found</div>}
              </div>
            </div>
          )}

          {/* RENEWALS & EXPIRY */}
          {tab === "Renewals & Expiry" && (
            <div>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Items due within 60 days or recently overdue</p>
              {renewals.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>No upcoming renewals. All clear! ✅</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {renewals.map(item => {
                    const d = new Date(item.due_date);
                    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                    const isOverdue = diff < 0;
                    const isUrgent = diff >= 0 && diff <= 14;
                    const bg = isOverdue ? "#fef2f2" : isUrgent ? "#fef3c7" : "#f0fdf4";
                    const border = isOverdue ? "#fecaca" : isUrgent ? "#fcd34d" : "#bbf7d0";
                    const badge = isOverdue ? "🔴 OVERDUE" : isUrgent ? "🟡 URGENT" : "🟢 UPCOMING";
                    return (
                      <div key={item.id} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a0533" }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.category} · {item.recurrence}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{badge}</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: isOverdue ? "#dc2626" : "#1a0533", marginTop: 2 }}>
                            {isOverdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `Due in ${diff} days`}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.due_date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BANK ACCOUNTS */}
          {tab === "Bank Accounts" && (
            <div>
              {banks.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>No bank accounts. Add them in Admin → Bank Info.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {banks.map(bank => (
                    <div key={bank.id} style={{ background: "linear-gradient(135deg, #1a0533, #2d1157)", borderRadius: 16, padding: "20px", color: "#fff" }}>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{bank.entity}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{bank.bank_name}</div>
                      <div style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 6 }}>{bank.account_name}</div>
                      <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: 2, color: "#e2e8f0" }}>{bank.account_number}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <span style={{ background: "rgba(124,58,237,0.3)", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#c4b5fd" }}>{bank.currency}</span>
                        <span style={{ background: "rgba(124,58,237,0.3)", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#c4b5fd" }}>{bank.type}</span>
                      </div>
                      {bank.balance != null && <div style={{ fontSize: 20, fontWeight: 800, color: "#a7f3d0", marginTop: 10 }}>{bank.currency} {bank.balance?.toLocaleString()}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {tab === "Audit" && (
            <div>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Expense breakdown by category for audit & accounting purposes</p>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ede9fe", overflow: "hidden", marginBottom: 24 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8f7ff" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Category</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Count</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Total HKD</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Total USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(auditByCategory).map(([cat, data], i) => (
                      <tr key={cat} style={{ borderTop: "1px solid #f0edff", background: i % 2 === 0 ? "#fff" : "#faf9ff" }}>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#1a0533" }}>{cat}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", color: "#64748b" }}>{data.count}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#065f46" }}>{data.totalHKD > 0 ? `HKD ${data.totalHKD.toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#1e40af" }}>{data.totalUSD > 0 ? `USD ${data.totalUSD.toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #ede9fe", background: "#f8f7ff" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#1a0533" }}>TOTAL</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#1a0533" }}>{expenses.length}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: "#065f46" }}>HKD {totalHKD.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: "#1e40af" }}>USD {totalUSD.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Expense Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,5,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: "#1a0533", marginBottom: 20 }}>Add Expense</h2>
            {[["Title", "title", "text"], ["Vendor", "vendor", "text"], ["Amount", "amount", "number"], ["Date", "date", "date"], ["Notes", "notes", "text"]].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <input type={type} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            {[["Category", "category", ["Office", "Salaries", "MPF", "Marketing", "Professional Fees", "Government Fees", "Software", "Other"]], ["Currency", "currency", ["HKD", "USD", "CNY", "EUR"]], ["Status", "status", ["Pending", "Approved", "Rejected", "Reimbursed"]]].map(([label, key, opts]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <select value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13 }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={saveExpense} disabled={saving} style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f0ff", color: "#7c3aed", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
