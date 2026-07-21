import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://pxltbgfcwylnounuzszg.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");
const webhookSecret = Deno.env.get("PAYCHANGU_WEBHOOK_SECRET") || "77b52e880f9e58a4ea1245bbbf5ff3f18e07fae5abda8b8f73b60eb9d22e2331";

interface PayChanguWebhook {
  event_type?: string;
  tx_ref?: string;
  status?: string;
  amount?: number | string;
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

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  if (!webhookSecret || webhookSecret === "your_webhook_secret") {
    console.warn("WARNING: No webhook secret - skipping verification");
    return true;
  }

  if (!signature) {
    console.error("Missing Signature header");
    return false;
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(webhookSecret);
  const messageData = encoder.encode(payload);

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await globalThis.crypto.subtle.sign("HMAC", key, messageData);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Computed signature:", computedSignature);
  console.log("Received signature:", signature);

  return computedSignature === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Signature" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }

  try {
    const signature = req.headers.get("signature") || req.headers.get("Signature");
    const rawBody = await req.text();
    console.log("Raw webhook body:", rawBody);

    const isValid = await verifySignature(rawBody, signature || "");
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const payload: PayChanguWebhook = JSON.parse(rawBody);
    console.log("Payment callback received:", payload);

    const txRef = payload.tx_ref;
    const status = payload.status;

    if (!txRef) {
      console.error("Missing tx_ref in webhook");
      return new Response(JSON.stringify({ error: "Missing tx_ref" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const successfulStatuses = ["successful", "completed", "success"];
    const isSuccessful = successfulStatuses.includes(status?.toLowerCase() || "");

    if (!isSuccessful) {
      console.log("Payment not successful, status:", status);
      return new Response(JSON.stringify({ received: true, status: "not_successful" }), { headers: { "Content-Type": "application/json" } });
    }

    if (!supabaseKey) {
      console.error("No SUPABASE_SERVICE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract order ID from tx_ref (format: "PP-{first8chars}")
    // Need to find order by tx_ref prefix
    const txRefPrefix = txRef.replace(/^PP-/i, "").substring(0, 8).toUpperCase();
    console.log("Looking for order with tx_ref prefix:", txRefPrefix);

    // Find order by matching tx_ref or id
    const { data: orders, error: findError } = await supabase
      .from("orders")
      .select("id, customer_name")
      .or(`id.ilike.%${txRefPrefix}%,tracking_number.ilike.%${txRefPrefix}%`)
      .limit(1);

    if (findError) {
      console.error("Failed to find order:", findError);
      return new Response(JSON.stringify({ error: "Failed to find order" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (!orders || orders.length === 0) {
      console.log("Order not found for tx_ref:", txRef);
      return new Response(JSON.stringify({ received: true, status: "order_not_found" }), { headers: { "Content-Type": "application/json" } });
    }

    const orderId = orders[0].id;
    console.log("Found order:", orderId, "customer:", orders[0].customer_name);

    // Get order items to deduct inventory
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_key, quantity")
      .eq("order_id", orderId);

    console.log("Order items:", orderItems);

    // Deduct inventory for each item
    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_key) {
          console.log("Deducting inventory for:", item.product_key, "qty:", item.quantity);
          
          // Direct SQL update instead of function call
          const { data: invData, error: invError } = await supabase
            .from("inventory")
            .select("quantity, reserved_quantity")
            .eq("product_id", item.product_key)
            .single();
          
          if (invError || !invData) {
            console.log("No inventory record for:", item.product_key);
            continue;
          }
          
          const newQty = invData.quantity - item.quantity;
          const newReserved = Math.max(0, (invData.reserved_quantity || 0) - item.quantity);
          
          await supabase
            .from("inventory")
            .update({ 
              quantity: newQty,
              reserved_quantity: newReserved 
            })
            .eq("product_id", item.product_key);
          
          console.log("Inventory deducted for:", item.product_key, "new qty:", newQty);
        }
      }
    }

    // Update order to paid and confirmed
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
      console.error("Failed to update order:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update order" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    console.log("Order paid and confirmed:", orderId);
    return new Response(JSON.stringify({ success: true, orderId, status: "paid" }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});