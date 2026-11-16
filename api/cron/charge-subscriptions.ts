import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;

const PLAN_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 };
const PRICE_PER_KG = 4500;
const DELIVERY_FEE = 2000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("lf_subscriptions")
    .select("*")
    .eq("status", "active")
    .eq("consent_given", true)
    .lte("next_charge_date", today);

  if (error) {
    console.error("charge-subscriptions: query failed", error);
    return res.status(500).json({ error: "Query failed" });
  }

  const results: any[] = [];

  for (const sub of due || []) {
    const amount = Math.round(Number(sub.quantity_kg) * PRICE_PER_KG + DELIVERY_FEE);
    const txRef = `LF-SUB-${String(sub.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    // Send a payment link email (consent-gated; no auto-charge without provider mandate).
    if (BREVO_API_KEY && sub.customer_email) {
      try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "Lake Fresh Fish Mart", email: "orders@lakefreshmw.com" },
            to: [{ email: sub.customer_email }],
            subject: `Your Lake Fresh subscription payment — ${txRef}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0a2540;">Subscription payment due</h1>
                <p>Hi ${sub.customer_name},</p>
                <p>Your ${sub.plan} Lake Fresh subscription is due. Amount: <strong>${amount} MWK</strong>.</p>
                <p>Reference: <strong>${txRef}</strong></p>
                <p>Please complete payment to keep your deliveries running.</p>
                <p style="color: #94a3b8; font-size: 12px;">You consented to recurring charges and can pause or cancel anytime.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("charge-subscriptions: email failed", e);
      }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (PLAN_DAYS[sub.plan] || 7));
    await supabase
      .from("lf_subscriptions")
      .update({
        last_charged_at: new Date().toISOString(),
        next_charge_date: nextDate.toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    results.push({ id: sub.id, amount, txRef, next: nextDate.toISOString().slice(0, 10) });
  }

  return res.status(200).json({ processed: results.length, results });
}
