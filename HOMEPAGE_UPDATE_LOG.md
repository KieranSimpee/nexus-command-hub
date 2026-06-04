# ASIMPLEXIS Homepage — Update Log
**Date:** 4 June 2026  
**Namespace:** [ASIMPLEXIS]  
**Author:** Simpee Superagent  

---

## v2 — Brand Kit Homepage (4 June 2026)

### Files Changed
- `pages/asimplexis_homepage_v2.html` — Full standalone HTML preview
- `pages/HomePage.jsx` — React component with brand tokens + animations

### Brand Kit Applied
| Token | Value | Status |
|-------|-------|--------|
| Primary Blue | #1D8EE9 | ✅ Applied |
| Silver | #C0C0C0 | ✅ Applied |
| Dark BG | #222222 | ✅ Applied |
| Navy | #0f2d6e | ✅ Applied |
| Font | Raleway Bold/Regular | ✅ Loaded via Google Fonts |
| Logo wordmark | ASIMPLEXIS | ✅ Present in nav + hero |
| Icon mark | AIIS ✦ | ✅ Present in hero + about |
| Slogan | Redefine AI Ability in Realities™ | ✅ Exact match |

### Animations
| Animation | Keyframe | Target | Status |
|-----------|----------|--------|--------|
| shimmer | `@keyframes shimmer` | hero-logo-text | ✅ Present |
| twinkle | `@keyframes twinkle` | .hero-star + .nav-star | ✅ Present |
| ring-pulse | `@keyframes ring-pulse` | .hero-ring, .hero-ring2 | ✅ Present |
| blink | `@keyframes blink` | .badge-dot | ✅ Present |

### Sections
1. ✅ Nav — fixed, dark glass, ASIMPLEXIS ✦ wordmark
2. ✅ Hero — gradient bg, grid overlay, pulsing rings, logo shimmer, AIIS mark, KPI strip
3. ✅ About — 2-col split, glowing AIIS visual, 3 bullet points
4. ✅ Features — 6 cards, hover glow top-border
5. ✅ Demo — code terminal (real security review session)
6. ✅ Proof — 3 quote cards
7. ✅ Metrics — 4 stat cards on navy gradient
8. ✅ CTA — radial glow, dual buttons
9. ✅ Footer — brand wordmark + tagline

### Simpee Master Workflow
- Stage 1 Self-Verify: PASS
- Stage 2 Copilot: PASS
- Stage 3 Google AI: HIGH
- Stage 6 Brand Validation: 16/16 checks PASS
- Stage 9 Gatekeeper: APPROVED ✅

### Preview URL
https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/92ad4a6be_asimplexis_landing_v2.html

---

## Known Issue for CodeRabbit Investigation

### Problem
The brand logo (ASIMPLEXIS wordmark) and animations (shimmer + twinkle) are 
confirmed present in the HTML source but may not render correctly when the 
page is embedded inside the Base44 app builder iframe or when the JSX 
component is loaded without the Raleway Google Font.

### Suspected Root Causes
1. **Google Fonts blocked** — The Base44 app builder may block external 
   Google Fonts requests (`fonts.googleapis.com`). If Raleway fails to load, 
   the browser falls back to a system font that does not support the gradient 
   text effect (`-webkit-background-clip: text`).

2. **CSS animation isolation** — If the page is rendered inside a Shadow DOM 
   or scoped CSS context (as some React frameworks do), `@keyframes` defined 
   in a `<style>` tag inside the JSX may not propagate correctly.

3. **Gradient text Safari compatibility** — `-webkit-background-clip: text` 
   combined with `-webkit-text-fill-color: transparent` requires both 
   properties together. If one is stripped by a CSS sanitiser, the gradient 
   disappears and the text becomes invisible (transparent on transparent).

4. **SVG vs text logo** — The current implementation uses CSS-styled text as 
   the logo, not an SVG file. If the brand kit requires an actual AIIS emblem 
   SVG (the metallic letter forms visible in the brand kit image), the text 
   CSS approach will never match exactly.

### CodeRabbit Review Requests
1. Check if `@keyframes shimmer` and `@keyframes twinkle` are being scoped/
   removed by the React CSS-in-JS context in Base44
2. Verify `-webkit-background-clip: text` is not stripped by any CSS purge 
   or sanitisation step
3. Confirm Google Fonts `Raleway` loads successfully in the deployment context
4. Advise on whether an inline SVG or base64-embedded font would be more 
   reliable than external font loading
5. Check if the `animation` property on elements with `-webkit-text-fill-color: 
   transparent` causes rendering issues in Chromium-based browsers

---

## Previous Version
### v1 — Initial Homepage (4 June 2026)
- File: `pages/asimplexis_landing_v1.html` (archived)
- Issue: Used lavender/violet palette from SIMPLEX-ITY brand — incorrect namespace
- Resolution: Rebuilt with ASIMPLEXIS brand kit (#1D8EE9 blue/silver/dark)
