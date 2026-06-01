import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── AI HUB ONLY — All writes go to Nexus Command. Never the 5S Portal. ──────
// STANDING RULE: This function is scoped to the Nexus Command AI Hub.
// SEC-001 FIX (CodeRabbit): Token moved to env var — never hardcoded in source.
// SEC-002 FIX (CodeRabbit): Azure endpoint moved to env var.

const NEXUS_TOKEN = Deno.env.get("NEXUS_PORTAL_TOKEN") || "";
const NEXUS_URL = "https://app.base44.com/api/apps/6a1c237bd9f5ff04b6ac7a73";

// ─── Azure OpenAI config (from env — SEC-002) ────────────────────────────────
const AZURE_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT") || "https://kiera-mpv1nhzc-eastus2.cognitiveservices.azure.com/";
const AZURE_DEPLOYMENT = "gpt-4o";
const AZURE_API_VERSION = "2025-01-01-preview";

// ─── TYPE-001 FIX (CodeRabbit): Typed M365 interface ─────────────────────────
interface M365Hit {
  resource?: { subject?: string; name?: string };
  summary?: string;
}

// ─── Immutable Design Tokens — SIMPLEX-ITY Brand (non-negotiable) ─────────────
const DESIGN_TOKENS = {
  background: "#e8e6fe",
  accent: "#5e50fb",
  container: "#ffffff",
  headingFont: "Exo 2",
  bodyFont: "Montserrat",
  bodyText: "#1a1a1f",
  muted: "#9896ad",
  icons: "Clean, minimal, typographic only. Absolutely no cartoon or emoji assets.",
};

const SYSTEM_PROMPT = `You are Simpee, the ORCHESTRATOR of the Nexus Command AI Hub (SIMPLEX-ITY, Hong Kong).
You are the AI team lead — you receive build instructions from Kieran and produce structured outputs for the team.

Your response MUST follow this exact structure:

ANALYSIS:
[2-3 sentences explaining what the request needs and any important considerations]

SOLUTION:
[Clear step-by-step explanation of what will be built]

CODE:
[Complete, ready-to-paste JSX/TypeScript code. Always include full file content, never partial snippets.]

BUILDER INSTRUCTION:
[Exact one-paragraph instruction for the Base44 builder AI to execute this]

[STRICT DESIGN CONSTRAINTS — NON-NEGOTIABLE]
All UI code must use these exact design tokens with zero deviation:
- Global Background: ${DESIGN_TOKENS.background}
- System Accent: ${DESIGN_TOKENS.accent}
- Layout Containers: ${DESIGN_TOKENS.container}
- Heading Font: "${DESIGN_TOKENS.headingFont}"
- Body Font: "${DESIGN_TOKENS.bodyFont}"
- Body Text: ${DESIGN_TOKENS.bodyText}
- Icons: ${DESIGN_TOKENS.icons}

IMPORTANT: All target app references must come from the instruction payload.
Never hardcode any app URL. The AI Hub is app-agnostic.`;

// ─── LOGIC-001 FIX (CodeRabbit): Context isolation enforced ──────────────────
function enforceContextIsolation(appId: string, instruction: string): { error: boolean; message?: string; scopedInstruction?: string } {
  const otherAppIds = ["69edd16e877d6e4391ad74bd"]; // known non-hub apps
  for (const id of otherAppIds) {
    if (instruction.includes(id)) {
      return {
        error: true,
        message: `Cross-app reference blocked. Instruction references app ${id} which is outside the current scope (${appId}). Use target_app_id payload field instead.`,
      };
    }
  }
  return { error: false, scopedInstruction: `[APP:${appId}] ${instruction}` };
}

// ─── ERR-001 FIX (CodeRabbit): postToNexus with error surfacing ──────────────
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

function screenCodeQuality(code: string): { passed: boolean; notes: string } {
  if (!code || code.trim().length < 20) {
    return { passed: false, notes: "No code generated — Azure OpenAI key may be missing or model not responding." };
  }
  const issues: string[] = [];
  if (code.includes("undefined") && !code.includes("// undefined")) issues.push("Possible undefined reference");
  if (code.includes("TODO") || code.includes("FIXME")) issues.push("Contains unresolved TODO/FIXME markers");
  if (!code.includes("import") && !code.includes("function") && !code.includes("const")) {
    issues.push("Code structure unclear — may be incomplete");
  }
  return issues.length > 0
    ? { passed: false, notes: issues.join(" | ") }
    : { passed: true, notes: "Basic syntax and structure check passed." };
}

