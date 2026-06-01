Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { invoice_id, invoice, type, expense_id, expense } = body;

    const clientId = Deno.env.get("AIRWALLEX_ADMIN_CLIENT_ID");
    const apiKey = Deno.env.get("AIRWALLEX_ADMIN_API_KEY");

    if (!clientId || !apiKey) {
      return Response.json({ error: "Airwallex credentials not configured. Set AIRWALLEX_ADMIN_CLIENT_ID and AIRWALLEX_ADMIN_API_KEY in secrets." }, { status: 500 });
    }

    // Authenticate
    const authRes = await fetch("https://api.airwallex.com/api/v1/authentication/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
    });
    const authData = await authRes.json();
    if (!authData.token) {
      return Response.json({ error: "Airwallex auth failed", details: authData }, { status: 401 });
    }
    const token = authData.token;

    // Handle EXPENSE type — log as a transaction note
    if (type === "expense" && expense) {
      const expensePayload = {
        request_id: `5portal-exp-${expense_id || Date.now()}`,
        currency: expense.currency || "HKD",
        customer: { name: expense.vendor || "Internal", address: { country: "HK" } },
        line_items: [{
          description: expense.title || "Expense",
          quantity: 1,
          unit_amount: Math.round((expense.amount || 0) * 100),
          currency: expense.currency || "HKD",
        }],
        memo: `Expense: ${expense.category || ""} — ${expense.date || ""}`,
      };

      const res = await fetch("https://api.airwallex.com/api/v1/billing/invoices", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload),
      });
      const data = await res.json();
      return Response.json(res.ok && data.id
        ? { success: true, airwallex_id: data.id, type: "expense" }
        : { success: false, error: data.message || "Expense sync failed", hint: "Check Billing scope on API key" }
      );
    }

    // Handle INVOICE type
    if (!invoice) {
      return Response.json({ error: "invoice data is required" }, { status: 400 });
    }

    const lineItems = (invoice.items || []).map((item: string, idx: number) => {
      const parts = item.split("|").map((p: string) => p.trim());
      const name = parts[0] || `Item ${idx + 1}`;
      const qtyMatch = parts[1]?.match(/qty[:\s]*([\d.]+)/i);
      const priceMatch = parts[2]?.match(/([\d,.]+)/);
      const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const price = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0;
      return {
        description: name,
        quantity: qty,
        unit_amount: Math.round(price * 100),
        currency: invoice.currency || "HKD",
      };
    });

    const payload = {
      request_id: `5portal-inv-${invoice.invoice_no || invoice_id}-${Date.now()}`,
      currency: invoice.currency || "HKD",
      customer: {
        name: invoice.client_name || "Client",
        ...(invoice.client_email ? { email: invoice.client_email } : {}),
        address: { line1: invoice.client_address || "", country: "HK" },
      },
      line_items: lineItems.length ? lineItems : [{
        description: "Services",
        quantity: 1,
        unit_amount: Math.round((invoice.total || 0) * 100),
        currency: invoice.currency || "HKD",
      }],
      due_date: invoice.due_date || undefined,
      memo: `Invoice ${invoice.invoice_no || invoice_id} — SIMPLEX-ITY`,
    };

    const createRes = await fetch("https://api.airwallex.com/api/v1/billing/invoices", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const createData = await createRes.json();

    if (createRes.ok && createData.id) {
      return Response.json({
        success: true,
        airwallex_invoice_id: createData.id,
        hosted_url: createData.hosted_url || null,
        message: `Invoice ${invoice.invoice_no} synced to Airwallex`,
      });
    } else {
      return Response.json({
        success: false,
        error: createData.message || "Sync failed",
        code: createData.code || null,
        hint: "Ensure API key has Billing > Invoices scope in Airwallex → Settings → Developer",
        invoice_no: invoice.invoice_no,
      });
    }

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
