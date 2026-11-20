import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { lfUrl } from "@/lib/brandSite";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, CreditCard, Fish, Loader2, MapPin, PackageCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDeliveryDate } from "@/lib/lfDelivery";
import { buildLakeFreshPaymentRef, formatLakeFreshPaymentRef } from "@/lib/lfPayments";
import { isOrderPaid, isOrderPayable } from "@/lib/paymentStatus";
import { verifyOrderPayment } from "@/lib/paymentVerify";
import { lfWhatsAppLink } from "@/lib/whatsapp";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";

const statusCopy: Record<string, { label: string; tone: string }> = {
  new: { label: "Pending payment", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  confirmed: { label: "Payment confirmed", tone: "bg-[#39B54A]/10 text-[#39B54A] border-[#39B54A]/30" },
  processing: { label: "Packing your fish", tone: "bg-[#EAF6FB] text-[#073B78] border-[#08A9E8]/30" },
  dispatched: { label: "Out for delivery", tone: "bg-[#EAF6FB] text-[#073B78] border-[#08A9E8]/30" },
  delivered: { label: "Delivered", tone: "bg-[#39B54A]/10 text-[#39B54A] border-[#39B54A]/30" },
  cancelled: { label: "Cancelled", tone: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Refunded", tone: "bg-red-50 text-red-700 border-red-200" },
};

const prepLabel = (value: string) =>
  value === "whole" ? "Whole" : value === "cleaned" ? "Cleaned" : value === "portioned" ? "Cut in pieces" : value;

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string | null;
  notes: string | null;
  subtotal_mwk: number;
  delivery_fee_mwk: number;
  discount_mwk: number;
  total_mwk: number;
  payment_method: string | null;
  payment_reference: string | null;
  delivery_date: string | null;
  delivery_window: string | null;
  created_at: string;
};

type PrepRow = {
  preparation_type: string;
  requested_weight_kg: number | null;
  packed_weight_kg: number | null;
  price_per_kg_mwk: number | null;
  final_price_mwk: number | null;
};

type ItemRow = {
  id: string;
  product_name: string;
  unit_price_mwk: number;
  quantity: number;
  recipe_title: string | null;
  preparation: PrepRow | null;
};

type ReconciliationRow = {
  status: string;
  estimated_total_mwk: number;
  final_total_mwk: number | null;
  difference_mwk: number | null;
};

type OrderDetail = {
  ok: boolean;
  reason?: string;
  order: OrderRow;
  items: ItemRow[];
  reconciliation: ReconciliationRow | null;
};

const LakeFreshOrder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const paymentParam = searchParams.get("payment");
  const verifiedRef = useRef(false);
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "paid" | "pending" | "failed">("idle");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lf", "order", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lf_public_order_detail", {
        p_order_id: id as string,
      });

      if (error) throw new Error(error.message);
      const result = data as OrderDetail | null;

      if (!result?.ok) {
        throw new Error(result?.reason === "not_found" ? "Order not found" : "We could not load this order.");
      }

      return {
        order: result.order,
        items: result.items.map((item) => ({
          ...item,
          preparation: item.preparation && item.preparation.preparation_type ? item.preparation : null,
        })),
        reconciliation: result.reconciliation || null,
      };
    },
  });

  // PayChangu returns the browser here after checkout. Verify server-side so
  // the order flips to paid even when the webhook is delayed or dropped.
  useEffect(() => {
    if (!paymentParam || !id || verifiedRef.current) return;
    verifiedRef.current = true;
    let cancelled = false;
    setVerifyState("checking");

    verifyOrderPayment(id, buildLakeFreshPaymentRef(id)).then((result) => {
      if (cancelled) return;

      if (!result) {
        setVerifyState("pending");
        return;
      }

      if (result.status === "paid") {
        setVerifyState("paid");
        refetch();
      } else if (result.status === "failed") {
        setVerifyState("failed");
        refetch();
      } else {
        setVerifyState("pending");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paymentParam, id, refetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#073B78]/60">
        <Loader2 className="h-5 w-5 animate-spin text-[#073B78]" /> Loading order…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <Fish className="mx-auto h-10 w-10 text-[#073B78]/40" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Order not available</h1>
        <p className="mt-2 text-sm text-[#073B78]/60">
          {error instanceof Error ? error.message : "We could not load this order."}
        </p>
        <LFLink
          to="/lf/orders"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white"
        >
          My orders
        </LFLink>
      </div>
    );
  }

  const { order, items, reconciliation } = data;
  const status = statusCopy[order.status] || {
    label: order.status,
    tone: "bg-gray-50 text-[#073B78]/80 border-gray-200",
  };
  const paymentRef = order.payment_reference || buildLakeFreshPaymentRef(order.id);
  const isPaid = isOrderPaid(order.payment_status);
  const canPay = isOrderPayable(order.payment_status);

  const handlePay = async () => {
    const [firstName, ...rest] = order.customer_name.trim().split(/\s+/);
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, "");
    const { redirectToPayChangu } = await import("@/lib/paychangu");
    redirectToPayChangu({
      amount: order.total_mwk,
      currency: "MWK",
      email: user?.email || `${cleanPhone}@lakefreshmw.com`,
      firstName: firstName || "Lake",
      lastName: rest.join(" ") || "Fresh",
      txRef: paymentRef,
      callbackUrl: `${lfUrl(`/orders/${order.id}`)}?payment=callback`,
      returnUrl: `${lfUrl(`/orders/${order.id}`)}?payment=complete`,
      title: "Lake Fresh Fish Mart Order",
      description: `Order ${paymentRef}`,
    });
    toast({ title: "Redirecting to PayChangu…" });
  };

  return (
    <div className="bg-white">
      <SEO
        brand="lake-fresh"
        title={`${formatLakeFreshPaymentRef(paymentRef)} | Lake Fresh Fish Mart`}
        description="Your Lake Fresh fish order details and delivery status."
      />
      <div className="container max-w-3xl py-8 sm:py-12">
        <LFLink
          to="/lf/orders"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All orders
        </LFLink>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-[#073B78]/60">{formatLakeFreshPaymentRef(paymentRef)}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              {formatMWK(order.total_mwk)}
            </h1>
            <p className="mt-1 text-xs text-[#073B78]/60">
              Placed {new Date(order.created_at).toLocaleString("en-GB", { timeZone: "Africa/Blantyre" })}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${status.tone}`}>
            {status.label}
          </span>
        </div>

        {/* 4-stage delivery tracker */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Follow your fish</p>
          <ol className="mt-3 space-y-3">
            {[
              { key: "confirmed", label: "Order paid and confirmed" },
              { key: "processing", label: "Cleaned, weighed and packed" },
              { key: "dispatched", label: "On the way" },
              { key: "delivered", label: "Delivered" },
            ].map((stage, idx) => {
              const orderRank = { new: 0, confirmed: 1, processing: 2, dispatched: 3, delivered: 4, cancelled: -1, refunded: -1 }[order.status] ?? 0;
              const done = orderRank >= idx + 1;
              const active = orderRank === idx + 1;
              return (
                <li key={stage.key} className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                      done ? "bg-[#39B54A] text-white" : active ? "bg-[#08A9E8] text-white" : "bg-gray-100 text-[#073B78]/50"
                    }`}
                  >
                    {done ? "✓" : idx + 1}
                  </span>
                  <span className={`text-sm ${done ? "font-bold text-[#073B78]" : "text-[#073B78]/60"}`}>{stage.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* WhatsApp tracking button */}
        <a
          href={lfWhatsAppLink(`Hi Lake Fresh, my order number is ${formatLakeFreshPaymentRef(paymentRef)}. Please help me track it.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
        >
          Track or chat on WhatsApp
        </a>

        {verifyState === "paid" || (paymentParam && isPaid) ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#39B54A]/30 bg-[#39B54A]/10 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Payment confirmed.</p>
              <p className="mt-1 text-xs">Your fish is reserved for your delivery window.</p>
            </div>
          </div>
        ) : paymentParam && verifyState === "checking" ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#08A9E8]/40 bg-[#EAF6FB]/60 p-4 text-sm text-[#073B78]">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <div>
              <p className="font-bold">Confirming your payment…</p>
              <p className="mt-1 text-xs">We are checking with PayChangu. This takes a few seconds.</p>
            </div>
          </div>
        ) : paymentParam && verifyState === "failed" ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">That payment did not complete.</p>
              <p className="mt-1 text-xs">No money was taken. You can try again with the Pay now button.</p>
            </div>
          </div>
        ) : paymentParam && !isPaid ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">We are checking your payment.</p>
              <p className="mt-1 text-xs">
                Coming back from PayChangu does not mark your order as paid. We wait for PayChangu to confirm before we
                update it.
              </p>
            </div>
          </div>
        ) : null}

        {order.status === "refunded" && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">This order was refunded.</p>
              <p className="mt-1 text-xs">The money was returned through the original payment route. Chat with us on WhatsApp if you need help.</p>
            </div>
          </div>
        )}

        {canPay && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#08A9E8]/40 bg-[#EAF6FB]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#073B78]">Complete your payment</p>
              <p className="text-xs text-[#073B78]/70">We keep your fish aside while you pay.</p>
            </div>
            <button
              type="button"
              onClick={handlePay}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#073B78] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay now
            </button>
          </div>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
              <CalendarDays className="h-3.5 w-3.5 text-[#08A9E8]" /> Delivery
            </p>
            <p className="mt-2 text-sm font-bold text-[#073B78]">
              {order.delivery_date ? formatDeliveryDate(order.delivery_date) : "Date pending"}
            </p>
            <p className="mt-1 text-xs text-[#073B78]/60">{order.delivery_window || "Next day delivery window"}</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-[#073B78]/60">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.customer_location}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
              <PackageCheck className="h-3.5 w-3.5 text-[#08A9E8]" /> Cleaned and packed
            </p>
            <p className="mt-2 text-sm font-bold text-[#073B78]">Kept at 0 to 4°C</p>
            <p className="mt-1 text-xs text-[#073B78]/60">Eat within 2 days of delivery. Rinse before you cook.</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display text-lg font-extrabold text-[#073B78]">Your fish</h2>
          <div className="mt-3 divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-[#073B78]">{item.product_name}</p>
                  <p className="mt-0.5 text-xs text-[#073B78]/60">
                    {item.preparation
                      ? `${Number(item.preparation.requested_weight_kg || 0).toFixed(1)} kg. ${prepLabel(item.preparation.preparation_type)}`
                      : `${item.quantity} item${item.quantity === 1 ? "" : "s"}`}
                  </p>
                  {item.preparation?.price_per_kg_mwk ? (
                    <p className="mt-0.5 text-[11px] text-[#073B78]/50">
                      {formatMWK(item.preparation.price_per_kg_mwk)} per kg
                      {item.preparation.packed_weight_kg
                        ? `. Packed ${Number(item.preparation.packed_weight_kg).toFixed(2)} kg`
                        : ". We confirm the packed weight before we send it"}
                    </p>
                  ) : null}
                  {item.recipe_title ? (
                    <p className="mt-1 text-[11px] font-semibold text-[#2c6e12]">
                      Free recipe: {item.recipe_title}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-[#073B78]">{formatMWK(item.unit_price_mwk)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-[#073B78]/70">
              <span>Subtotal</span>
              <span>{formatMWK(order.subtotal_mwk || 0)}</span>
            </div>
            <div className="flex justify-between text-[#073B78]/70">
              <span>Delivery</span>
              <span>{order.delivery_fee_mwk ? formatMWK(order.delivery_fee_mwk) : "Free"}</span>
            </div>
            {(order.discount_mwk || 0) > 0 && (
              <div className="flex justify-between text-[#39B54A]">
                <span>Discount</span>
                <span>{formatMWK(order.discount_mwk || 0)} off</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-extrabold text-[#073B78]">
              <span>{isPaid ? "Total paid" : "Your total"}</span>
              <span>{formatMWK(order.total_mwk)}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-[#073B78]/60">
            We use the estimated weight at checkout. We weigh the fish when we pack it and tell you if the price
            changes. We never charge more than you agreed.
          </p>

          {reconciliation && (
            <div className="mt-4 rounded-xl border border-[#08A9E8]/30 bg-[#EAF6FB]/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Price check</p>
              <p className="mt-2 text-sm font-bold text-[#073B78]">
                Estimated {formatMWK(reconciliation.estimated_total_mwk)}.{" "}
                {reconciliation.final_total_mwk == null
                  ? "Final total is still being checked."
                  : `Final total ${formatMWK(reconciliation.final_total_mwk)}.`}
              </p>
              {reconciliation.difference_mwk != null && (
                <p className="mt-1 text-xs text-[#073B78]/70">
                  Difference {formatMWK(reconciliation.difference_mwk)}. {reconciliation.status === "confirmed" ? "You agreed to this total." : "We will tell you before delivery."}
                </p>
              )}
            </div>
          )}
        </section>

        {order.notes && (
          <section className="mt-4 rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Delivery notes</p>
            <p className="mt-1 text-sm text-[#073B78]/80">{order.notes}</p>
          </section>
        )}

        <p className="mt-6 text-center text-xs text-[#073B78]/50">
          Paid with PayChangu. Reference {formatLakeFreshPaymentRef(paymentRef)}
        </p>
      </div>
    </div>
  );
};

export default LakeFreshOrder;
