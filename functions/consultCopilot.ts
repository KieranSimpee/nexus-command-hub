import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── AI HUB ONLY — All writes go to Nexus Command. Never the 5S Portal. ──────
// SEC-001 FIX (CodeRabbit): Token moved to env var — never hardcoded in source.
// SEC-002 FIX (CodeRabbit): Azure endpoint moved to env var.

const NEXUS_TOKEN = Deno.env.get("NEXUS_PORTAL_TOKEN") || "";
const NEXUS_URL = "https://app.base44.com/api/apps/6a1c237bd9f5ff04b6ac7a73";

const AZURE_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT") || "https://kiera-mpv1nhzc-eastus2.cognitiveservices.azure.com/";
const AZURE_DEPLOYMENT = "gpt-4o";
const AZURE_API_VERSION = "2025-01-01-preview";

// ─── TYPE-001 FIX (CodeRabbit): Shared typed M365 interface ──────────────────
interface M365Hit {
  resource?: { subject?: string; name?: string };
  summary?: string;
}

// ─── ERR-002 FIX (CodeRabbit): postToNexus with error surfacing ──────────────
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

// ─── STYLE-001 FIX (CodeRabbit): max_tokens raised to 2000 for full reports ──
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { question, context } = body;

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    // ── Step 1: Get M365 token and search for relevant context ────────────────
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
        // TYPE-001 FIX: typed hits
        const hits: M365Hit[] = searchData?.value?.[0]?.hitsContainers?.[0]?.hits || [];
        if (hits.length > 0) {
          searchContext = "\n\nRelevant M365 docs:\n" + hits.map((h) =>
            `- ${h.resource?.subject || h.resource?.name || "item"}: ${h.summary || ""}`
          ).join("\n");
        }
      } catch (_e) {}
    }

    // ── Step 2: Call Azure OpenAI GPT-4o ──────────────────────────────────────
    const azureKey = Deno.env.get("AZURE_OPENAI_API_KEY_3") || "";
    let answer = "";
    let modelUsed = "none";

    const systemPrompt = `You are the VALIDATOR — the final quality gate for the Nexus Command AI Hub (SIMPLEX-ITY, Hong Kong).
Your role is to review code, plans, and decisions proposed by the AI team before any deployment.
You are strict, thorough, and impartial. You never approve your own work.
Portal stack: React + Base44. Design: #e8e6fe bg, #5e50fb accent, Exo 2/Montserrat fonts.
Give a structured VALIDATOR REPORT with: VERDICT (APPROVED / REJECTED / NEEDS REVISION), FINDINGS, and RECOMMENDATIONS.`;

    const userPrompt = question
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

    // ── Step 3: Fallback if Azure fails ───────────────────────────────────────
    if (!answer) {
      answer = `VALIDATOR REPORT\n\nVERDICT: PENDING\n\nFINDINGS:\nYour question: "${question}"\nM365 search: ${searchContext ? "context found ✅" : "no results"}\nAzure OpenAI: not responding — check AZURE_OPENAI_API_KEY_3.\n\nRECOMMENDATIONS:\nRecheck Azure key and retry.`;
      modelUsed = "pending";
    }

    // ── LOG-002 FIX (CodeRabbit): copilot_validated only true on real APPROVED ─
    const isApproved = answer.includes("VERDICT: APPROVED") || answer.includes("APPROVED\n");
    const isRejected = answer.includes("VERDICT: REJECTED") || answer.includes("REJECTED\n");
    const validationStatus = isApproved ? "passed" : isRejected ? "failed" : "review";

    // ── Step 4: Write ONLY to Nexus Command — with error handling (ERR-002) ───
    const chatWrite = await postToNexus("SChatMessage", {
      sender: "VALIDATOR (Copilot)",
      sender_type: "ai",
      message: `Q: ${question}\n\n${answer}`,
      timestamp: new Date().toISOString(),
      session_id: "copilot-validation",
      read: false,
    });
    if (!chatWrite.ok) console.error("SChatMessage write failed:", chatWrite.error);

    const logWrite = await postToNexus("TestLog", {
      test_name: question.slice(0, 60),
      status: validationStatus,
      result: answer.slice(0, 800),
      tested_at: new Date().toISOString(),
      validator: "VALIDATOR (Azure GPT-4o)",
      simpee_validated: false,
      // LOG-002 FIX: only true on genuine APPROVED verdict
      copilot_validated: isApproved,
      fixed: isApproved,
    });
    if (!logWrite.ok) console.error("TestLog write failed:", logWrite.error);

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
    return Response.json({ error: error.message }, { status: 500 });
  }
});
