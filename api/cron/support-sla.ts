// Vercel Cron — mark overdue Lake Fresh support requests and alert the team.
// Uses only server-side configuration. No VITE_* values are accepted here.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
}

const header = (req: VercelRequest, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!CRON_SECRET || header(req, "authorization") !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase server configuration is missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("lf_mark_support_sla_breaches");
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const result = data as { ok?: boolean; breached?: number } | null;
  const breached = Number(result?.breached || 0);
  let notified = false;

  if (breached > 0 && BREVO_API_KEY && ADMIN_EMAIL) {
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Lake Fresh Fish Mart", email: "orders@lakefreshmw.com" },
        to: [{ email: ADMIN_EMAIL, name: "Lake Fresh Team" }],
        subject: `${breached} Lake Fresh help request${breached === 1 ? "" : "s"} need attention`,
        htmlContent: `<p>${breached} help request${breached === 1 ? "" : "s"} have passed the reply target.</p><p>Open the Lake Fresh admin Support tab to answer.</p>`,
        textContent: `${breached} help requests have passed the reply target. Open the Lake Fresh admin Support tab.`,
      }),
    });
    notified = emailResponse.ok;
  }

  return res.status(200).json({
    ok: true,
    breached,
    notified,
    skipped_email: breached > 0 && !notified,
  });
}
