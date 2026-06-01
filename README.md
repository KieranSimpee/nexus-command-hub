# Nexus Command AI Hub — SIMPLEX-ITY

Platform-agnostic AI product studio built on Base44.

## AI Team
- **ORCHESTRATOR** — Simpee (Base44)
- **QC INSPECTOR** — CodeRabbit AI ← you are here
- **VALIDATOR** — Copilot/Edge

## Functions
| File | Role |
|------|------|
| `functions/aiCommandCentre.ts` | Main orchestration engine (Azure GPT-4o) |
| `functions/consultCopilot.ts` | VALIDATOR review gate |
| `functions/aiHubPipeline.ts` | 10-stage pipeline handler |

## Stack
React + Base44 SDK + Azure OpenAI (Southeast Asia)

## Design Tokens
- Primary: `#8c82fc` | Accent: `#5e50fb` | BG: `#e8e6fe`
- Fonts: Exo 2 (headings), Montserrat (body)
