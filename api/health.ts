// Small deployment health endpoint. It reports configuration presence only.
// No secret values, order data or customer data are ever returned.

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader?: (name: string, value: string) => VercelResponse;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader?.("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const config = {
    supabaseUrl: Boolean(process.env.SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
    supabaseServiceKey: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
    ),
    brevoKey: Boolean(process.env.BREVO_API_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
    paychanguWebhookSecret: Boolean(
      process.env.PAYCHANGU_WEBHOOK_SECRET || process.env.PAYCHANGU_WEB_SECRET,
    ),
    paychanguSecretKey: Boolean(process.env.PAYCHANGU_SECRET_KEY),
  };

  const coreReady = config.supabaseUrl && config.supabaseAnonKey && config.supabaseServiceKey;

  return res.status(coreReady ? 200 : 503).json({
    ok: coreReady,
    service: "lake-fresh-platform",
    config,
  });
}
