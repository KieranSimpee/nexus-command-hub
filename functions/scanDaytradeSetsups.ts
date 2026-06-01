import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const CORE_TICKERS = ["SNDK", "STX", "LITE", "NVDA", "PLTR", "MU", "AAPL", "MSFT"];

export default async function scanDaytradeSetsups(req: Request): Promise<Response> {
  try {
    const prompt = `You are a professional day trader analyzing US stock options for same-day scalp trades.

CORE TICKERS: ${CORE_TICKERS.join(", ")}

Your task: Identify the top 3 same-day options setups for TOMORROW based on current market conditions.

For EACH setup provide:
TICKER: [SYMBOL]
DIRECTION: [CALL or PUT]
REASON: [Why good same-day scalp]
STRIKE: [ATM strike]
EXPIRY: [Same week date]
ENTRY: [Limit bid price]
MAX ENTRY: [Hard ceiling]
TARGET: [Profit taking]
GAIN: [% expected]
WINDOW: [9-10am EST OR 2-3pm EST - AVOID 11am-1pm EST]
HOLD: [Expected minutes]
STOP: [Hard stop price]
IV: [Normal/Spiked]

Rules:
- Down 3%+ after hours → Buy CALL (mean reversion)
- Up 3%+ after hours → Buy PUT (fade overextension)
- 1-week expiry only
- Quick scalps under 30 mins
- 79.5% win rate pattern
- Avoid 11am-1pm EST (worst hours)
- Only tight-spread options

Format: 3 separate SETUP #1, SETUP #2, SETUP #3`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "No setups found.";

    const whatsappMessage = `🔔 ALERT 1 — SAME-DAY SCALP SETUPS

${responseText}

⏰ BEST ENTRY:
🟢 9-10am EST (4-5pm HKT today)
🟢 2-3pm EST (3-4am HKT tomorrow)
🔴 AVOID 11am-1pm EST

💡 1-week expiry. Quick scalps <30min. Hard stops essential.`;

    return new Response(whatsappMessage, { status: 200 });

  } catch (error: any) {
    console.error("Scan error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
