import { createClient } from "@supabase/supabase-js";

/**
 * PayChangu webhook handler for Supabase Edge Functions.
 *
 * The Vercel endpoint (`api/payment/callback.ts`) is the primary webhook, but
 * this function is kept as a hardened second ingress. Both delegate all state
 * changes to the same idempotent Postgres function (`process_payment_event`),
 * so duplicate deliveries cannot double-confirm orders or inventory.
 */

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");
const webhookSecret = Deno.env.get("PAYCHANGU_WEBHOOK_SECRET");
const payChanguSecretKey = Deno.env.get("PAYCHANGU_SECRET_KEY");
const brevoKey = Deno.env.get("BREVO_API_KEY");

interface PayChanguWebhook {
  event_type?: string;
  tx_ref?: string;
  status?: string;
  amount?: number | string;
  charge_id?: string;
  reference?: string;
  currency?: string;
  mode?: string;
  data?: { tx_ref?: string };
  authorization?: { channel?: string };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  if (!webhookSecret || !signature) return false;

  const received = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(received)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return constantTimeEqual(computed, received);
}

async function verifyWithPayChangu(txRef: string): Promise<any | null> {
  if (!payChanguSecretKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${payChanguSecretKey}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.warn("paychangu-webhook: provider returned", response.status, txRef);
      return null;
    }

    const body: any = await response.json();
    return body?.data ?? null;
  } catch (error) {
    console.error("paychangu-webhook: verification failed", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  sender_name?: string | null;
  tracking_token?: string | null;
}): Promise<void> {
  if (!brevoKey || !gift.recipient_email) return;

  const trackingUrl = `https://wearsb.com/gift-track/${encodeURIComponent(
    String(gift.tracking_token ?? ""),
  )}`;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
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
      console.error("paychangu-webhook: gift email failed", response.status);
    }
  } catch (error) {
    console.error("paychangu-webhook: gift email failed", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("paychangu-webhook: Supabase credentials are not configured");
    return json({ error: "Server configuration error" }, 500);
  }

  if (!webhookSecret) {
    console.error("paychangu-webhook: PAYCHANGU_WEBHOOK_SECRET is not configured");
    return json({ error: "Server configuration error" }, 500);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("signature") || req.headers.get("Signature") || "";

  if (!(await verifySignature(rawBody, signature))) {
    console.warn("paychangu-webhook: invalid signature");
    return json({ error: "Invalid signature" }, 403);
  }

  let payload: PayChanguWebhook;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const txRef = String(payload.tx_ref ?? payload.data?.tx_ref ?? "").trim();
  if (!txRef) {
    console.warn("paychangu-webhook: missing tx_ref");
    return json({ received: true, status: "ignored_missing_tx_ref" });
  }

  let status = String(payload.status ?? "").toLowerCase();
  let amount = payload.amount ?? null;
  let currency = payload.currency ?? null;
  let chargeId = payload.charge_id ?? null;
  let providerReference = payload.reference ?? null;
  let channel = payload.authorization?.channel ?? null;
  let mode = payload.mode ?? null;
  let auditPayload: Record<string, unknown> = { webhook: payload };

  const verified = await verifyWithPayChangu(txRef);
  if (verified) {
    if (String(verified.tx_ref ?? "").toUpperCase() !== txRef.toUpperCase()) {
      console.warn("paychangu-webhook: reference mismatch", txRef, verified.tx_ref);
      return json({ received: true, status: "reference_mismatch" });
    }

    status = String(verified.status ?? status).toLowerCase();
    amount = verified.amount ?? amount;
    currency = verified.currency ?? currency;
    chargeId = verified.charge_id ?? chargeId;
    providerReference = verified.reference ?? providerReference;
    channel = verified.authorization?.channel ?? channel;
    mode = verified.mode ?? mode;
    auditPayload = { webhook: payload, verified };
  } else if (payChanguSecretKey) {
    // We have a secret key but could not re-query: ask PayChangu to retry.
    return json({ error: "Could not verify payment, retry later" }, 502);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
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
    console.error("paychangu-webhook: process_payment_event failed", error);
    return json({ error: "Failed to process payment" }, 500);
  }

  const outcome = (result as any)?.outcome;
  if (outcome === "paid" && (result as any)?.first_transition === true && (result as any)?.gift) {
    await sendGiftEmail((result as any).gift);
  }

  return json({
    received: true,
    ok: (result as any)?.ok ?? false,
    outcome,
    kind: (result as any)?.kind,
    orderId: (result as any)?.order_id ?? null,
    giftId: (result as any)?.gift_id ?? null,
  });
});
