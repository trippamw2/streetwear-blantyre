import { supabase } from "@/integrations/supabase/client";

/**
 * Ask the server to verify a PayChangu payment after the hosted checkout
 * redirects the browser back. The server re-queries PayChangu and runs the
 * same idempotent transition as the webhook.
 */
export interface PaymentVerification {
  status: "paid" | "pending" | "failed" | "unavailable";
  outcome?: string;
  kind?: "order" | "gift";
}

export async function verifyOrderPayment(
  orderId: string,
): Promise<PaymentVerification | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  try {
    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) return null;
    return (await response.json()) as PaymentVerification;
  } catch (error) {
    console.warn("Payment verification unavailable", error);
    return null;
  }
}

export async function verifyGiftPayment(
  giftId: string,
  trackingToken: string,
): Promise<PaymentVerification | null> {
  try {
    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId, trackingToken }),
    });

    if (!response.ok) return null;
    return (await response.json()) as PaymentVerification;
  } catch (error) {
    console.warn("Gift payment verification unavailable", error);
    return null;
  }
}
