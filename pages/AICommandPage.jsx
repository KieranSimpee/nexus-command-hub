import { useState, useEffect, useRef } from "react";
import { aiCommandCentre } from "@/api/functions";

const COLORS = {
  bg: "#e8e6fe",
  accent: "#5e50fb",
  primary: "#8c82fc",
  softLilac: "#bab4fd",
  container: "#ffffff",
  text: "#1a1a1f",
  muted: "#9896ad",
  success: "#16a34a",
  error: "#dc2626",
  warning: "#d97706",
  border: "#e2e0fd",
};

const STAGE_LABELS = {
  idle: null,
  sending: "Sending to AI Hub...",
  analysis: "Analysing instruction...",
  solution: "Building solution...",
  code: "Generating code...",
  done: "Complete",
  error: "Error",
};

const STAGE_COLORS = {
  idle: COLORS.muted,
  sending: COLORS.primary,
  analysis: COLORS.accent,
  solution: COLORS.accent,
  code: COLORS.accent,
  done: COLORS.success,
  error: COLORS.error,
};

const QUICK_PROMPTS = [
  "Build a new page for the 5S Portal",
  "Fix a bug in an existing function",
  "Add a new entity to the data model",
  "Create a backend function",
  "Update the UI design of a page",
  "Debug why a feature isn't working",
];

