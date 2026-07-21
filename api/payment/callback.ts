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
  charge?: string;
  mode?: string;
  type?: string;
  charge_id?: string;
  reference?: string;
  currency?: string;
  authorization?: {
    channel?: string;
    card_details?: unknown;
    bank_payment_details?: {
      payer_bank_uuid?: string;
      payer_bank?: string;
      payer_account_number?: string;
      payer_account_name?: string;
    };
    mobile_money?: unknown;
    completed_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const config = {
  api: {
    bodyParser: {
      includeRawBody: true,
    },
  },
};

function verifySignature(payload: string, signature: string): boolean {
  // If no real secret configured, don't accept any callbacks
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === "your_webhook_secret" || WEBHOOK_SECRET === "") {
    console.error("Webhook secret not configured - rejecting callback");
    return false;
  }
  
  if (!signature) {
    return false;
  }

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
      ;
      return res.status(403).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody) as PayChanguWebhookPayload;
    const tx_ref = payload.tx_ref;
    const status = payload.status;

    if (!tx_ref) {
      ;
      return res.status(400).json({ error: "Missing tx_ref" });
    }

    const successfulStatuses = ["successful", "completed", "success"];
    const isSuccessful = successfulStatuses.includes(status?.toLowerCase() || "");

    if (!isSuccessful) {
      return res.status(200).json({ received: true, status: "not_successful" });
    }

    if (SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
        ;
        return res.status(500).json({ error: "Failed to update order" });
      }

      return res.status(200).json({ success: true, orderId });
    }

    ;
    return res.status(200).json({ received: true, warning: "no_service_key" });
  } catch (error) {
    ;
    return res.status(500).json({ error: "Internal server error" });
  }
}