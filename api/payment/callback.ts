import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://pxltbgfcwylnounuzszg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const WEBHOOK_SECRET = process.env.VITE_PAYCHANGU_WEBHOOK_SECRET || process.env.PAYCHANGU_WEBHOOK_SECRET || "your_webhook_secret";

interface PayChanguWebhookPayload {
  event_type?: string;
  tx_ref?: string;
  status?: string;
  amount?: string | number;
  charge_id?: string;
  reference?: string;
  currency?: string;
  authorization?: {
    channel?: string;
  };
}

export const config = {
  api: {
    bodyParser: {
      includeRawBody: true,
    },
  },
};

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === "your_webhook_secret" || WEBHOOK_SECRET === "") {
    console.error("Webhook secret not configured - rejecting callback");
    return false;
  }
  if (!signature) return false;

  const computedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  return computedSignature === signature;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const signature = req.headers["signature"] || req.headers["Signature"];

    let rawBody = req.body;
    if (typeof req.body === "string") {
      rawBody = req.body;
    } else if (req.body && typeof req.body === "object") {
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = "";
    }

    if (!verifySignature(rawBody, signature)) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody) as PayChanguWebhookPayload;
    const tx_ref = payload.tx_ref;
    const status = payload.status;

    if (!tx_ref) {
      return res.status(400).json({ error: "Missing tx_ref" });
    }

    const successfulStatuses = ["successful", "completed", "success"];
    const isSuccessful = successfulStatuses.includes(status?.toLowerCase() || "");

    if (!isSuccessful) {
      return res.status(200).json({ received: true, status: "not_successful" });
    }

    if (SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Handle gift payments (tx_ref starts with SB-GIFT-)
      if (tx_ref.startsWith("SB-GIFT-")) {
        const giftId = tx_ref.replace(/^SB-GIFT-/i, "").toLowerCase();

        // Find the gift by ID
        const { data: gift, error: findError } = await supabase
          .from("gifts")
          .select("id, recipient_email, recipient_name, tracking_token, sender_name")
          .eq("id", giftId)
          .single();

        if (findError || !gift) {
          // Try matching by partial ID prefix
          const { data: gifts } = await supabase
            .from("gifts")
            .select("id, recipient_email, recipient_name, tracking_token, sender_name")
            .ilike("id", `${giftId}%`)
            .limit(1);

          if (!gifts || gifts.length === 0) {
            return res.status(404).json({ error: "Gift not found", tx_ref });
          }
          // Use the found gift
          const foundGift = gifts[0];

          // Update gift status
          await supabase
            .from("gifts")
            .update({
              is_paid: true,
              payment_status: "paid",
              paid_at: new Date().toISOString(),
              charge_id: payload.charge_id || null,
              payment_reference: payload.reference || null,
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", foundGift.id);

          // Add tracking event
          await supabase.from("gift_tracking").insert({
            gift_id: foundGift.id,
            status: "paid",
            note: "Payment confirmed via PayChangu",
          });

          // Send email to recipient if we have their email
          if (foundGift.recipient_email) {
            const trackingUrl = `https://wearsb.com/gift-track/${foundGift.tracking_token}`;
            try {
              const brevoKey = process.env.BREVO_API_KEY;
              if (brevoKey) {
                await fetch("https://api.brevo.com/v3/smtp/email", {
                  method: "POST",
                  headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": brevoKey,
                  },
                  body: JSON.stringify({
                    sender: { name: "Streetwear Blantyre", email: "noreply@wearsb.com" },
                    to: [{ email: foundGift.recipient_email }],
                    subject: `${foundGift.sender_name} sent you a gift!`,
                    htmlContent: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="font-size: 24px; color: #0f172a;">You've received a gift!</h1>
                        <p style="color: #64748b;">${foundGift.sender_name} sent you a Culture Piece from Streetwear Blantyre.</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${trackingUrl}" style="background-color: #0f172a; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Track Your Gift</a>
                        </div>
                        <p style="color: #94a3b8; font-size: 12px;">If the button doesn't work, copy this link: ${trackingUrl}</p>
                      </div>
                    `,
                  }),
                });
              }
            } catch (emailErr) {
              console.error("Failed to send gift email:", emailErr);
            }
          }

          return res.status(200).json({ success: true, type: "gift", giftId: foundGift.id });
        }

        // Update gift status
        await supabase
          .from("gifts")
          .update({
            is_paid: true,
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            charge_id: payload.charge_id || null,
            payment_reference: payload.reference || null,
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", gift.id);

        // Add tracking event
        await supabase.from("gift_tracking").insert({
          gift_id: gift.id,
          status: "paid",
          note: "Payment confirmed via PayChangu",
        });

        // Send email to recipient
        if (gift.recipient_email) {
          const trackingUrl = `https://wearsb.com/gift-track/${gift.tracking_token}`;
          try {
            const brevoKey = process.env.BREVO_API_KEY;
            if (brevoKey) {
              await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                  "accept": "application/json",
                  "content-type": "application/json",
                  "api-key": brevoKey,
                },
                body: JSON.stringify({
                  sender: { name: "Streetwear Blantyre", email: "noreply@wearsb.com" },
                  to: [{ email: gift.recipient_email }],
                  subject: `${gift.sender_name} sent you a gift!`,
                  htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1 style="font-size: 24px; color: #0f172a;">You've received a gift!</h1>
                      <p style="color: #64748b;">${gift.sender_name} sent you a Culture Piece from Streetwear Blantyre.</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${trackingUrl}" style="background-color: #0f172a; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Track Your Gift</a>
                      </div>
                      <p style="color: #94a3b8; font-size: 12px;">If the button doesn't work, copy this link: ${trackingUrl}</p>
                    </div>
                  `,
                }),
              });
            }
          } catch (emailErr) {
            console.error("Failed to send gift email:", emailErr);
          }
        }

        return res.status(200).json({ success: true, type: "gift", giftId: gift.id });
      }

      // Handle regular order payments (existing logic)
      const orderId = tx_ref.startsWith("PP-")
        ? tx_ref.replace(/^PP-/i, "").toLowerCase()
        : tx_ref.toLowerCase();

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          is_paid: true,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          charge_id: payload.charge_id || null,
          payment_reference: payload.reference || null,
          payment_channel: payload.authorization?.channel || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        return res.status(500).json({ error: "Failed to update order" });
      }

      return res.status(200).json({ success: true, orderId });
    }

    return res.status(200).json({ received: true, warning: "no_service_key" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
