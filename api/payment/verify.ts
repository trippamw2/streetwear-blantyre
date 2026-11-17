import { createClient } from "@supabase/supabase-js";

/**
 * Payment verification on customer return.
 *
 * PayChangu's hosted checkout redirects the browser back to the storefront
 * (`?payment=callback` / `?payment=complete`). Webhooks can be delayed or
 * dropped, and the docs explicitly recommend re-querying. This endpoint:
 *
 *  - authenticates the caller (order owner JWT, gift tracking token, or
 *    subscription id and reference created at checkout),
 *  - re-queries PayChangu with the merchant secret key,
 *  - runs the same idempotent `process_payment_event` used by the webhook.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
const PAYCHANGU_VERIFY_URL = "https://api.paychangu.com/verify-payment";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SB_ID = "11111111-1111-1111-1111-111111111111";
const LF_ID = "22222222-2222-2222-2222-222222222222";

function hexOf(id: string): string {
  return id.replace(/-/g, "").toUpperCase();
}

export function orderPaymentRef(orderId: string, brandId?: string | null): string {
  return brandId === LF_ID
    ? `LF-${hexOf(orderId).slice(0, 12)}`
    : `SB-${hexOf(orderId).slice(0, 8)}`;
}

export function giftPaymentRef(giftId: string): string {
  return `SB-GIFT-${hexOf(giftId).slice(0, 8)}`;
}

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") return JSON.parse(req.body);
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
  if (req.rawBody) {
    return JSON.parse(Buffer.isBuffer(req.rawBody) ? req.rawBody.toString("utf8") : String(req.rawBody));
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function verifyWithPayChangu(txRef: string): Promise<any | null> {
  if (!PAYCHANGU_SECRET_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `${PAYCHANGU_VERIFY_URL}/${encodeURIComponent(txRef)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.warn("verify: provider returned", response.status, txRef);
      return null;
    }

    const json: any = await response.json();
    return json?.data ?? null;
  } catch (error) {
    console.error("verify: provider request failed", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  let body: any;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let txRef = "";
  let kind: "order" | "gift" | "subscription" = "order";
  let recordId = "";
  let expectedTotal = 0;

  if (body?.subscriptionId) {
    kind = "subscription";
    recordId = String(body.subscriptionId);
    txRef = String(body?.txRef ?? "").trim();
    if (!txRef.startsWith("LF-SUB-")) {
      return res.status(400).json({ error: "Invalid subscription reference" });
    }

    const { data: subscription, error } = await supabase
      .from("lf_subscriptions")
      .select("id, status, payment_reference, quantity_kg, price_per_kg_mwk, delivery_zone_id")
      .eq("id", recordId)
      .eq("brand_id", LF_ID)
      .maybeSingle();

    if (error || !subscription || subscription.payment_reference !== txRef) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (subscription.status === "active") {
      return res.status(200).json({ status: "paid", subscriptionId: subscription.id });
    }

    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("base_fee_mwk")
      .eq("id", subscription.delivery_zone_id)
      .eq("brand_id", LF_ID)
      .maybeSingle();

    expectedTotal = Math.round(
      Number(subscription.quantity_kg || 0) * Number(subscription.price_per_kg_mwk || 0) +
        Number((zone as any)?.base_fee_mwk || 0)
    );
  } else if (body?.giftId) {
    kind = "gift";
    recordId = String(body.giftId);
    const token = String(body.trackingToken ?? "");
    if (!token) return res.status(400).json({ error: "Missing tracking token" });

    const { data: gift, error } = await supabase
      .from("gifts")
      .select("id, total_mwk, is_paid, payment_reference, tracking_token")
      .eq("id", recordId)
      .eq("tracking_token", token)
      .maybeSingle();

    if (error || !gift) return res.status(404).json({ error: "Gift not found" });
    if (gift.is_paid) return res.status(200).json({ status: "paid", giftId: gift.id });

    txRef = gift.payment_reference || giftPaymentRef(gift.id);
    expectedTotal = Number(gift.total_mwk);
  } else {
    const orderId = String(body?.orderId ?? "");
    if (!orderId) return res.status(400).json({ error: "Missing order id" });

    const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, brand_id, total_mwk, payment_status, payment_reference")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ error: "Order not found" });
    if (order.user_id !== authData.user.id) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.payment_status === "paid") {
      return res.status(200).json({ status: "paid", orderId: order.id });
    }

    recordId = order.id;
    txRef = order.payment_reference || orderPaymentRef(order.id, order.brand_id);
    expectedTotal = Number(order.total_mwk);
  }

  const verified = await verifyWithPayChangu(txRef);
  if (!verified) {
    return res.status(200).json({ status: "unavailable", kind });
  }

  if (String(verified.tx_ref ?? "").toUpperCase() !== txRef.toUpperCase()) {
    console.warn("verify: reference mismatch", txRef, verified.tx_ref);
    return res.status(200).json({ status: "failed", reason: "reference_mismatch", kind });
  }

  const { data: result, error } = await supabase.rpc("process_payment_event", {
    p_tx_ref: txRef,
    p_status: String(verified.status ?? "").toLowerCase(),
    p_amount: verified.amount !== undefined ? Number(verified.amount) : null,
    p_currency: verified.currency ?? "MWK",
    p_charge_id: verified.charge_id ?? null,
    p_provider_reference: verified.reference ?? null,
    p_channel: verified.authorization?.channel ?? null,
    p_mode: verified.mode ?? null,
    p_payload: { source: "client_return", verified },
  });

  if (error) {
    console.error("verify: process_payment_event failed", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }

  const outcome = (result as any)?.outcome;
  const status =
    outcome === "paid" || outcome === "already_paid"
      ? "paid"
      : outcome === "payment_failed"
        ? "failed"
        : "pending";

  return res.status(200).json({
    status,
    outcome,
    kind,
    orderId: kind === "order" ? recordId : undefined,
    giftId: kind === "gift" ? recordId : undefined,
    subscriptionId: kind === "subscription" ? recordId : undefined,
    expectedTotal,
  });
}
