import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { formatLakeFreshPaymentRef, normalizeLakeFreshPaymentRef } from "@/lib/lfPayments";
import { lfWhatsAppLink } from "@/lib/whatsapp";
import { lfEmailHref } from "@/lib/lfContact";
import { AlertCircle, CheckCircle2, Loader2, MapPin, Search, Truck } from "lucide-react";

interface TrackStep {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
}

interface TrackItem {
  name: string;
  quantity: number;
  price_mwk: number;
  recipe_title: string | null;
  recipe_id: string | null;
}

interface TrackOrder {
  id: string;
  reference: string | null;
  status: string;
  payment_status: string;
  total_mwk: number;
  subtotal_mwk: number;
  delivery_fee_mwk: number;
  discount_mwk: number;
  delivery_date: string | null;
  delivery_window: string | null;
  customer_name: string;
  created_at: string;
}

interface TrackResult {
  ok: boolean;
  reason?: string;
  order?: TrackOrder;
  items?: TrackItem[];
  timeline?: TrackStep[];
}

const statusCopy: Record<string, { label: string; tone: string }> = {
  new: { label: "Waiting for payment", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  confirmed: { label: "Payment confirmed", tone: "bg-[#39B54A]/10 text-[#39B54A] border-[#39B54A]/30" },
  processing: { label: "Packing your fish", tone: "bg-[#EAF6FB] text-[#073B78] border-[#08A9E8]/30" },
  dispatched: { label: "Out for delivery", tone: "bg-[#EAF6FB] text-[#073B78] border-[#08A9E8]/30" },
  delivered: { label: "Delivered", tone: "bg-[#39B54A]/10 text-[#39B54A] border-[#39B54A]/30" },
  cancelled: { label: "Cancelled", tone: "bg-red-50 text-red-700 border-red-200" },
};

const friendlyDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Blantyre",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stepLabel = (label: string) =>
  label === "Preparing your fish" ? "Packing your fish" : label;

const REASON_COPY: Record<string, string> = {
  phone_required: "Enter the phone number you used when you ordered.",
  not_found: "We could not find an order with those details. Check the phone number and reference.",
};

const LakeFreshTrack = () => {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [reference, setReference] = useState(formatLakeFreshPaymentRef(searchParams.get("reference")));
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const track = async (nextPhone: string, nextReference: string) => {
    if (!nextPhone.trim()) {
      setError(REASON_COPY.phone_required);
      return;
    }
    setState("loading");
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("lf_track_order", {
        p_phone: nextPhone.trim(),
        p_reference: normalizeLakeFreshPaymentRef(nextReference) || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      const payload = (data || { ok: false }) as TrackResult;
      setResult(payload);
      setState("done");
      if (!payload.ok) setError(REASON_COPY[payload.reason || ""] || "We could not find that order.");
    } catch (err) {
      setResult(null);
      setState("done");
      setError(err instanceof Error ? err.message : "Tracking is unavailable right now.");
    }
  };

  // Auto track when arriving from an email link with a phone number.
  useEffect(() => {
    const presetPhone = searchParams.get("phone");
    if (presetPhone) void track(presetPhone, searchParams.get("reference") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const order = result?.ok ? result.order : undefined;
  const status = order ? statusCopy[order.status] || { label: order.status, tone: "bg-gray-50 text-[#073B78]/80 border-gray-200" } : null;

  return (
    <div className="min-h-[70vh] bg-[#F6FBFD]">
      <SEO
        brand="lake-fresh"
        title="Track your order | Lake Fresh Fish Mart"
        description="Track your Lake Fresh fish order with your phone number and order reference."
      />

      <div className="container max-w-2xl py-8 sm:py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#073B78]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]">
            <Truck className="h-3.5 w-3.5" /> Order tracking
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            Where is my fish?
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#073B78]/70">
            Use the phone number you ordered with. Add your order number if you have it, and we will show you where your
            fish is.
          </p>
        </div>

        <form
          className="mt-6 rounded-2xl border border-[#08A9E8]/20 bg-white p-4 shadow-sm sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void track(phone, reference);
          }}
        >
          <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#073B78]/60">
            Phone number
          </label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0991 234 567"
            className="mt-1.5 h-12 w-full rounded-xl border border-gray-300 px-4 text-base font-semibold text-[#073B78] outline-none focus:border-[#08A9E8] focus:ring-2 focus:ring-[#08A9E8]/20"
          />

          <label className="mt-4 block text-[11px] font-extrabold uppercase tracking-widest text-[#073B78]/60">
            Order reference <span className="font-semibold normal-case text-[#073B78]/50">(optional)</span>
          </label>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="LF XXXXXXXXXXXX"
            className="mt-1.5 h-12 w-full rounded-xl border border-gray-300 px-4 font-mono text-sm text-[#073B78] outline-none focus:border-[#08A9E8] focus:ring-2 focus:ring-[#08A9E8]/20"
          />

          <button
            type="submit"
            disabled={state === "loading"}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#073B78] text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-[#062e5f] disabled:opacity-60"
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {state === "loading" ? "Looking up your order" : "Track order"}
          </button>
        </form>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {order && status && (
          <div className="mt-6 rounded-2xl border border-[#08A9E8]/20 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-[#073B78]/60">
                  {formatLakeFreshPaymentRef(order.reference) || order.id.slice(0, 8)}
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-[#073B78]">
                  {formatMWK(order.total_mwk)}
                </h2>
                <p className="mt-1 text-xs text-[#073B78]/60">
                  For {order.customer_name}. Placed {friendlyDate(order.created_at)}.
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${status.tone}`}>
                {status.label}
              </span>
            </div>

            {order.delivery_date && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#EAF6FB]/70 p-3 text-sm text-[#073B78]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Delivery on <span className="font-bold">{order.delivery_date}</span>
                  {order.delivery_window ? `. ${order.delivery_window}.` : "."}
                </p>
              </div>
            )}

            <ol className="mt-5 space-y-3">
              {(result?.timeline || []).map((step) => (
                <li key={step.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      step.done
                        ? "border-[#39B54A] bg-[#39B54A] text-white"
                        : "border-gray-300 bg-white text-[#073B78]/40"
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${step.done ? "text-[#073B78]" : "text-[#073B78]/50"}`}>{stepLabel(step.label)}</p>
                    {step.at && <p className="text-[11px] text-[#073B78]/60">{friendlyDate(step.at)}</p>}
                  </div>
                </li>
              ))}
            </ol>

            {(result?.items || []).length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]/60">Your items</p>
                <ul className="mt-2 space-y-2">
                  {(result?.items || []).map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-[#073B78]">{item.name}</p>
                        {item.recipe_title && <p className="text-[11px] text-[#073B78]/60">Recipe: {item.recipe_title}</p>}
                      </div>
                      <p className="shrink-0 font-bold text-[#073B78]">{formatMWK(item.price_mwk)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.payment_status !== "paid" && order.status !== "cancelled" && (
              <LFLink
                to={`/lf/orders/${order.id}`}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#39B54A] text-xs font-extrabold uppercase tracking-widest text-white"
              >
                Open order and pay
              </LFLink>
            )}
          </div>
        )}

        {order && (
          <div className="mt-6 text-center">
            <LFLink
              to={`/lf/support?order=${order.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-[#08A9E8]/30 bg-[#EAF6FB] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
            >
              Get help with this order
            </LFLink>
          </div>
        )}

        {(lfWhatsAppLink("Hi Lake Fresh, please help me track my order.") || lfEmailHref()) && (
          <p className="mt-4 text-center text-xs text-[#073B78]/60">
            Need help?{" "}
            {lfWhatsAppLink("Hi Lake Fresh, please help me track my order.") ? (
              <a
                href={lfWhatsAppLink("Hi Lake Fresh, please help me track my order.") as string}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#073B78] underline"
              >
                Chat on WhatsApp
              </a>
            ) : (
              <a href={lfEmailHref() as string} className="font-bold text-[#073B78] underline">
                Email our team
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default LakeFreshTrack;
