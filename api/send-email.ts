// Vercel Serverless Function — authenticated Brevo email proxy.
// The Brevo key stays on the server. Callers cannot choose a sender, and order
// emails are addressed using a server-verified order access token.

import { createClient } from "@supabase/supabase-js";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "martinezkaponda@gmail.com";
const BREVO_LIST_ID = Number(process.env.BREVO_LIST_ID || 2);

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://lakefresh.vercel.app",
  "https://www.lakefresh.vercel.app",
  "https://lakefreshmw.com",
  "https://www.lakefreshmw.com",
  "https://www.wearsb.com",
  "https://wearsb.com",
];

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
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  end: () => VercelResponse;
}

type EmailBrand = "sb" | "lake-fresh";

const SENDERS: Record<EmailBrand, { name: string; email: string }> = {
  sb: { name: "Streetwear Blantyre", email: "orders@wearsb.com" },
  "lake-fresh": { name: "Lake Fresh Fish Mart", email: "orders@lakefreshmw.com" },
};

const BRAND_IDS: Record<EmailBrand, string> = {
  sb: "11111111-1111-1111-1111-111111111111",
  "lake-fresh": "22222222-2222-2222-2222-222222222222",
};

const ACTION_PERMISSIONS: Record<string, string> = {
  transactional: "email.transactional",
  admin_notification: "email.admin_notification",
  broadcast: "email.broadcast",
};

const brandFromId = (brandId: unknown): EmailBrand | null => {
  if (brandId === BRAND_IDS["lake-fresh"]) return "lake-fresh";
  if (brandId === BRAND_IDS.sb) return "sb";
  return null;
};

const header = (req: VercelRequest, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const allowedOrigin = (origin: string) => {
  const configured = (process.env.ALLOWED_APP_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowed = [...DEFAULT_ORIGINS, ...configured];
  if (allowed.includes(origin)) return true;
  // Vercel preview deployments use a per-branch hostname.
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

const validEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const bearerToken = (req: VercelRequest) => {
  const value = header(req, "authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = header(req, "origin");
  if (!origin || !allowedOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!BREVO_API_KEY) return res.status(500).json({ error: "Email service not configured" });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const { action, payload } = req.body || {};
  if (typeof action !== "string" || !payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Missing action or payload" });
  }
  if (action !== "send-email" && action !== "subscribe") {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  try {
    if (action === "subscribe") {
      return res.status(200).json({
        success: await subscribeToList(payload as SubscribePayload),
      });
    }

    const email = payload as EmailPayload;
    const jwt = bearerToken(req);

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (jwt) {
      const { data, error } = await anonClient.auth.getUser(jwt);
      if (error || !data.user) return res.status(401).json({ error: "Invalid session" });
      userId = data.user.id;
      userEmail = data.user.email || null;
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    let recipient = typeof email.to === "string" ? email.to.trim() : "";
    let recipientName = typeof email.toName === "string" ? email.toName.trim() : recipient;
    let brand: EmailBrand = email.brand === "lake-fresh" ? "lake-fresh" : "sb";

    // Guest order email: the recipient is derived from the order, never from
    // the browser payload. The token is single-purpose and order-specific.
    if (email.orderId && email.orderAccessToken) {
      const { data: access, error: accessError } = await serviceClient.rpc(
        "lf_verify_order_access",
        {
          p_order_id: email.orderId,
          p_access_token: email.orderAccessToken,
        },
      );
      if (accessError || !(access as any)?.ok) {
        return res.status(403).json({ error: "Order access could not be verified" });
      }
      recipient = String((access as any).to_email || "");
      recipientName = String((access as any).to_name || recipient);
      if ((access as any).brand === "lake-fresh") brand = "lake-fresh";
    } else if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    } else if (email.adminAction) {
      const action = email.adminAction;
      const permission = ACTION_PERMISSIONS[action];
      if (!permission) return res.status(403).json({ error: "Admin action not allowed" });

      let targetBrand: EmailBrand = brand;

      // Admin emails for an order use the order's real brand and recipient.
      // The caller cannot choose either one.
      if (action === "transactional") {
        if (!email.orderId) {
          return res.status(400).json({ error: "Order is required for this email" });
        }
        const { data: order, error: orderError } = await serviceClient
          .from("orders")
          .select("brand_id, customer_email, customer_name")
          .eq("id", email.orderId)
          .maybeSingle();
        if (orderError || !order) {
          return res.status(403).json({ error: "Order could not be verified" });
        }
        const orderBrand = brandFromId((order as any).brand_id);
        if (!orderBrand) return res.status(403).json({ error: "Order brand not allowed" });
        targetBrand = orderBrand;
        recipient = String((order as any).customer_email || "").trim();
        recipientName = String((order as any).customer_name || "").trim() || recipient;
      }

      const allowed = await callerHasPermission(
        serviceClient,
        userId,
        BRAND_IDS[targetBrand],
        permission,
      );
      if (!allowed) return res.status(403).json({ error: "Admin access required" });

      brand = targetBrand;
      if (action === "admin_notification") recipient = ADMIN_EMAIL;
    } else if (
      !validEmail(recipient) ||
      !userEmail ||
      recipient.toLowerCase() !== userEmail.toLowerCase()
    ) {
      return res.status(403).json({ error: "Recipient must be your own email address" });
    }

    if (!validEmail(recipient)) {
      return res.status(400).json({ error: "A valid recipient is required" });
    }
    if (typeof email.subject !== "string" || email.subject.length > 200 || !email.subject.trim()) {
      return res.status(400).json({ error: "Invalid subject" });
    }
    if (typeof email.htmlContent !== "string" || email.htmlContent.length > 200_000) {
      return res.status(400).json({ error: "Invalid email content" });
    }

    const sender = SENDERS[brand];
    return res.status(200).json({
      success: await sendEmail({
        to: recipient,
        toName: recipientName,
        subject: email.subject.trim(),
        htmlContent: email.htmlContent,
        textContent: typeof email.textContent === "string" ? email.textContent : "",
        params: email.params,
        sender,
      }),
    });
  } catch (error) {
    console.error(`[Brevo Proxy] Error on ${action}:`, error);
    return res.status(500).json({ error: "Email send failed" });
  }
}

// Structural type keeps this compatible with the different Supabase client
// typings used by local and Vercel build environments.
interface EmailServiceClient {
  from: (table: string) => any;
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
}

async function callerHasPermission(
  client: EmailServiceClient,
  userId: string,
  brandId: string,
  permission: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("user_has_brand_permission", {
    p_user_id: userId,
    p_brand_id: brandId,
    p_permission: permission,
  });
  if (error) return false;
  return data === true;
}

interface EmailPayload {
  to?: string;
  toName?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  params?: Record<string, string>;
  brand?: string;
  orderId?: string;
  orderAccessToken?: string;
  adminAction?: string;
}

interface SubscribePayload {
  email?: string;
  name?: string;
}

async function sendEmail(payload: {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  params?: Record<string, string>;
  sender: { name: string; email: string };
}): Promise<boolean> {
  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: payload.sender,
      to: [{ email: payload.to, name: payload.toName || payload.to }],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent,
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

async function subscribeToList(payload: SubscribePayload): Promise<boolean> {
  if (!validEmail(payload.email)) return false;
  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email.trim(),
      listIds: [Number.isFinite(BREVO_LIST_ID) ? BREVO_LIST_ID : 2],
      attributes: {
        FIRSTNAME:
          typeof payload.name === "string" && payload.name.trim()
            ? payload.name.trim()
            : payload.email!.split("@")[0],
      },
    }),
  });
  return response.ok;
}
