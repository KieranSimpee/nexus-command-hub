import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── AI HUB ONLY — All writes go to Nexus Command. Never the 5S Portal. ──────
// Context Fix v1.0: enforceContextIsolation added + safe async response pattern.
// SEC-001: Token from env. SEC-002: Azure endpoint from env. LOG-002: validated flag fixed.

const NEXUS_TOKEN = Deno.env.get("NEXUS_PORTAL_TOKEN") || "";
const NEXUS_APP_ID = "6a1c237bd9f5ff04b6ac7a73";
const NEXUS_URL = `https://app.base44.com/api/apps/${NEXUS_APP_ID}`;

const AZURE_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT") || "https://kiera-mpv1nhzc-eastus2.cognitiveservices.azure.com/";
const AZURE_DEPLOYMENT = "gpt-4o";
const AZURE_API_VERSION = "2025-01-01-preview";

interface M365Hit {
  resource?: { subject?: string; name?: string };
  summary?: string;
}

// ─── CONTEXT ISOLATION v1.0 ───────────────────────────────────────────────────
// Blocks any question referencing a foreign Base44 app ID (24-char hex).
// Mirrors the same logic in aiCommandCentre for consistency.
function enforceContextIsolation(
  appId: string,
  question: string
): { error: boolean; message?: string; scopedQuestion?: string } {

  const appIdPattern = /\b[0-9a-f]{24}\b/g;
  const referencedIds = question.match(appIdPattern) || [];

  for (const id of referencedIds) {
    if (id !== appId) {
      return {
        error: true,
        message: `Cross-app reference blocked. Question references app ${id} which is outside the current scope (${appId}). Use target_app_id payload field instead.`,
      };
    }
  }

  return { error: false, scopedQuestion: `[APP:${appId}] ${question}` };
}

// ─── SAFE ASYNC WRITER — always responds, never hangs ────────────────────────
async function postToNexus(entity: string, data: object): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${NEXUS_URL}/entities/${entity}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NEXUS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`postToNexus(${entity}) failed: ${res.status} — ${errText}`);
      return { ok: false, error: `${res.status}: ${errText}` };
    }
    return { ok: true };
  } catch (e: any) {
    console.error(`postToNexus(${entity}) exception:`, e);
    return { ok: false, error: e.message };
  }
}

async function callAzureOpenAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const url = `${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure OpenAI error: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── MAIN HANDLER — safe async: always returns Response, never hangs ──────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { question, context } = body;

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    // ── ISOLATION CHECK: block cross-app questions ────────────────────────────
    const isolation = enforceContextIsolation(NEXUS_APP_ID, question);
    if (isolation.error) {
      return Response.json({ error: isolation.message }, { status: 400 });
    }
    const scopedQuestion = isolation.scopedQuestion || question;

    // ── STEP 1: M365 Copilot context (non-blocking) ───────────────────────────
    let m365Token = "";
    let searchContext = "";

    try {
      const connection = await base44.asServiceRole.connectors.getConnection("outlook");
      m365Token = connection?.access_token || "";
    } catch (_e) {}

    if (m365Token) {
      try {
        const searchRes = await fetch("https://graph.microsoft.com/v1.0/search/query", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${m365Token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [{
              entityTypes: ["message", "driveItem"],
              query: { queryString: question.slice(0, 120) },
              from: 0,
              size: 3,
            }],
          }),
        });
        const searchData = await searchRes.json();
        const hits: M365Hit[] = searchData?.value?.[0]?.hitsContainers?.[0]?.hits || [];
        if (hits.length > 0) {
          searchContext = "\n\nRelevant M365 docs:\n" + hits.map((h) =>
            `- ${h.resource?.subject || h.resource?.name || "item"}: ${h.summary || ""}`
          ).join("\n");
        }
      } catch (_e) {}
    }

    // ── STEP 2: Call Azure OpenAI GPT-4o ──────────────────────────────────────
    const azureKey = Deno.env.get("AZURE_OPENAI_API_KEY_3") || "";
    let answer = "";
    let modelUsed = "none";

    const systemPrompt = `You are the VALIDATOR — the final quality gate for the Nexus Command AI Hub (SIMPLEX-ITY, Hong Kong).
