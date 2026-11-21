// Vercel Cron — send consented Lake Fresh lifecycle messages from a queue.
// Only server environment variables are used. No customer data is cached.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader?: (name: string, value: string) => VercelResponse;
}

const header = (req: VercelRequest, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const safeName = (value: unknown) =>
  String(value || "there")
    .replace(/[<>&"']/g, "")
    .trim()
    .slice(0, 60) || "there";

const contentFor = (kind: string, name: string, link: string) => {
  if (kind === "review_request") {
    return {
      subject: "How was your Lake Fresh order?",
      htmlContent: `<p>Hi ${name},</p><p>Thanks for ordering from Lake Fresh. We would love to hear how your fish and delivery went.</p><p><a href="${link}">Tell us about your order</a></p><p>Lake Fresh Team</p>`,
      textContent: `Hi ${name}. Thanks for ordering from Lake Fresh. Tell us about your order: ${link}`,
    };
  }

  return {
    subject: "Ready for more fresh fish?",
    htmlContent: `<p>Hi ${name},</p><p>Your next Lake Fresh order is easy. Choose Chambo, Micheni or Usipa and we will send it to your door tomorrow.</p><p><a href="${link}">See the catch</a></p><p>Lake Fresh Team</p>`,
    textContent: `Hi ${name}. Choose Chambo, Micheni or Usipa and we will send it to your door tomorrow: ${link}`,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader?.("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!CRON_SECRET || header(req, "authorization") !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase server configuration is missing" });
  }

  if (!BREVO_API_KEY) {
    return res.status(503).json({ error: "Email service not configured" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("lf_claim_lifecycle_messages", { p_limit: 20 });
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const messages = (data || []) as Array<{
    id: string;
    kind: string;
    to_email: string;
    to_name: string;
    link: string;
  }>;

  let sent = 0;
  let failed = 0;

  for (const message of messages) {
    const content = contentFor(message.kind, safeName(message.to_name), message.link);
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Lake Fresh Fish Mart", email: "orders@lakefreshmw.com" },
        to: [{ email: message.to_email, name: safeName(message.to_name) }],
        subject: content.subject,
        htmlContent: content.htmlContent,
        textContent: content.textContent,
      }),
    });

    const ok = emailResponse.ok;
    const errorText = ok ? null : await emailResponse.text().catch(() => "Email send failed");
    await supabase.rpc("lf_finish_lifecycle_message", {
      p_id: message.id,
      p_sent: ok,
      p_error: errorText ? errorText.slice(0, 500) : null,
    });
    if (ok) sent += 1;
    else failed += 1;
  }

  return res.status(200).json({ ok: true, processed: messages.length, sent, failed });
}
