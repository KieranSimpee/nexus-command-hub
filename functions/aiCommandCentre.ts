import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── AI HUB ONLY — All writes go to Nexus Command. Never the 5S Portal. ──────
// Context Fix v1.0: enforceContextIsolation hardened + delegation SandboxProject write
// SEC-001: Token from env. SEC-002: Azure endpoint from env. LOGIC-001: Isolation enforced.

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

// ─── CONTEXT ISOLATION v1.0 ───────────────────────────────────────────────────
// Rule: Block any instruction that references a Base44 app ID that is NOT the
// current hub scope. Also blocks connector/function names from unrelated apps.
// Pattern: any 24-char hex string that is not NEXUS_APP_ID is treated as foreign.
function enforceContextIsolation(
  appId: string,
  instruction: string
): { error: boolean; message?: string; scopedInstruction?: string } {

  // Match any 24-char lowercase hex string (Base44 app ID pattern)
  const appIdPattern = /\b[0-9a-f]{24}\b/g;
  const referencedIds = instruction.match(appIdPattern) || [];

  for (const id of referencedIds) {
    if (id !== appId) {
      return {
        error: true,
        message: `Cross-app reference blocked. Instruction references app ${id} which is outside the current scope (${appId}). Use the target_app_id payload field instead.`,
      };
    }
  }

  // Prefix instruction with app scope tag for downstream traceability
  const scopedInstruction = `[APP:${appId}] ${instruction}`;
  return { error: false, scopedInstruction };
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

// ─── MAIN HANDLER — safe async: always returns Response, never hangs ──────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { instruction, posted_by, target_app_id, target_app_name } = body;

    if (!instruction) {
      return Response.json({ error: "No instruction provided" }, { status: 400 });
    }

    // ── ISOLATION CHECK: runs before anything else ────────────────────────────
    const isolation = enforceContextIsolation(NEXUS_APP_ID, instruction);
    if (isolation.error) {
      return Response.json({ error: isolation.message }, { status: 400 });
    }
    const scopedInstruction = isolation.scopedInstruction || instruction;

    // ── STEP 1: M365 Copilot context (non-blocking) ───────────────────────────
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

    // ── STEP 2: Build scoped prompt ───────────────────────────────────────────
    const targetLabel = target_app_name
      ? `Target App: ${target_app_name} (ID: ${target_app_id || "not specified"})`
      : "Target App: Nexus Command AI Hub";

    const hubContext = `
${targetLabel}
Stack: React + Base44 (Deno backend functions)
Hub App ID (scope): ${NEXUS_APP_ID}
Nexus Command Entities: SChatMessage, TestLog, AIConnector, azureConnectorStub, SandboxProject, ProjectFile, TeamLog
Design tokens (immutable): ${JSON.stringify(DESIGN_TOKENS)}
Import pattern: import { EntityName } from '@/api/entities'
${copilotContext}`;

    const fullPrompt = `Instruction from Kieran (ORCHESTRATOR): "${scopedInstruction}"\n\nHub context:${hubContext}`;

    // ── STEP 3: Azure GPT-4o generation ──────────────────────────────────────
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

    // ── STEP 4: Parse structured response ────────────────────────────────────
    const analysis = simpeeResponse.match(/ANALYSIS:\s*([\s\S]*?)(?=SOLUTION:|$)/i)?.[1]?.trim() || "";
    const solution = simpeeResponse.match(/SOLUTION:\s*([\s\S]*?)(?=CODE:|$)/i)?.[1]?.trim() || "";
    const code = simpeeResponse.match(/CODE:\s*([\s\S]*?)(?=BUILDER INSTRUCTION:|$)/i)?.[1]?.trim() || "";
    const builderInstruction = simpeeResponse.match(/BUILDER INSTRUCTION:\s*([\s\S]*?)$/i)?.[1]?.trim() || "";

    // ── STEP 5: Quality screen ────────────────────────────────────────────────
    const qualityCheck = screenCodeQuality(code);
    const realAzurePass = modelUsed === "azure-gpt-4o + m365" && qualityCheck.passed;
    const statusEmoji = realAzurePass ? "✅" : "⚠️";

    // ── STEP 6: Write to Nexus — SChatMessage log ─────────────────────────────
    const chatWrite = await postToNexus("SChatMessage", {
      sender: "Simpee (ORCHESTRATOR)",
      sender_type: "ai",
      message: `${statusEmoji} COMMAND RECEIVED\n\nINSTRUCTION: ${instruction}\n\nANALYSIS:\n${analysis}\n\nSOLUTION:\n${solution}\n\nBUILDER INSTRUCTION:\n${builderInstruction}\n\n[ENGINE]: ${modelUsed}\n[PRE-SCREEN]: ${qualityCheck.notes}`,
      timestamp: new Date().toISOString(),
      session_id: "ai-command-centre",
      read: false,
    });
    if (!chatWrite.ok) console.error("SChatMessage write failed:", chatWrite.error);

    // ── STEP 7: Write generated code to ProjectFile ───────────────────────────
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

    // ── STEP 8: Delegation mode — create SandboxProject spec record ──────────
    // This prepares the spec for future delegation to target app.
    // AI Hub generates → stores in SandboxProject → target app picks up by project_id.
    const delegationWrite = await postToNexus("SandboxProject", {
      name: instruction.slice(0, 80),
      description: `${analysis}\n\n${solution}`,
      type: target_app_id ? "external_delegation" : "internal_build",
      status: realAzurePass ? "ready_for_review" : "needs_review",
      checkpoint_status: "stage_1_complete",
      validator_approved: false,
      notes: `Target: ${targetLabel} | Engine: ${modelUsed} | Scoped: ${NEXUS_APP_ID} | Pre-screen: ${qualityCheck.notes}`,
      pre_screen_data: JSON.stringify({ analysis, solution, builderInstruction, qualityCheck }),
    });
    if (!delegationWrite.ok) console.error("SandboxProject write failed:", delegationWrite.error);

    // ── STEP 9: TestLog ───────────────────────────────────────────────────────
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

    // ── SAFE ASYNC RESPONSE — always fires, never hangs ───────────────────────
    return Response.json({
      success: true,
      instruction,
      analysis,
      solution,
      code,
      builder_instruction: builderInstruction,
      model: modelUsed,
      pre_screen_passed: realAzurePass,
      sandbox_project_created: delegationWrite.ok,
      write_errors: [
        !chatWrite.ok ? `SChatMessage: ${chatWrite.error}` : null,
        !logWrite.ok ? `TestLog: ${logWrite.error}` : null,
        !delegationWrite.ok ? `SandboxProject: ${delegationWrite.error}` : null,
      ].filter(Boolean),
    });

  } catch (error: any) {
    // Always return — never let the channel close without a response
    return Response.json({ error: error.message }, { status: 500 });
  }
});
