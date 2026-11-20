import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

  // Prices and references are owned by the database. This endpoint only plans
  // charges and sends reminders. It never takes money from a customer.
  const { data, error } = await supabase.rpc("lf_prepare_subscription_charges");
  if (error) {
    console.error("charge-subscriptions: planning failed", error);
    return res.status(500).json({ error: "Could not plan subscription charges" });
  }

  const plan = data as any;
  if (!plan?.ok) {
    return res.status(500).json({ error: "Subscription charge planning failed" });
  }

  const charges: any[] = plan.charges || [];
  const results: any[] = [];

  for (const charge of charges) {
    const item = {
      charge_id: charge.charge_id,
      reference: charge.payment_reference,
      amount: charge.amount_mwk,
      status: "planned",
    };

    if (!charge.customer_email) {
      results.push({ ...item, status: "no_email" });
      continue;
    }

    if (!BREVO_API_KEY) {
      results.push({ ...item, status: "no_email_provider" });
      continue;
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "Lake Fresh Fish Mart", email: "orders@lakefreshmw.com" },
          to: [{ email: charge.customer_email }],
          subject: `Your Lake Fresh payment reminder: ${charge.payment_reference}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #073B78;">Payment reminder</h1>
              <p>Hi ${escapeHtml(charge.customer_name)},</p>
              <p>Your ${escapeHtml(charge.plan)} Lake Fresh fish plan is due for ${escapeHtml(charge.period_date)}. Amount: <strong>${Number(charge.amount_mwk).toLocaleString("en-MW")} MWK</strong>.</p>
              <p>Reference: <strong>${escapeHtml(charge.payment_reference)}</strong></p>
              <p>Reply to this message or chat with us on WhatsApp to pay through PayChangu.</p>
              <p style="color: #94a3b8; font-size: 12px;">This is a reminder only. We never take money from your account on a schedule.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        throw new Error(`Brevo returned ${response.status}`);
      }

      const { error: updateError } = await supabase
        .from("lf_subscription_charges")
        .update({ reminded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", charge.charge_id);

      if (updateError) {
        console.error("charge-subscriptions: reminder timestamp failed", updateError);
        results.push({ ...item, status: "reminder_sent_not_recorded" });
        continue;
      }

      results.push({ ...item, status: "reminder_sent" });
    } catch (e) {
      console.error("charge-subscriptions: email failed", e);
      results.push({ ...item, status: "reminder_failed" });
    }
  }

  return res.status(200).json({ planned: charges.length, results });
}
