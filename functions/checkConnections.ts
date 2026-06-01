Deno.serve(async (_req: Request) => {
  const results: Record<string, any> = {};

  // 1. Check Airwallex
  try {
    const clientId = Deno.env.get("AIRWALLEX_ADMIN_CLIENT_ID");
    const apiKey = Deno.env.get("AIRWALLEX_ADMIN_API_KEY");
    const authRes = await fetch("https://api.airwallex.com/api/v1/authentication/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId!,
        "x-api-key": apiKey!,
      },
    });
    const authData = await authRes.json();
    if (authData.token) {
      // Fetch account balance too
      const balRes = await fetch("https://api.airwallex.com/api/v1/balances", {
        headers: { "Authorization": `Bearer ${authData.token}` },
      });
      const balData = await balRes.json();
      results.airwallex = {
        connected: true,
        label: "Airwallex",
        status: "✅ Connected",
        detail: `Account live · ${Array.isArray(balData) ? balData.length : 0} wallet(s) found`,
        account: "5SENSESBEAUTY LIMITED",
        last_checked: new Date().toISOString(),
      };
    } else {
      results.airwallex = { connected: false, label: "Airwallex", status: "❌ Auth Failed", detail: authData.message || "Invalid credentials", last_checked: new Date().toISOString() };
    }
  } catch (e: any) {
    results.airwallex = { connected: false, label: "Airwallex", status: "❌ Error", detail: e.message, last_checked: new Date().toISOString() };
  }

  // 2. Check OneDrive (via stored token check)
  try {
    const odToken = Deno.env.get("ONE_DRIVE_ACCESS_TOKEN");
    if (odToken) {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
        headers: { "Authorization": `Bearer ${odToken}` },
      });
      const meData = await meRes.json();
      results.onedrive = {
        connected: meRes.ok,
        label: "OneDrive",
        status: meRes.ok ? "✅ Connected" : "⚠️ Token Expired",
        detail: meRes.ok ? `Drive: ${meData.name || meData.webUrl || "Connected"}` : "Re-authorize in settings",
        last_checked: new Date().toISOString(),
      };
    } else {
      results.onedrive = { connected: false, label: "OneDrive", status: "⚠️ Not configured", detail: "No access token found", last_checked: new Date().toISOString() };
    }
  } catch (e: any) {
    results.onedrive = { connected: false, label: "OneDrive", status: "❌ Error", detail: e.message, last_checked: new Date().toISOString() };
  }

  // 3. Check Simpee (Base44 agent — always live if this function runs)
  results.simpee = {
    connected: true,
    label: "Simpee AI Agent",
    status: "✅ Online",
    detail: "Base44 Superagent · 5S Portal connected",
    account: "kieran@5senses.global",
    last_checked: new Date().toISOString(),
  };

  // 4. Check Outlook / Email
  try {
    const outlookToken = Deno.env.get("OUTLOOK_ACCESS_TOKEN");
    if (outlookToken) {
      const mailRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { "Authorization": `Bearer ${outlookToken}` },
      });
      const mailData = await mailRes.json();
      results.outlook = {
        connected: mailRes.ok,
        label: "Outlook Email",
        status: mailRes.ok ? "✅ Connected" : "⚠️ Token Expired",
        detail: mailRes.ok ? `Signed in as ${mailData.mail || mailData.userPrincipalName}` : "Re-authorize needed",
        last_checked: new Date().toISOString(),
      };
    } else {
      results.outlook = { connected: false, label: "Outlook Email", status: "⚠️ Not configured", detail: "No token found", last_checked: new Date().toISOString() };
    }
  } catch (e: any) {
    results.outlook = { connected: false, label: "Outlook Email", status: "❌ Error", detail: e.message, last_checked: new Date().toISOString() };
  }

  return Response.json({
    checked_at: new Date().toISOString(),
    connections: results,
  });
});
