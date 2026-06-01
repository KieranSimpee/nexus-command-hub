import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = base44.asServiceRole;

    // Fetch all expenses and update by title match
    const all = await db.entities.Expense.list();
    
    const receiptMap: Record<string, string> = {
      'Company Registration Service (Reap Business)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/1f23c1094_7850-5SENSESBEAUTYLIMITED.pdf',
      'Company Secretary Service (Reap Business)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/1f23c1094_7850-5SENSESBEAUTYLIMITED.pdf',
      'Kwun Tong Virtual Office Plan A (Reap Business)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/1f23c1094_7850-5SENSESBEAUTYLIMITED.pdf',
      'Virtual Office Branch 001 Renewal (Reap Business)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/b68eacde1_1200receipt-5SENSESBEAUTYLIMITED.pdf',
      'Business Registration Fee (HKSAR)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/ad7d873f2_BRC_148077315.pdf',
      'Trade Mark Application Fee — SIMPLEX-ITY (IPD)': 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/5b9554cec_FormReceipt-11858136.pdf',
    };

    const toUpdate = all.filter((e: any) => receiptMap[e.title]);
    
    const results = await Promise.all(
      toUpdate.map((e: any) =>
        db.entities.Expense.update(e.id, { receipt_url: receiptMap[e.title] })
      )
    );

    return Response.json({
      ok: true,
      found: toUpdate.length,
      updated: results.length,
      titles: toUpdate.map((e: any) => e.title),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