Your role is to review code, plans, and decisions proposed by the AI team before any deployment.
You are strict, thorough, and impartial. You never approve your own work.
Hub App ID scope: ${NEXUS_APP_ID}
Portal stack: React + Base44. Design: #e8e6fe bg, #5e50fb accent, Exo 2/Montserrat fonts.
Give a structured VALIDATOR REPORT with: VERDICT (APPROVED / REJECTED / NEEDS REVISION), FINDINGS, and RECOMMENDATIONS.
Never reference or access any app outside ${NEXUS_APP_ID}.`;

    const userPrompt = scopedQuestion
      + (context ? `\n\nContext: ${context}` : "")
      + searchContext;

    if (azureKey) {
      try {
        answer = await callAzureOpenAI(systemPrompt, userPrompt, azureKey);
        modelUsed = "azure-gpt-4o (VALIDATOR)";
      } catch (e) {
        console.error("Azure OpenAI call failed:", e);
      }
    }

    // ── STEP 3: Fallback — always respond ─────────────────────────────────────
    if (!answer) {
      answer = `VALIDATOR REPORT\n\nVERDICT: PENDING\n\nFINDINGS:\nYour question: "${question}"\nM365 search: ${searchContext ? "context found ✅" : "no results"}\nAzure OpenAI: not responding — check AZURE_OPENAI_API_KEY_3.\n\nRECOMMENDATIONS:\nRecheck Azure key and retry.`;
      modelUsed = "pending";
    }

    // ── STEP 4: Parse verdict ─────────────────────────────────────────────────
    const isApproved = answer.includes("VERDICT: APPROVED") || answer.includes("APPROVED\n");
    const isRejected = answer.includes("VERDICT: REJECTED") || answer.includes("REJECTED\n");
    const validationStatus = isApproved ? "passed" : isRejected ? "failed" : "review";

    // ── STEP 5: Write to Nexus — SChatMessage ─────────────────────────────────
    const chatWrite = await postToNexus("SChatMessage", {
      sender: "VALIDATOR (Copilot)",
      sender_type: "ai",
      message: `Q: ${question}\n\n${answer}`,
      timestamp: new Date().toISOString(),
      session_id: "copilot-validation",
      read: false,
    });
    if (!chatWrite.ok) console.error("SChatMessage write failed:", chatWrite.error);

    // ── STEP 6: Write to Nexus — TestLog ──────────────────────────────────────
    const logWrite = await postToNexus("TestLog", {
      test_name: question.slice(0, 60),
      status: validationStatus,
      result: answer.slice(0, 800),
      tested_at: new Date().toISOString(),
      validator: "VALIDATOR (Azure GPT-4o)",
      simpee_validated: false,
      copilot_validated: isApproved, // LOG-002: only true on genuine APPROVED verdict
      fixed: isApproved,
    });
    if (!logWrite.ok) console.error("TestLog write failed:", logWrite.error);

    // ── SAFE ASYNC RESPONSE — always fires ────────────────────────────────────
    return Response.json({
      success: true,
      answer,
      m365_grounded: searchContext.length > 0,
      model: modelUsed,
      verdict: isApproved ? "APPROVED" : isRejected ? "REJECTED" : "NEEDS REVISION",
      write_errors: [
        !chatWrite.ok ? `SChatMessage: ${chatWrite.error}` : null,
        !logWrite.ok ? `TestLog: ${logWrite.error}` : null,
      ].filter(Boolean),
    });

  } catch (error: any) {
    // Always return — never let the channel close without a response
    return Response.json({ error: error.message }, { status: 500 });
  }
});