// ─── PERF-001 FIX (CodeRabbit): max_tokens reduced to 2000 ──────────────────
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
      temperature: 0.2,
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
    const { instruction, posted_by, target_app_id, target_app_name } = body;

    if (!instruction) {
      return Response.json({ error: "No instruction provided" }, { status: 400 });
    }

    // ── LOGIC-001: Enforce context isolation before anything else ─────────────
    const hubAppId = "6a1c237bd9f5ff04b6ac7a73";
    const isolation = enforceContextIsolation(hubAppId, instruction);
    if (isolation.error) {
      return Response.json({ error: isolation.message }, { status: 400 });
    }
    const scopedInstruction = isolation.scopedInstruction || instruction;

    // ── STEP 1: Get M365 context ──────────────────────────────────────────────
    let m365Token = "";
    let copilotContext = "";

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
              query: { queryString: instruction.slice(0, 120) },
              from: 0,
              size: 3,
            }],
          }),
        });
        const searchData = await searchRes.json();
        const hits: M365Hit[] = searchData?.value?.[0]?.hitsContainers?.[0]?.hits || [];
        if (hits.length > 0) {
          copilotContext = "\n\nCopilot M365 context found:\n" + hits.map((h) =>
            `- ${h.resource?.subject || h.resource?.name || "item"}: ${h.summary || ""}`
          ).join("\n");
        }
      } catch (_e) {}
    }

    // ── STEP 2: Build prompt ──────────────────────────────────────────────────
    const targetLabel = target_app_name
      ? `Target App: ${target_app_name} (ID: ${target_app_id || "not specified"})`
      : "Target App: Nexus Command AI Hub";

    const hubContext = `
${targetLabel}
Stack: React + Base44 (Deno backend functions)
Nexus Command Entities: SChatMessage, TestLog, AIConnector, azureConnectorStub, SandboxProject, ProjectFile, TeamLog
Design tokens (immutable): ${JSON.stringify(DESIGN_TOKENS)}
Import pattern: import { EntityName } from '@/api/entities'
${copilotContext}`;

    const fullPrompt = `Instruction from Kieran (ORCHESTRATOR): "${scopedInstruction}"\n\nHub context:${hubContext}`;

    // ── STEP 3: Azure GPT-4o code generation ─────────────────────────────────
    const azureKey = Deno.env.get("AZURE_OPENAI_API_KEY_3") || "";
    let simpeeResponse = "";
    let modelUsed = "simpee-lite";

    if (azureKey) {
      try {
        simpeeResponse = await callAzureOpenAI(SYSTEM_PROMPT, fullPrompt, azureKey);
        modelUsed = "azure-gpt-4o + m365";
      } catch (e) {
        console.error("Azure OpenAI call failed:", e);
      }
    }

    if (!simpeeResponse) {
      simpeeResponse = `ANALYSIS:
Request received: "${instruction}"
Status: Azure OpenAI not responding — check AZURE_OPENAI_API_KEY_3 secret.

SOLUTION:
Retry after confirming Azure key is active.

CODE:
// Azure OpenAI connection failed.

BUILDER INSTRUCTION:
Retry after fixing Azure OpenAI connection.`;
    }

    // ── STEP 4: Parse response sections ──────────────────────────────────────
    const analysis = simpeeResponse.match(/ANALYSIS:\s*([\s\S]*?)(?=SOLUTION:|$)/i)?.[1]?.trim() || "";
    const solution = simpeeResponse.match(/SOLUTION:\s*([\s\S]*?)(?=CODE:|$)/i)?.[1]?.trim() || "";
    const code = simpeeResponse.match(/CODE:\s*([\s\S]*?)(?=BUILDER INSTRUCTION:|$)/i)?.[1]?.trim() || "";
    const builderInstruction = simpeeResponse.match(/BUILDER INSTRUCTION:\s*([\s\S]*?)$/i)?.[1]?.trim() || "";

    // ── STEP 5: Code quality screen ───────────────────────────────────────────
    const qualityCheck = screenCodeQuality(code);
    // LOG-001 FIX (CodeRabbit): simpee_validated only true on real Azure pass
    const realAzurePass = modelUsed === "azure-gpt-4o + m365" && qualityCheck.passed;
    const statusEmoji = realAzurePass ? "✅" : "⚠️";

    // ── STEP 6: Write to Nexus Command — with error handling (ERR-001) ────────
    const chatWrite = await postToNexus("SChatMessage", {
      sender: "Simpee (ORCHESTRATOR)",
      sender_type: "ai",
      message: `${statusEmoji} COMMAND RECEIVED\n\nINSTRUCTION: ${instruction}\n\nANALYSIS:\n${analysis}\n\nSOLUTION:\n${solution}\n\nBUILDER INSTRUCTION:\n${builderInstruction}\n\n[ENGINE]: ${modelUsed}\n[PRE-SCREEN]: ${qualityCheck.notes}`,
      timestamp: new Date().toISOString(),
      session_id: "ai-command-centre",
      read: false,
    });

    if (!chatWrite.ok) {
      console.error("SChatMessage write failed:", chatWrite.error);
    }

    if (code && code.length > 20) {
      const fileWrite = await postToNexus("ProjectFile", {
        project_id: "ai-command-centre",
        filename: `command_${Date.now()}.tsx`,
        content: code,
        language: "tsx",
        version: "1",
        notes: `Generated for: ${instruction.slice(0, 80)} | Engine: ${modelUsed} | Target: ${targetLabel}`,
      });
      if (!fileWrite.ok) console.error("ProjectFile write failed:", fileWrite.error);
    }

    const logWrite = await postToNexus("TestLog", {
      test_name: instruction.slice(0, 50),
      status: realAzurePass ? "passed" : "needs_review",
      result: `[ENGINE]: ${modelUsed}\n[PRE-SCREEN]: ${qualityCheck.notes}\n\n[ANALYSIS]: ${analysis}`,
      tested_at: new Date().toISOString(),
      validator: "Simpee (ORCHESTRATOR)",
      simpee_validated: realAzurePass,
      copilot_validated: false,
      fixed: realAzurePass,
    });
    if (!logWrite.ok) console.error("TestLog write failed:", logWrite.error);

    return Response.json({
      success: true,
      instruction,
      analysis,
      solution,
      code,
      builder_instruction: builderInstruction,
      model: modelUsed,
      pre_screen_passed: realAzurePass,
      write_errors: [
        !chatWrite.ok ? `SChatMessage: ${chatWrite.error}` : null,
        !logWrite.ok ? `TestLog: ${logWrite.error}` : null,
      ].filter(Boolean),
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
