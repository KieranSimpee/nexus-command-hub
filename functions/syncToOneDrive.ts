import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FOLDER_MAP: Record<string, string> = {
  "Admin":                 "016ZYE2IFMNF2IE2367VFJLMCJXYTMYZLM",
  "Finance":               "016ZYE2ICYIERK4V2GGJDYZXATODRFA3UK",
  "HR":                    "016ZYE2IDECPOEGFO22BGYTZJ6HSOCG23F",
  "Brand - SIMPLEX-ITY":   "016ZYE2IFJMYB6JZRF6ZH3B4MCSOLTEDPL",
  "Brand - 5SENSESBEAUTY": "016ZYE2IF7S4MPXBFFXFDZLNSVS4B2F6YR",
  "Compliance":            "016ZYE2IGVSFFJMSG775AKIWZV3QO6IOW3",
  "Root":                  "016ZYE2IA4SNG2MGDNOBGIVW2AF6DJUREA",
};

function getFolderId(section: string, relatedTo: string, tags: string[]): string {
  const s = (section || relatedTo || "").toLowerCase();
  const t = (tags || []).join(" ").toLowerCase();
  if (s.includes("finance") || t.includes("finance") || t.includes("invoice")) return FOLDER_MAP["Finance"];
  if (s.includes("hr") || t.includes("hr") || t.includes("contract") || t.includes("mpf")) return FOLDER_MAP["HR"];
  if (s.includes("admin") || t.includes("admin") || t.includes("legal")) return FOLDER_MAP["Admin"];
  if (s.includes("simplex") || t.includes("simplex")) return FOLDER_MAP["Brand - SIMPLEX-ITY"];
  if (s.includes("5senses") || t.includes("5senses") || t.includes("senses")) return FOLDER_MAP["Brand - 5SENSESBEAUTY"];
  if (t.includes("compliance")) return FOLDER_MAP["Compliance"];
  return FOLDER_MAP["Root"];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { file_url, file_name, section, related_to, tags, document_id } = body;

    if (!file_url || !file_name) {
      return Response.json({ error: "file_url and file_name are required" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("one_drive");

    const fileResp = await fetch(file_url);
    if (!fileResp.ok) throw new Error(`Failed to fetch file: ${fileResp.status}`);
    const fileBuffer = await fileResp.arrayBuffer();

    const folderId = getFolderId(section || "", related_to || "", tags || []);

    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodeURIComponent(file_name)}:/content`;
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });

    const uploadText = await uploadRes.text();
    if (!uploadRes.ok) throw new Error(`OneDrive upload failed: ${uploadRes.status} ${uploadText}`);
    const uploadData = uploadText ? JSON.parse(uploadText) : {};
    const oneDriveUrl = uploadData?.webUrl || "";

    if (document_id) {
      await base44.asServiceRole.entities.Document.update(document_id, {
        notes: `OneDrive: ${oneDriveUrl}`,
      });
    }

    return Response.json({ success: true, file_name, onedrive_url: oneDriveUrl });

  } catch (err: any) {
    console.error("syncToOneDrive error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
