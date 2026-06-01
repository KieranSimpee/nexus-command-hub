import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REAL_PORTAL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJraWVyYW5ANXNlbnNlcy5nbG9iYWwiLCJleHAiOjE3ODc0MDg1NTMsImlhdCI6MTc3OTYzMjU1M30.feQst8q8CvGtFAlpy-Yl6Gp7qKVw84FPsbrK2oUAhFg";
const REAL_PORTAL_URL = "https://app.base44.com/api/apps/69edd16e877d6e4391ad74bd";

async function postToRealPortal(notice: object) {
  return fetch(`${REAL_PORTAL_URL}/entities/Notice`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REAL_PORTAL_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(notice)
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { phase, instruction, posted_by, selected_option } = body;

    // ── PHASE 1 — Analyse intent, return clickable options ──
    if (phase === 1 || (!phase && instruction)) {
      const text = instruction || "";

      // Classify intent and generate options
      let options: string[] = [];

      const lower = text.toLowerCase();

      if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
        options = [
          `Add feature: ${text.slice(0, 50)}`,
          `Create new page for this`,
          `Add as a new section to existing page`,
          `Just log this as a note`
        ];
      } else if (lower.includes("fix") || lower.includes("broken") || lower.includes("not working") || lower.includes("error")) {
        options = [
          `Debug and fix: ${text.slice(0, 40)}`,
          `Show me what the current code looks like`,
          `Rewrite the affected section`,
          `Log as known issue`
        ];
      } else if (lower.includes("change") || lower.includes("update") || lower.includes("edit") || lower.includes("revise")) {
        options = [
          `Update UI: ${text.slice(0, 40)}`,
          `Update data/logic only`,
          `Full redesign of this section`,
          `Show me a draft first`
        ];
      } else if (lower.includes("remove") || lower.includes("delete") || lower.includes("hide")) {
        options = [
          `Remove: ${text.slice(0, 50)}`,
          `Hide it instead of removing`,
          `Archive it for later`
        ];
      } else {
        options = [
          `Build this: ${text.slice(0, 50)}`,
          `Explain what this would look like first`,
          `Add to backlog for later`,
          `Send to Simpee for discussion`
        ];
      }

      // Mirror the instruction to the real portal INBOX
      await postToRealPortal({
        title: text.slice(0, 60),
        content: text,
        posted_by: posted_by || "Kieran",
        section: "backend",
        type: "info",
        pinned: false
      });

      // Also trigger sandbox entity automation
      await base44.asServiceRole.entities.Notice.create({
        title: `[PHASE1] ${text.slice(0, 55)}`,
        content: text,
        posted_by: posted_by || "Kieran",
        section: "backend",
        type: "info",
        pinned: false
      });

      return Response.json({
        success: true,
        phase: 1,
        options,
        message: "What do you want to do?"
      });
    }

    // ── PHASE 2 — User selected an option, generate the code ──
    if (phase === 2 || selected_option) {
      const chosenOption = selected_option || instruction;

      // Post a "working on it" notice to the real portal immediately
      await postToRealPortal({
        title: `Working on: ${chosenOption.slice(0, 50)}`,
        content: `Simpee received your instruction:\n\n"${chosenOption}"\n\nGenerating code now...`,
        posted_by: "Simpee",
        section: "code_ready",
        type: "info",
        pinned: false
      });

      // Trigger the sandbox automation with full context to generate code
      await base44.asServiceRole.entities.Notice.create({
        title: `[EXECUTE] ${chosenOption.slice(0, 50)}`,
        content: `EXECUTE THIS INSTRUCTION — write the complete JSX code:\n\n${chosenOption}\n\nPost result back as CODE READY notice to real portal (app_id: 69edd16e877d6e4391ad74bd).`,
        posted_by: posted_by || "Kieran",
        section: "backend",
        type: "info",
        pinned: false
      });

      return Response.json({
        success: true,
        phase: 2,
        message: "Simpee is writing the code — check your INBOX in 30 seconds ✓"
      });
    }

    return Response.json({ error: "Invalid phase or missing instruction" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
