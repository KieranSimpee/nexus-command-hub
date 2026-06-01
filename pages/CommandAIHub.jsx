import { useState, useRef, useEffect } from "react";
import { aiCommandCentre } from "@/api/functions";

const COLORS = {
  bg: "#e8e6fe",
  accent: "#5e50fb",
  primary: "#8c82fc",
  soft: "#bab4fd",
  container: "#ffffff",
  text: "#1a1a1f",
  muted: "#9896ad",
  border: "#e2e0fd",
  success: "#16a34a",
  error: "#dc2626",
};

const STAGES = ["receiving", "analysing", "planning", "building", "done"];
const STAGE_LABELS = {
  receiving: "Receiving instruction...",
  analysing: "Analysing request...",
  planning: "Planning solution...",
  building: "Building code...",
  done: "Complete",
};

const QUICK_PROMPTS = [
  "Build a new page for 5S Portal",
  "Fix a bug in a backend function",
  "Add a new entity field",
  "Create a backend function",
  "Review existing code for errors",
  "Update a page's UI design",
];

export default function CommandAIHub() {
  const [instruction, setInstruction] = useState("");
  const [stage, setStage] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("command");
  const [copied, setCopied] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const textareaRef = useRef(null);
  const outputRef = useRef(null);
  const timerRef = useRef(null);

  const isLoading = ["receiving", "analysing", "planning", "building"].includes(stage);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setInterval(() => {
        setStageIndex(prev => {
          const next = prev + 1;
          if (next < STAGES.length - 1) {
            setStage(STAGES[next]);
            return next;
          }
          return prev;
        });
      }, 2000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isLoading]);

  const handleSend = async () => {
    if (!instruction.trim() || isLoading) return;
    setError(null);
    setResult(null);
    setStage("receiving");
    setStageIndex(0);

    try {
      const res = await aiCommandCentre({
        instruction: instruction.trim(),
        posted_by: "Kieran",
        target_app_id: "6a1c237bd9f5ff04b6ac7a73",
        target_app_name: "Nexus Command Hub",
      });

      clearInterval(timerRef.current);

      if (res.success) {
        setStage("done");
        setResult(res);
        setHistory(prev => [{
          id: Date.now(),
          instruction: instruction.trim(),
          result: res,
          time: new Date().toLocaleTimeString("en-HK", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 30));
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      } else {
        setStage("error");
        setError(res.error || "AI Hub returned an error");
      }
    } catch (e) {
      clearInterval(timerRef.current);
      setStage("error");
      setError(e.message || "Connection failed — check aiCommandCentre is deployed");
    }
  };

  const handleKeyDown = e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setInstruction("");
    setResult(null);
    setError(null);
    setStage("idle");
    textareaRef.current?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "Montserrat, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{
        background: COLORS.accent,
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(94,80,251,0.3)",
      }}>
        <div>
          <h1 style={{ fontFamily: "Exo 2, sans-serif", color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>
            NEXUS COMMAND
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "3px 0 0", fontWeight: 500 }}>
            AI Hub · Powered by Azure OpenAI gpt-4o
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "command", label: "Command" },
            { key: "history", label: `History ${history.length > 0 ? `(${history.length})` : ""}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              background: tab === t.key ? "#fff" : "rgba(255,255,255,0.18)",
              color: tab === t.key ? COLORS.accent : "#fff",
              transition: "all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* COMMAND TAB */}
        {tab === "command" && (
          <>
            {/* INPUT CARD */}
            <div style={{ background: COLORS.container, borderRadius: 16, padding: 28, boxShadow: "0 4px 20px rgba(94,80,251,0.08)", marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Your Instruction
              </label>
              <textarea
                ref={textareaRef}
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Tell me what to build or fix... (Ctrl+Enter to send)"
                rows={5}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 10,
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: `2px solid ${instruction.trim() ? COLORS.accent : COLORS.border}`,
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 14,
                  color: COLORS.text,
                  background: "#fafafa",
                  resize: "vertical",
                  outline: "none",
                  transition: "border 0.2s",
                  boxSizing: "border-box",
                  opacity: isLoading ? 0.6 : 1,
                }}
              />

              {/* QUICK PROMPTS */}
              <div style={{ marginTop: 14, marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: COLORS.muted, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Quick start
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => setInstruction(p)} disabled={isLoading} style={{
                      padding: "5px 13px",
                      borderRadius: 20,
                      border: `1px solid ${COLORS.soft}`,
                      background: "#f5f4ff",
                      color: COLORS.accent,
                      fontSize: 12,
                      fontFamily: "Montserrat, sans-serif",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !instruction.trim()}
                  style={{
                    flex: 1,
                    padding: "13px 0",
                    borderRadius: 10,
                    border: "none",
                    background: isLoading || !instruction.trim() ? COLORS.soft : COLORS.accent,
                    color: "#fff",
                    fontFamily: "Exo 2, sans-serif",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: isLoading || !instruction.trim() ? "not-allowed" : "pointer",
                    letterSpacing: 0.5,
                    transition: "background 0.2s",
                  }}
                >
                  {isLoading ? "Processing..." : "SEND TO AI HUB →"}
                </button>
                {(result || error) && (
                  <button onClick={reset} style={{
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: `1.5px solid ${COLORS.border}`,
                    background: "#fff",
                    color: COLORS.muted,
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}>
                    New
                  </button>
                )}
              </div>
            </div>

            {/* STAGE TRACKER */}
            {stage !== "idle" && (
              <div style={{
                background: COLORS.container,
                borderRadius: 12,
                padding: "16px 22px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 2px 8px rgba(94,80,251,0.06)",
              }}>
                {isLoading && (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `3px solid ${COLORS.soft}`,
                    borderTopColor: COLORS.accent,
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }} />
                )}
                {stage === "done" && <span style={{ fontSize: 20 }}>✅</span>}
                {stage === "error" && <span style={{ fontSize: 20 }}>❌</span>}
                <div style={{ flex: 1 }}>
                  {/* Stage dots */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {STAGES.map((s, i) => {
                      const currentIdx = STAGES.indexOf(stage === "error" ? "done" : stage);
                      const past = i < currentIdx;
                      const active = s === stage;
                      return (
                        <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                            background: active ? COLORS.accent : past ? COLORS.success : COLORS.border,
                            transition: "background 0.3s",
                          }} />
                          {i < STAGES.length - 1 && (
                            <span style={{ width: 18, height: 2, background: past ? COLORS.success : COLORS.border, display: "inline-block" }} />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 600,
                    color: stage === "error" ? COLORS.error : stage === "done" ? COLORS.success : COLORS.accent,
                  }}>
                    {stage === "error" ? `Error: ${error}` : STAGE_LABELS[stage] || ""}
                  </p>
                </div>
              </div>
            )}

            {/* ERROR CARD */}
            {stage === "error" && error && (
              <div style={{ background: "#fff5f5", border: `1.5px solid #fca5a5`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <p style={{ color: COLORS.error, fontWeight: 700, margin: "0 0 6px", fontSize: 14 }}>AI Hub Error</p>
                <p style={{ color: COLORS.error, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{error}</p>
              </div>
            )}

            {/* RESULT OUTPUT */}
            {result && stage === "done" && (
              <div ref={outputRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ANALYSIS */}
                {result.analysis && (
                  <OutputCard
                    label="Analysis" icon="🔍"
                    content={result.analysis}
                    bg="#f0f9ff" border="#bae6fd"
                    onCopy={() => copy(result.analysis, "analysis")}
                    copied={copied === "analysis"}
                  />
                )}

                {/* SOLUTION */}
                {result.solution && (
                  <OutputCard
                    label="Solution" icon="💡"
                    content={result.solution}
                    bg="#f0fdf4" border="#bbf7d0"
                    onCopy={() => copy(result.solution, "solution")}
                    copied={copied === "solution"}
                  />
                )}

                {/* CODE BLOCK */}
                {result.code && (
                  <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <div style={{
                      background: "#16162a", padding: "12px 20px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ color: COLORS.primary, fontFamily: "Exo 2, sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
                        CODE
                      </span>
                      <button onClick={() => copy(result.code, "code")} style={{
                        padding: "5px 14px", borderRadius: 6, border: "none",
                        background: copied === "code" ? COLORS.success : COLORS.accent,
                        color: "#fff", fontSize: 12, cursor: "pointer",
                        fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                      }}>
                        {copied === "code" ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                    <pre style={{
                      margin: 0, padding: "20px",
                      background: "#1a1a2e", color: "#e2e8f0",
                      fontSize: 13, fontFamily: "monospace",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                      maxHeight: 480, overflowY: "auto", lineHeight: 1.65,
                    }}>
                      {result.code}
                    </pre>
                  </div>
                )}

                {/* BUILDER INSTRUCTION — the "where to paste" card */}
                {result.builder_instruction && (
                  <div style={{
                    background: "#fffbeb",
                    border: `2px solid #fde68a`,
                    borderRadius: 12, padding: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "Exo 2, sans-serif", fontWeight: 800, color: "#92400e", fontSize: 14 }}>
                        📋 WHERE TO PASTE
                      </span>
                      <button onClick={() => copy(result.builder_instruction, "builder")} style={{
                        padding: "5px 14px", borderRadius: 6, border: "none",
                        background: copied === "builder" ? COLORS.success : "#f59e0b",
                        color: "#fff", fontSize: 12, cursor: "pointer",
                        fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                      }}>
                        {copied === "builder" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p style={{ color: "#78350f", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                      {result.builder_instruction}
                    </p>
                  </div>
                )}

                {/* META ROW */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.model && <MetaTag label="Engine" value={result.model} />}
                  {result.pre_screen_passed !== undefined && (
                    <MetaTag label="Pre-screen" value={result.pre_screen_passed ? "Passed ✅" : "Skipped"} color={result.pre_screen_passed ? COLORS.success : COLORS.muted} />
                  )}
                  {result.write_errors?.length > 0 && (
                    <MetaTag label="Write errors" value={result.write_errors.join(", ")} color={COLORS.error} />
                  )}
                </div>

              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: COLORS.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No commands yet</p>
                <p style={{ fontSize: 13 }}>Send your first instruction to see history here</p>
              </div>
            ) : (
              history.map(entry => (
                <div key={entry.id} style={{
                  background: COLORS.container, borderRadius: 12,
                  padding: 20, marginBottom: 14,
                  boxShadow: "0 2px 8px rgba(94,80,251,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, color: COLORS.text, fontSize: 14, margin: 0, flex: 1, lineHeight: 1.4 }}>
                      {entry.instruction}
                    </p>
                    <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 12, whiteSpace: "nowrap" }}>
                      {entry.time}
                    </span>
                  </div>
                  {entry.result?.analysis && (
                    <p style={{ fontSize: 12, color: COLORS.muted, margin: "0 0 10px", lineHeight: 1.5 }}>
                      {entry.result.analysis.slice(0, 180)}...
                    </p>
                  )}
                  <button onClick={() => {
                    setInstruction(entry.instruction);
                    setResult(entry.result);
                    setStage("done");
                    setTab("command");
                  }} style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: `1px solid ${COLORS.soft}`,
                    background: "#f5f4ff", color: COLORS.accent,
                    fontSize: 12, cursor: "pointer", fontWeight: 700,
                    fontFamily: "Montserrat, sans-serif",
                  }}>
                    View Full Result →
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        textarea:focus { border-color: #5e50fb !important; }
        textarea { transition: border-color 0.2s; }
      `}</style>
    </div>
  );
}

function OutputCard({ label, icon, content, bg, border, onCopy, copied }) {
  const COLORS = { accent: "#5e50fb", text: "#1a1a1f", success: "#16a34a" };
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "Exo 2, sans-serif", fontWeight: 800, color: COLORS.text, fontSize: 14 }}>
          {icon} {label}
        </span>
        <button onClick={onCopy} style={{
          padding: "5px 14px", borderRadius: 6, border: "none",
          background: copied ? COLORS.success : COLORS.accent,
          color: "#fff", fontSize: 12, cursor: "pointer",
          fontFamily: "Montserrat, sans-serif", fontWeight: 700,
        }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p style={{ color: COLORS.text, fontSize: 14, margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    </div>
  );
}

function MetaTag({ label, value, color = "#5e50fb" }) {
  return (
    <div style={{
      padding: "4px 12px", borderRadius: 20,
      background: "#f5f4ff", border: "1px solid #e2e0fd",
      display: "flex", gap: 5, alignItems: "center",
    }}>
      <span style={{ fontSize: 10, color: "#9896ad", fontWeight: 700, textTransform: "uppercase" }}>{label}:</span>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
