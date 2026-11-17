import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;

const PRICE_PER_KG_FALLBACK = 4500;
const DELIVERY_FEE_FALLBACK = 2000;

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
    const { data: zone } = sub.delivery_zone_id
      ? await supabase
          .from("delivery_zones")
          .select("base_fee_mwk")
          .eq("id", sub.delivery_zone_id)
          .maybeSingle()
      : { data: null };

    const pricePerKg = Number(sub.price_per_kg_mwk || PRICE_PER_KG_FALLBACK);
    const deliveryFee = Number(zone?.base_fee_mwk ?? DELIVERY_FEE_FALLBACK);
    const amount = Math.round(Number(sub.quantity_kg) * pricePerKg + deliveryFee);
    const shortId = String(sub.id).replace(/-/g, "").slice(0, 12).toUpperCase();
    const txRef = `LF-SUB-${shortId}-${today.replace(/-/g, "")}`;

    const { data: priorPayment } = await supabase
      .from("payment_events")
      .select("id")
      .eq("tx_ref", txRef)
      .maybeSingle();

    if (priorPayment) {
      results.push({ id: sub.id, amount, txRef, status: "already_reminded" });
      continue;
    }

    // Manual payment only. This sends a reminder and never charges the customer.
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
            subject: `Your Lake Fresh payment reminder: ${txRef}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #073B78;">Payment reminder</h1>
                <p>Hi ${sub.customer_name},</p>
                <p>Your ${sub.plan} Lake Fresh fish plan is due. Amount: <strong>${amount} MWK</strong>.</p>
                <p>Reference: <strong>${txRef}</strong></p>
                <p>Reply to this message or chat with us on WhatsApp to pay through PayChangu.</p>
                <p style="color: #94a3b8; font-size: 12px;">This is a reminder only. We never take money from your account on a schedule.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("charge-subscriptions: email failed", e);
      }
    }

    await supabase
      .from("lf_subscriptions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    results.push({ id: sub.id, amount, txRef, status: "reminder_sent" });
  }

  return res.status(200).json({ processed: results.length, results });
}
