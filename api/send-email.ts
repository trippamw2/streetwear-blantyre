// Vercel Serverless Function — Brevo Email Proxy
// Keeps the Brevo API key server-side (never exposed to the client bundle)

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

interface VercelRequest {
  method?: string;
  body: Record<string, unknown>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  end: () => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!BREVO_API_KEY) {
    console.error("[Brevo Proxy] No API key configured on server");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const { action, payload } = req.body;

  if (!action || !payload) {
    return res.status(400).json({ error: "Missing action or payload" });
  }

  try {
    let result: boolean;

    switch (action) {
      case "send-email":
        result = await sendEmail(payload);
        break;
      case "subscribe":
        result = await subscribeToList(payload);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(200).json({ success: result });
  } catch (error) {
    console.error(`[Brevo Proxy] Error on ${action}:`, error);
    return res.status(500).json({ error: "Email send failed" });
  }
}

// --- Brevo API calls (server-side only) ---

async function sendEmail(payload: {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
  params?: Record<string, string>;
}): Promise<boolean> {
  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: payload.senderName || "Streetwear Blantyre",
        email: payload.senderEmail || "orders@wearsb.com",
      },
      to: [
        {
          email: payload.to,
          name: payload.toName || payload.to,
        },
      ],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent || "",
      params: payload.params || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[Brevo] Send error:", error);
    return false;
  }

  return true;
}

async function subscribeToList(payload: {
  email: string;
  name?: string;
  listId?: number;
}): Promise<boolean> {
  const listId = payload.listId || 2;

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      listIds: [listId],
      attributes: {
        FIRSTNAME: payload.name || payload.email.split("@")[0],
      },
    }),
  });

  return response.ok;
}
