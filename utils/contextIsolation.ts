// ─── Shared Context Isolation Utility — Nexus Command Hub ───────────────────
// v1.1 — Extracted from aiCommandCentre.ts + consultCopilot.ts
// Blocks any instruction/question referencing a Base44 app ID outside current scope.

export interface IsolationResult {
  error: boolean;
  message?: string;
  scopedText?: string;
}

/**
 * Enforces context isolation for all AI instructions/questions.
 * Blocks cross-app references by detecting foreign 24-char hex Base44 app IDs.
 * @param appId    The authorised app ID for this hub scope
 * @param text     The instruction or question to validate
 */
export function enforceContextIsolation(
  appId: string,
  text: string
): IsolationResult {
  const appIdPattern = /\b[0-9a-f]{24}\b/g;
  const referencedIds = text.match(appIdPattern) || [];

  for (const id of referencedIds) {
    if (id !== appId) {
      return {
        error: true,
        message: `Cross-app reference blocked. Text references app ${id} which is outside the current scope (${appId}). Use the target_app_id payload field instead.`,
      };
    }
  }

  return { error: false, scopedText: `[APP:${appId}] ${text}` };
}
