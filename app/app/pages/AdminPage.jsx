import { useState, useEffect } from "react";
import { VaultItem, Document, Expense, BankAccount } from "@/api/entities";

const TABS = ["Credentials", "Bank Info", "Documents", "App Access"];

const canEdit = (user) => user.role === "Admin" || user.access_admin === "Edit";

export default function AdminPage({ user }) {
  const [tab, setTab] = useState("Credentials");
  const [vaultItems, setVaultItems] = useState([]);
  const [banks, setBanks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState({});
  const [showVaultForm, setShowVaultForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editVault, setEditVault] = useState(null);
  const [editBank, setEditBank] = useState(null);
  const [vaultForm, setVaultForm] = useState({});
  const [bankForm, setBankForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const editable = canEdit(user);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, b, d] = await Promise.all([VaultItem.list(), BankAccount.list(), Document.filter({ category: "Legal" })]);
      setVaultItems(v);
      setBanks(b);
      setDocs(d);
    } catch (e) {}
    setLoading(false);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(p => ({ ...p, [key]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000);
  };

  const saveVault = async () => {
    setSaving(true);
    try {
      const payload = { ...vaultForm, last_updated: new Date().toISOString().split("T")[0] };
      if (editVault) await VaultItem.update(editVault.id, payload);
      else await VaultItem.create(payload);
      await loadAll();
      setShowVaultForm(false);
    } catch (e) {}
    setSaving(false);
  };

  const saveBank = async () => {
    setSaving(true);
    try {
      const payload = { ...bankForm, last_updated: new Date().toISOString().split("T")[0] };
      if (editBank) await BankAccount.update(editBank.id, payload);
      else await BankAccount.create(payload);
      await loadAll();
      setShowBankForm(false);
    } catch (e) {}
    setSaving(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Auto-categorize based on filename
      const name = file.name.toLowerCase();
      let category = "Legal";
      if (name.includes("invoice") || name.includes("receipt")) category = "Finance";
      if (name.includes("contract") || name.includes("agreement") || name.includes("nda")) category = "Contract";

      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await resp.json();
      await Document.create({ title: file.name, category, file_url: url, file_name: file.name, file_type: file.type, related_to: "Admin", tags: ["admin"], is_pinned: false });

      // If it's an invoice, also create an expense record
      if (category === "Finance") {
        await Expense.create({ title: file.name, category: "Professional Fees", currency: "HKD", date: new Date().toISOString().split("T")[0], receipt_url: url, status: "Pending", notes: "Auto-imported from Admin upload" });
      }
      await loadAll();
      alert("File uploaded and filed!");
    } catch (err) {
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const filteredVault = vaultItems.filter(v =>
    !search || v.service_name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedVault = filteredVault.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const tabStyle = (t) => ({
    padding: "9px 18px", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: tab === t ? "#7c3aed" : "#f3f0ff",
    color: tab === t ? "#fff" : "#6d28d9",
    transition: "all 0.15s"
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>⚙️ Admin</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Company credentials, bank info, documents & app access</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {uploading ? "Uploading..." : "📎 Upload Doc"}
            <input type="file" style={{ display: "none" }} onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{t}</button>)}
      </div>

      {loading ? <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>Loading...</div> : (
        <>
          {/* CREDENTIALS TAB */}
          {tab === "Credentials" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #e2d9f3", fontSize: 13 }} />
                {editable && (
                  <button onClick={() => { setEditVault(null); setVaultForm({ service_name: "", category: "Company Admin", url: "", username: "", password: "", is_admin_only: false }); setShowVaultForm(true); }}
                    style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    + Add
                  </button>
                )}
              </div>
              {Object.entries(groupedVault).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, borderBottom: "1px solid #ede9fe", paddingBottom: 6 }}>{cat}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                    {items.map(item => (
                      <div key={item.id} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #ede9fe", padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#1a0533" }}>{item.service_name}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {item.is_admin_only && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>ADMIN</span>}
                            {editable && <button onClick={() => { setEditVault(item); setVaultForm({ ...item }); setShowVaultForm(true); }} style={{ background: "#f3f0ff", border: "none", borderRadius: 5, padding: "3px 7px", fontSize: 10, color: "#7c3aed", cursor: "pointer" }}>Edit</button>}
                          </div>
                        </div>
                        {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#7c3aed", display: "block", marginBottom: 8, textDecoration: "none" }}>🔗 {item.url}</a>}
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>User: </span>{item.username}
                          <button onClick={() => copy(item.username, `u${item.id}`)} style={{ marginLeft: 6, background: "none", border: "none", color: "#7c3aed", fontSize: 10, cursor: "pointer" }}>{copied[`u${item.id}`] ? "✓" : "Copy"}</button>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          <span style={{ fontWeight: 600 }}>Pass: </span>
                          <span style={{ fontFamily: "monospace" }}>{revealed[item.id] ? item.password : "••••••••"}</span>
                          <button onClick={() => setRevealed(p => ({ ...p, [item.id]: !p[item.id] }))} style={{ marginLeft: 6, background: "none", border: "none", color: "#7c3aed", fontSize: 10, cursor: "pointer" }}>{revealed[item.id] ? "Hide" : "Show"}</button>
                          <button onClick={() => copy(item.password, `p${item.id}`)} style={{ marginLeft: 4, background: "none", border: "none", color: "#7c3aed", fontSize: 10, cursor: "pointer" }}>{copied[`p${item.id}`] ? "✓" : "Copy"}</button>
                        </div>
                        {item.notes && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, background: "#faf9ff", borderRadius: 6, padding: "5px 7px" }}>{item.notes}</div>}
                        {item.last_updated && <div style={{ fontSize: 9, color: "#cbd5e1", marginTop: 6 }}>Updated {item.last_updated}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BANK INFO TAB */}
          {tab === "Bank Info" && (
            <div>
              {editable && (
                <button onClick={() => { setEditBank(null); setBankForm({ bank_name: "", account_name: "", account_number: "", currency: "HKD", type: "Current", entity: "5SENSESBEAUTY LIMITED", is_admin_only: true }); setShowBankForm(true); }}
                  style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
                  + Add Bank Account
                </button>
              )}
              {banks.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>No bank accounts added yet. Click + Add to get started.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {banks.map(bank => (
                    <div key={bank.id} style={{ background: "linear-gradient(135deg, #1a0533, #2d1157)", borderRadius: 16, padding: "20px", color: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{bank.entity}</div>
                        {editable && <button onClick={() => { setEditBank(bank); setBankForm({ ...bank }); setShowBankForm(true); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 5, padding: "3px 7px", fontSize: 10, color: "#c4b5fd", cursor: "pointer" }}>Edit</button>}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{bank.bank_name}</div>
                      <div style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 8 }}>{bank.account_name}</div>
                      <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: 2, color: "#e2e8f0" }}>{bank.account_number}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <span style={{ background: "rgba(124,58,237,0.3)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#c4b5fd" }}>{bank.currency}</span>
                        <span style={{ background: "rgba(124,58,237,0.3)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#c4b5fd" }}>{bank.type}</span>
                      </div>
                      {bank.balance !== undefined && bank.balance !== null && (
                        <div style={{ marginTop: 12, fontSize: 20, fontWeight: 800, color: "#a7f3d0" }}>{bank.currency} {bank.balance?.toLocaleString()}</div>
                      )}
                      {bank.notes && <div style={{ fontSize: 10, color: "#8b7fb0", marginTop: 8 }}>{bank.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {tab === "Documents" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {docs.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #ede9fe", padding: "14px", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#ede9fe"}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a0533", marginBottom: 4 }}>{doc.title}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{doc.category}</div>
                    </div>
                  </a>
                ))}
                {docs.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: 30 }}>No documents yet. Upload one above.</div>}
              </div>
            </div>
          )}

          {/* APP ACCESS TAB */}
          {tab === "App Access" && (
            <div>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Quick launch links for company apps. Credentials stored in Credentials tab.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {vaultItems.filter(v => v.url).map(item => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "16px", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#ede9fe"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🔗</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a0533" }}>{item.service_name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{item.category}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Vault Form Modal */}
      {showVaultForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,5,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: "#1a0533", marginBottom: 20 }}>{editVault ? "Edit Credential" : "Add Credential"}</h2>
            {[["Service Name", "service_name"], ["URL", "url"], ["Username / Email", "username"], ["Password", "password"], ["Notes", "notes"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <input value={vaultForm[key] || ""} onChange={e => setVaultForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Category</label>
              <select value={vaultForm.category || "Other"} onChange={e => setVaultForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13 }}>
                {["Company Admin", "Design & Marketing", "AI & Platform", "Website & Hosting", "Finance & Trading", "Email", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input type="checkbox" id="adminOnly" checked={!!vaultForm.is_admin_only} onChange={e => setVaultForm(p => ({ ...p, is_admin_only: e.target.checked }))} />
              <label htmlFor="adminOnly" style={{ fontSize: 13, color: "#1a0533" }}>Admin only</label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveVault} disabled={saving} style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setShowVaultForm(false)} style={{ background: "#f3f0ff", color: "#7c3aed", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Form Modal */}
      {showBankForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,5,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: "#1a0533", marginBottom: 20 }}>{editBank ? "Edit Bank Account" : "Add Bank Account"}</h2>
            {[["Bank Name", "bank_name"], ["Account Name", "account_name"], ["Account Number", "account_number"], ["Notes", "notes"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <input value={bankForm[key] || ""} onChange={e => setBankForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            {[["Currency", "currency", ["HKD", "USD", "CNY", "EUR", "GBP"]], ["Type", "type", ["Current", "Savings", "FX", "Credit Card"]], ["Entity", "entity", ["5SENSESBEAUTY LIMITED", "SIMPLEX-ITY", "Personal"]]].map(([label, key, opts]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <select value={bankForm[key] || ""} onChange={e => setBankForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13 }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Balance</label>
              <input type="number" value={bankForm.balance || ""} onChange={e => setBankForm(p => ({ ...p, balance: parseFloat(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2d9f3", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveBank} disabled={saving} style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setShowBankForm(false)} style={{ background: "#f3f0ff", color: "#7c3aed", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
