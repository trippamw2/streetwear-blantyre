import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * PayChangu webhook / IPN handler (Vercel).
 *
 * Security model:
 *  1. The raw body is authenticated with the PayChangu webhook secret
 *     (HMAC-SHA256 of the exact bytes, `Signature` header).
 *  2. The transaction is re-queried against PayChangu with the merchant secret
 *     key, because the docs explicitly require "always re-query" and webhook
 *     payloads are not authoritative.
 *  3. All state changes happen inside one Postgres function
 *     (`process_payment_event`), which is idempotent, verifies amounts, locks
 *     the order, confirms Lake Fresh reservations and commits SB inventory.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const WEBHOOK_SECRET =
  process.env.PAYCHANGU_WEBHOOK_SECRET || process.env.PAYCHANGU_WEB_SECRET;
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const PAYCHANGU_VERIFY_URL = "https://api.paychangu.com/verify-payment";

interface PayChanguWebhookPayload {
  event_type?: string;
  tx_ref?: string;
  status?: string;
  amount?: string | number;
  charge_id?: string;
  reference?: string;
  currency?: string;
  mode?: string;
  authorization?: {
    channel?: string;
    completed_at?: string;
  };
  data?: {
    tx_ref?: string;
  };
}

// Read the exact bytes so the HMAC matches what PayChangu signed.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: any): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.rawBody) {
    return Buffer.isBuffer(req.rawBody) ? req.rawBody.toString("utf8") : String(req.rawBody);
  }
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;

  const received = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(received)) return false;

  const computed = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface VerifiedPayment {
  ok: boolean;
  transient?: boolean;
  providerStatus?: number;
  data?: {
    tx_ref?: string;
    status?: string;
    amount?: number | string;
    currency?: string;
    charge_id?: string;
    reference?: string;
    mode?: string;
    authorization?: { channel?: string };
  };
}

async function verifyWithPayChangu(txRef: string): Promise<VerifiedPayment> {
  if (!PAYCHANGU_SECRET_KEY) return { ok: false, providerStatus: 0 };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `${PAYCHANGU_VERIFY_URL}/${encodeURIComponent(txRef)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        transient: response.status >= 500 || response.status === 429,
        providerStatus: response.status,
      };
    }

    const json: any = await response.json();
    if (!json?.data) {
      return { ok: false, transient: false, providerStatus: response.status };
    }

    return { ok: true, data: json.data };
  } catch (error) {
    console.error("PayChangu verification request failed", error);
    return { ok: false, transient: true };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

async function sendGiftEmail(gift: {
  recipient_email?: string | null;
  recipient_name?: string | null;
  sender_name?: string | null;
  tracking_token?: string | null;
}): Promise<void> {
  if (!BREVO_API_KEY || !gift.recipient_email) return;

  const trackingUrl = `https://wearsb.com/gift-track/${encodeURIComponent(
    String(gift.tracking_token ?? ""),
  )}`;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Streetwear Blantyre", email: "noreply@wearsb.com" },
        to: [{ email: gift.recipient_email }],
        subject: `${gift.sender_name} sent you a gift!`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; color: #0f172a;">You've received a gift!</h1>
            <p style="color: #64748b;">${escapeHtml(gift.sender_name)} sent you a Culture Piece from Streetwear Blantyre.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="background-color: #0f172a; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Track Your Gift</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">If the button doesn't work, copy this link: ${trackingUrl}</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Gift email failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("Gift email failed", error);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error("Payment callback: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!WEBHOOK_SECRET) {
    console.error("Payment callback: PAYCHANGU_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    console.error("Payment callback: could not read body", error);
    return res.status(400).json({ error: "Invalid body" });
  }

  const signature = req.headers["signature"] || req.headers["Signature"];
  if (!verifySignature(rawBody, String(signature ?? ""))) {
    console.warn("Payment callback: invalid signature");
    return res.status(403).json({ error: "Invalid signature" });
  }

  let payload: PayChanguWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // Older renewal reminders used LFSUB-. Accept them, but store one namespace.
  const normalizeSubscriptionRef = (value: string) => value.replace(/^LFSUB-/i, "LF-SUB-");
  const txRef = normalizeSubscriptionRef(
    String(payload.tx_ref ?? payload.data?.tx_ref ?? "").trim(),
  );
  if (!txRef) {
    // PayChangu's sample payloads do not always include tx_ref. Acknowledge so
    // the provider stops retrying; the client-side return flow verifies via
    // /api/payment/verify instead.
    console.warn("Payment callback: missing tx_ref");
    return res.status(200).json({ received: true, status: "ignored_missing_tx_ref" });
  }

  let status = normalizeStatus(payload.status);
  let amount = payload.amount ?? null;
  let currency = payload.currency ?? null;
  let chargeId = payload.charge_id ?? null;
  let providerReference = payload.reference ?? null;
  let channel = payload.authorization?.channel ?? null;
  let mode = payload.mode ?? null;
  let auditPayload: Record<string, unknown> = { webhook: payload };

  // Always re-query the provider before granting value.
  if (PAYCHANGU_SECRET_KEY) {
    const verified = await verifyWithPayChangu(txRef);

    if (!verified.ok) {
      if (verified.transient) {
        return res.status(502).json({ error: "Could not verify payment, retry later" });
      }

      console.warn("Payment callback: provider did not verify", txRef, verified.providerStatus);
      return res.status(200).json({ received: true, status: "unverified" });
    }

    const data = verified.data!;
    if (normalizeStatus(normalizeSubscriptionRef(String(data.tx_ref ?? ""))) !== normalizeStatus(txRef)) {
      console.warn("Payment callback: tx_ref mismatch", txRef, data.tx_ref);
      return res.status(200).json({ received: true, status: "reference_mismatch" });
    }

    status = normalizeStatus(data.status);
    amount = data.amount ?? amount;
    currency = data.currency ?? currency;
    chargeId = data.charge_id ?? chargeId;
    providerReference = data.reference ?? providerReference;
    channel = data.authorization?.channel ?? channel;
    mode = data.mode ?? mode;
    auditPayload = { webhook: payload, verified: data };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data: result, error } = await supabase.rpc("process_payment_event", {
    p_tx_ref: txRef,
    p_status: status,
    p_amount: amount === null || amount === undefined ? null : Number(amount),
    p_currency: currency,
    p_charge_id: chargeId,
    p_provider_reference: providerReference,
    p_channel: channel,
    p_mode: mode,
    p_payload: auditPayload,
  });

  if (error) {
    console.error("Payment callback: process_payment_event failed", error);
    return res.status(500).json({ error: "Failed to process payment" });
  }

  const outcome = (result as any)?.outcome;
  const firstTransition = (result as any)?.first_transition === true;
  const gift = (result as any)?.gift;

  if (outcome === "paid" && firstTransition && gift) {
    await sendGiftEmail(gift);
  }

  if (outcome === "amount_mismatch" || outcome === "currency_mismatch") {
    console.error("Payment callback rejected", txRef, outcome, result);
  }

  return res.status(200).json({
    received: true,
    ok: (result as any)?.ok ?? false,
    outcome,
    kind: (result as any)?.kind,
    orderId: (result as any)?.order_id ?? null,
    giftId: (result as any)?.gift_id ?? null,
  });
}
