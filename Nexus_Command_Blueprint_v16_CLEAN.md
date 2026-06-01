# NEXUS COMMAND AI HUB — Blueprint v1.6 CLEAN
## "AI Hub First" Architecture — June 1, 2026

---

## STANDING RULE (LOCKED — EFFECTIVE IMMEDIATELY)

> **The Nexus Command AI Hub is the ONLY source of truth for all AI-assisted builds.**
> All writes, logs, telemetry, and generated code go to Nexus Command ONLY.
> The 5S Portal and all other apps are TARGETS — they receive output, not input.
> If Kieran needs work done on any app (5S Portal, new app, external), he initiates it
> through the AI Hub frontend. Simpee does NOT hardcode other app URLs into Hub functions.

---

## ARCHITECTURE CHANGE SUMMARY (v1.5 → v1.6)

| Item | Before (v1.5) | After (v1.6 CLEAN) |
|---|---|---|
| aiCommandCentre writes to | 5S Portal Notice + Nexus TestLog | Nexus SChatMessage + ProjectFile + TestLog ONLY |
| consultCopilot writes to | 5S Portal Notice | Nexus SChatMessage + TestLog ONLY |
| Target app references | Hardcoded 5S Portal URL | Passed via payload (target_app_id, target_app_name) |
| AI engine | OpenAI API | Azure OpenAI (kiera-mpv1nhzc-eastus2) |
| Hub identity | Mixed (portal + hub) | Nexus Command ONLY |

---

## AZURE OPENAI — LIVE CREDENTIALS (SECURED)

| Field | Value |
|---|---|
| Endpoint | https://kiera-mpv1nhzc-eastus2.cognitiveservices.azure.com/ |
| Deployment | gpt-4o |
| API Version | 2025-01-01-preview |
| Secret | AZURE_OPENAI_API_KEY_3 (stored in .agents/.env) |
| Status | ✅ LIVE — tested and confirmed |

---

## BACKEND FUNCTIONS — CURRENT STATE

### 1. aiCommandCentre
- **Role:** ORCHESTRATOR — receives Kieran's build instructions, calls Azure GPT-4o, returns structured output
- **Writes to:** Nexus Command (SChatMessage, ProjectFile, TestLog)
- **Payload in:** `{ instruction, target_app_id?, target_app_name? }`
- **Payload out:** `{ analysis, solution, code, builder_instruction, model, pre_screen_passed }`
- **Status:** ✅ DEPLOYED v1.6

### 2. consultCopilot
- **Role:** VALIDATOR — final quality gate, reviews code/plans before deploy
- **Writes to:** Nexus Command (SChatMessage, TestLog)
- **Payload in:** `{ question, context? }`
- **Payload out:** `{ answer, model, m365_grounded }` with VERDICT: APPROVED/REJECTED/NEEDS REVISION
- **Status:** ✅ DEPLOYED v1.6

---

## HOW TO BUILD FOR OTHER APPS (NEW WORKFLOW)

When Kieran wants to build/modify the 5S Portal or any other app:

1. Open Nexus Command AI Hub frontend
2. In the Command panel, type the instruction
3. Set target_app_name = "5S Portal" and target_app_id = "69edd16e877d6e4391ad74bd"
4. Submit → AI Hub generates the code
5. Code is stored in Nexus Command (ProjectFile entity)
6. Run consultCopilot to validate
7. Paste approved code into the target app's builder
8. Done ✅

**Simpee never writes directly to other apps from Hub functions anymore.**

---

## BUILDER BRIEF — WHAT THE BASE44 BUILDER MUST IMPLEMENT

### PRIORITY 1 — Update AI Hub Command Panel (aiCommandCentre wiring)

The Command Panel input form must pass two new optional fields to the backend:
```
target_app_name: string (dropdown or text input)
target_app_id: string (auto-filled based on selection)
```

Pre-populate dropdown with:
- "Nexus Command AI Hub" → 6a1c237bd9f5ff04b6ac7a73
- "5S Portal" → 69edd16e877d6e4391ad74bd
- "New App" → (blank, user types)

### PRIORITY 2 — SChatMessage Panel (replace Notice-based INBOX)

The AI Hub response panel must read from SChatMessage entity (not Notice).
Filter by: session_id = "ai-command-centre" for Orchestrator messages.
Filter by: session_id = "copilot-validation" for Validator messages.

Display format:
- Sender badge (ORCHESTRATOR in purple, VALIDATOR in green)
- Timestamp
- Message body (pre-formatted, monospace for code sections)
- "Copy Code" button if message contains a code block

### PRIORITY 3 — ProjectFile Code Viewer

Add a "Generated Code" tab that reads from ProjectFile entity.
Filter by: project_id = "ai-command-centre"
Display: filename, notes (target app), language badge, content in syntax-highlighted block
Actions: Copy to clipboard, Download as file

### PRIORITY 4 — TestLog Status Panel

Show last 10 TestLog entries in a compact status strip at the bottom.
Columns: test_name, status (color-coded), validator, tested_at
Color: passed=green, failed=red, review=amber

---

## AI TEAM — CONFIRMED (v1.5 LOCKED, CARRIED FORWARD)

| Role | Duty Name | Model | Status |
|---|---|---|---|
| ORCHESTRATOR | Simpee | Base44 Agent | ✅ Active |
| RESEARCHER + LOGGER | Gemini 2.0 Flash | Free tier | ✅ Active |
| ANALYST + MONITOR | Claude Sonnet 4.6 | Anthropic | ✅ Active |
| STRATEGIST | Claude Opus 4.6 | Anthropic | ✅ Active |
| THINK TANK | Claude Opus 4.8 | Anthropic | ✅ Active |
| ENGINEER | GPT-5.4 | Azure OpenAI | ✅ Active |
| ARCHITECT | GPT-5.5 | Azure OpenAI | ✅ Active |
| VALIDATOR | Copilot/Edge | Microsoft | ✅ Active |
| QC INSPECTOR | CodeRabbit AI | coderabbit.ai | ⏳ Pending hire |

---

## GATEKEEPER GOLDEN RULES (10) — UNCHANGED

1. No deploy without QC Inspector + Validator + Simpee all approving
2. 3 failures = full 9-step team review before WhatsApp escalation to Kieran
3. Copilot = Validator ONLY (no monitor duty)
4. Claude Sonnet = Analyst + Monitor AI
5. Gemini = Researcher + Logger/Memory (free tier)
6. Ethics AI deferred to v1.7
7. Kieran never troubleshoots — he decides from a briefing
8. No AI approves its own work
9. Blueprint-first always
10. All builds initiated through AI Hub frontend — not hardcoded

---

## NEXT MILESTONE — v1.7

- Canva DESIGNER role integration
- Ethics AI role assigned
- KnowledgeLog entity as single truth layer
- First full 10-stage pipeline run: Define → Research → Analyse → Report → Plan → Build → Test → Debug → Approve → Deploy