export default function AICommandPage() {
  const [instruction, setInstruction] = useState("");
  const [postedBy, setPostedBy] = useState("Kieran");
  const [stage, setStage] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("command");
  const [copiedSection, setCopiedSection] = useState(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  const handleSubmit = async () => {
    if (!instruction.trim()) return;
    setError(null);
    setResult(null);
    setStage("sending");

    const stages = ["sending", "analysis", "solution", "code"];
    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) setStage(stages[stageIdx]);
    }, 1800);

    try {
      const response = await aiCommandCentre({
        instruction: instruction.trim(),
        posted_by: postedBy || "Kieran",
        target_app_id: "6a1c237bd9f5ff04b6ac7a73",
        target_app_name: "Nexus Command Hub",
      });

      clearInterval(stageTimer);

      if (response.success) {
        setStage("done");
        setResult(response);
        const entry = {
          id: Date.now(),
          instruction: instruction.trim(),
          result: response,
          timestamp: new Date().toLocaleTimeString("en-HK", { timeZone: "Asia/Hong_Kong" }),
        };
        setHistory(prev => [entry, ...prev].slice(0, 20));
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      } else {
        clearInterval(stageTimer);
        setStage("error");
        setError(response.error || "Unknown error from AI Hub");
      }
    } catch (err) {
      clearInterval(stageTimer);
      setStage("error");
      setError(err.message || "Network error — check function is deployed");
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const resetForm = () => {
    setInstruction("");
    setResult(null);
    setError(null);
    setStage("idle");
    textareaRef.current?.focus();
  };

  const isLoading = ["sending", "analysis", "solution", "code"].includes(stage);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "Montserrat, sans-serif", padding: "0 0 80px 0" }}>

      {/* HEADER */}
      <div style={{ background: COLORS.accent, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "Exo 2, sans-serif", color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>
            Nexus Command
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "4px 0 0 0" }}>
            AI Hub — Talk to Simpee, get complete builds
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["command", "history"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                background: activeTab === tab ? "#fff" : "rgba(255,255,255,0.2)",
                color: activeTab === tab ? COLORS.accent : "#fff",
                transition: "all 0.15s",
              }}
            >
              {tab === "command" ? "Command" : `History (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* COMMAND TAB */}
        {activeTab === "command" && (
          <>
            {/* INPUT CARD */}
            <div style={{ background: COLORS.container, borderRadius: 16, padding: 28, boxShadow: "0 2px 16px rgba(94,80,251,0.08)", marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                  Your Instruction
                </label>
                <textarea
                  ref={textareaRef}
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build or fix... (Cmd+Enter to send)"
                  disabled={isLoading}
                  rows={5}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: `2px solid ${instruction ? COLORS.accent : COLORS.border}`,
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 15,
                    color: COLORS.text,
                    background: instruction ? "#faf9ff" : "#fafafa",
                    resize: "vertical",
                    outline: "none",
                    transition: "border 0.2s",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* QUICK PROMPTS */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Quick start
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setInstruction(p)}
                      disabled={isLoading}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: `1px solid ${COLORS.softLilac}`,
                        background: "#f5f4ff",
                        color: COLORS.accent,
                        fontSize: 12,
                        fontFamily: "Montserrat, sans-serif",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* SENDER + SUBMIT */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  value={postedBy}
                  onChange={e => setPostedBy(e.target.value)}
                  placeholder="Your name"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${COLORS.border}`,
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13,
                    color: COLORS.text,
                    width: 140,
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !instruction.trim()}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: isLoading || !instruction.trim() ? COLORS.softLilac : COLORS.accent,
                    color: "#fff",
                    fontFamily: "Exo 2, sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: isLoading || !instruction.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    letterSpacing: 0.5,
                  }}
                >
                  {isLoading ? "Processing..." : "Send to AI Hub →"}
                </button>
                {(result || error) && (
                  <button
                    onClick={resetForm}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 10,
                      border: `1.5px solid ${COLORS.border}`,
                      background: "#fff",
                      color: COLORS.muted,
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    New
                  </button>
                )}
              </div>
            </div>

            {/* STAGE PROGRESS */}
            {stage !== "idle" && (
              <div style={{ background: COLORS.container, borderRadius: 12, padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(94,80,251,0.06)" }}>
                {isLoading && (
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `3px solid ${COLORS.softLilac}`,
                    borderTopColor: COLORS.accent,
                    animation: "spin 0.8s linear infinite",
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {["sending", "analysis", "solution", "code", "done"].map((s, i) => {
                      const stages = ["sending", "analysis", "solution", "code", "done"];
                      const currentIdx = stages.indexOf(stage);
                      const isActive = s === stage;
                      const isPast = stages.indexOf(s) < currentIdx;
                      return (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: isActive ? COLORS.accent : isPast ? COLORS.success : COLORS.border,
                            transition: "background 0.3s",
                          }} />
                          {i < 4 && <div style={{ width: 20, height: 1, background: isPast ? COLORS.success : COLORS.border }} />}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: STAGE_COLORS[stage], fontWeight: 600 }}>
                    {stage === "error" ? `Error: ${error}` : STAGE_LABELS[stage]}
                  </p>
                </div>
                {stage === "done" && (
                  <span style={{ fontSize: 20 }}>✅</span>
                )}
              </div>
            )}

            {/* ERROR */}
            {stage === "error" && error && (
              <div style={{ background: "#fff5f5", border: `1.5px solid #fca5a5`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <p style={{ color: COLORS.error, fontWeight: 700, margin: "0 0 4px" }}>Error from AI Hub</p>
                <p style={{ color: COLORS.error, fontSize: 14, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* RESULT */}
            {result && stage === "done" && (
              <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ANALYSIS */}
                {result.analysis && (
                  <ResultSection
                    label="Analysis"
                    icon="🔍"
                    content={result.analysis}
                    onCopy={() => copyToClipboard(result.analysis, "analysis")}
                    copied={copiedSection === "analysis"}
                    color="#f0f9ff"
                    borderColor="#bae6fd"
                  />
                )}

                {/* SOLUTION */}
                {result.solution && (
                  <ResultSection
                    label="Solution"
                    icon="💡"
                    content={result.solution}
                    onCopy={() => copyToClipboard(result.solution, "solution")}
                    copied={copiedSection === "solution"}
                    color="#f0fdf4"
                    borderColor="#bbf7d0"
                  />
                )}

                {/* CODE */}
                {result.code && (
                  <div style={{ background: "#1a1a2e", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <div style={{ padding: "12px 20px", background: "#16162a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#8c82fc", fontFamily: "Exo 2, sans-serif", fontWeight: 700, fontSize: 13 }}>
                        CODE OUTPUT
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.code, "code")}
                        style={{
                          padding: "5px 14px", borderRadius: 6, border: "none",
                          background: copiedSection === "code" ? COLORS.success : COLORS.accent,
                          color: "#fff", fontSize: 12, fontFamily: "Montserrat, sans-serif",
                          cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        {copiedSection === "code" ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                    <pre style={{
                      margin: 0, padding: 20, color: "#e2e8f0", fontSize: 13,
                      fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
                      maxHeight: 500, overflowY: "auto", lineHeight: 1.6,
                    }}>
                      {result.code}
                    </pre>
                  </div>
                )}

                {/* BUILDER INSTRUCTION */}
                {result.builder_instruction && (
                  <div style={{ background: "#fffbeb", border: `2px solid #fde68a`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "Exo 2, sans-serif", fontWeight: 700, color: "#92400e", fontSize: 14 }}>
                        📋 Builder Instruction — Paste This Exactly
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.builder_instruction, "builder")}
                        style={{
                          padding: "5px 14px", borderRadius: 6, border: "none",
                          background: copiedSection === "builder" ? COLORS.success : "#f59e0b",
                          color: "#fff", fontSize: 12, fontFamily: "Montserrat, sans-serif",
                          cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        {copiedSection === "builder" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p style={{ color: "#78350f", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                      {result.builder_instruction}
                    </p>
                  </div>
                )}

                {/* META */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {result.model && (
                    <MetaBadge label="Engine" value={result.model} color={COLORS.accent} />
                  )}
                  {result.pre_screen_passed !== undefined && (
                    <MetaBadge label="Pre-screen" value={result.pre_screen_passed ? "Passed ✅" : "Skipped"} color={result.pre_screen_passed ? COLORS.success : COLORS.muted} />
                  )}
                  {result.write_errors?.length > 0 && (
                    <MetaBadge label="Write errors" value={result.write_errors.join(", ")} color={COLORS.error} />
                  )}
                </div>

              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.muted }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
                <p style={{ fontSize: 16, fontWeight: 600 }}>No commands yet this session</p>
                <p style={{ fontSize: 13 }}>Switch to Command tab and send your first instruction</p>
              </div>
            ) : (
              history.map(entry => (
                <div key={entry.id} style={{ background: COLORS.container, borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(94,80,251,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <p style={{ fontWeight: 700, color: COLORS.text, fontSize: 14, margin: 0, flex: 1 }}>{entry.instruction}</p>
                    <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 16, whiteSpace: "nowrap" }}>{entry.timestamp}</span>
                  </div>
                  {entry.result.analysis && (
                    <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 10px", lineHeight: 1.5 }}>{entry.result.analysis.slice(0, 200)}...</p>
                  )}
                  <button
                    onClick={() => {
                      setInstruction(entry.instruction);
                      setResult(entry.result);
                      setStage("done");
                      setActiveTab("command");
                    }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${COLORS.softLilac}`, background: "#f5f4ff", color: COLORS.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                  >
                    View Full Result
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

function ResultSection({ label, icon, content, onCopy, copied, color, borderColor }) {
  const COLORS = { accent: "#5e50fb", text: "#1a1a1f", success: "#16a34a" };
  return (
    <div style={{ background: color, border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "Exo 2, sans-serif", fontWeight: 700, color: COLORS.text, fontSize: 14 }}>
          {icon} {label}
        </span>
        <button
          onClick={onCopy}
          style={{
            padding: "5px 14px", borderRadius: 6, border: "none",
            background: copied ? COLORS.success : COLORS.accent,
            color: "#fff", fontSize: 12, fontFamily: "Montserrat, sans-serif",
            cursor: "pointer", fontWeight: 600,
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p style={{ color: COLORS.text, fontSize: 14, margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    </div>
  );
}

function MetaBadge({ label, value, color }) {
  return (
    <div style={{ padding: "5px 12px", borderRadius: 20, background: "#f5f4ff", border: `1px solid #e2e0fd`, display: "flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#9896ad", fontWeight: 600, textTransform: "uppercase" }}>{label}:</span>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
