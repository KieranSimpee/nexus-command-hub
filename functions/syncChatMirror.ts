import base44 from "../src/api/base44Client";

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { message, sender, timestamp } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: "No message provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Write the chat message to the ChatMessage entity (or NoticeBoard)
    // Try ChatMessage first, fall back to NoticeBoard
    let result;
    
    try {
      result = await base44.entities.ChatMessage.create({
        sender: sender || "Simpee AI",
        message: message,
        timestamp: timestamp || new Date().toISOString(),
        source: "WhatsApp",
        direction: "incoming",
      });
    } catch {
      // Fall back to NoticeBoard
      result = await base44.entities.NoticeBoard.create({
        title: `💬 ${sender || "Simpee AI"} — ${new Date().toLocaleTimeString("en-HK", { timeZone: "Asia/Hong_Kong" })}`,
        body: message,
        category: "Chat",
        priority: "normal",
        pinned: false,
      });
    }

    return new Response(JSON.stringify({ success: true, record: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
