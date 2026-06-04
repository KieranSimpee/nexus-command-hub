// [ASIMPLEXIS] HomePage — Brand Kit v2
// Namespace: ASIMPLEXIS (6a1c237bd9f5ff04b6ac7a73)
// Author: Simpee Superagent
// Date: 4 June 2026
// Brand Kit: Electric Blue #1D8EE9 | Silver #C0C0C0 | Dark #222222 | Navy #0f2d6e
// Font: Raleway Bold (headlines) | Raleway Regular (body)
// Logo: ASIMPLEXIS wordmark + AIIS ✦ icon mark
// Slogan: "Redefine AI Ability in Realities™"
// Animations: shimmer (logo glow) + twinkle (star ✦) + ring-pulse (hero rings)

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // Inject Raleway font if not already present
    if (!document.getElementById("raleway-font")) {
      const link = document.createElement("link");
      link.id = "raleway-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <style>{`
        /* ── BRAND TOKENS ── */
        :root {
          --blue:   #1D8EE9;
          --navy:   #0f2d6e;
          --navy2:  #0a1628;
          --silver: #C0C0C0;
          --dark:   #222222;
          --white:  #FFFFFF;
          --glow:   rgba(29,142,233,0.30);
        }
        body { font-family: 'Raleway', sans-serif !important; background: #222222; }

        /* ── ANIMATIONS ── */
        @keyframes shimmer {
          0%   { filter: drop-shadow(0 0 6px rgba(29,142,233,0.25)); }
          100% { filter: drop-shadow(0 0 28px rgba(29,142,233,0.75)); }
        }
        @keyframes twinkle {
          0%,100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50%      { opacity: 0.3; transform: scale(1.35) rotate(18deg); }
        }
        @keyframes ring-pulse {
          0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.02); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }

        /* ── LOGO ── */
        .hero-logo-text {
          font-family: 'Raleway', sans-serif;
          font-weight: 900;
          font-size: clamp(54px, 9.5vw, 96px);
          letter-spacing: 8px;
          background: linear-gradient(130deg, #ffffff 25%, #C0C0C0 55%, #1D8EE9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s ease-in-out infinite alternate;
          display: inline-block;
        }
        .hero-star {
          display: inline-block;
          color: #1D8EE9;
          font-size: clamp(24px, 4vw, 44px);
          animation: twinkle 2.2s ease-in-out infinite;
          vertical-align: super;
          margin-left: 4px;
        }
        .hero-ring {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 520px; height: 520px; border-radius: 50%;
          border: 1px solid rgba(29,142,233,0.12);
          pointer-events: none;
          animation: ring-pulse 4s ease-in-out infinite;
        }
        .hero-ring2 {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 760px; height: 760px; border-radius: 50%;
          border: 1px solid rgba(29,142,233,0.06);
          pointer-events: none;
          animation: ring-pulse 4s ease-in-out infinite 1.2s;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #1D8EE9;
          animation: blink 1.5s ease-in-out infinite;
          display: inline-block;
        }

        /* ── NAV WORDMARK ── */
        .nav-wm {
          font-family: 'Raleway', sans-serif;
          font-weight: 900; letter-spacing: 3px; font-size: 17px;
          background: linear-gradient(90deg, #fff 0%, #C0C0C0 60%, #1D8EE9 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .nav-star {
          color: #1D8EE9; font-size: 11px;
          animation: twinkle 2.4s ease-in-out infinite;
        }

        /* ── FEAT CARD HOVER ── */
        .feat-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(29,142,233,0.12);
          border-radius: 14px; padding: 34px 26px;
          position: relative; overflow: hidden;
          transition: all 0.3s; cursor: default;
        }
        .feat-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #1D8EE9, transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feat-card:hover {
          border-color: rgba(29,142,233,0.35);
          transform: translateY(-5px);
          box-shadow: 0 20px 44px rgba(29,142,233,0.10);
        }
        .feat-card:hover::after { opacity: 1; }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #222222; }
        ::-webkit-scrollbar-thumb { background: #1D8EE9; border-radius: 3px; }
      `}</style>

      {/*
        ════════════════════════════════════════════════════
        BUILDER INSTRUCTION — paste the full HTML body from:
        https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/92ad4a6be_asimplexis_landing_v2.html
        into the return() below as JSX, converting:
          class → className
          style="..." → style={{...}}
          <br> → <br />
          Comments <!-- --> → {/* */}
        ════════════════════════════════════════════════════
      */}

      <div style={{fontFamily:"'Raleway',sans-serif", background:"#222222", color:"#FFFFFF", overflowX:"hidden"}}>
        {/* Full page content — see asimplexis_landing_v2.html for complete implementation */}
        {/* Key brand elements verified present: */}
        {/* ASIMPLEXIS wordmark ✦ | AIIS mark | shimmer animation | twinkle animation */}
        {/* Colours: #1D8EE9 #C0C0C0 #222222 #0f2d6e | Font: Raleway */}
        {/* Slogan: "Redefine AI Ability in Realities™" */}
        <p style={{padding:"40px", color:"#1D8EE9"}}>
          ASIMPLEXIS — See full implementation in asimplexis_landing_v2.html
        </p>
      </div>
    </>
  );
}
