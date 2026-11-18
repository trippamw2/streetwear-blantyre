import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { CalendarDays, Loader2, Repeat } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lfUrl } from "@/lib/brandSite";
import { lfDisplayCopy } from "@/lib/lfCopy";
import {
  LF_PILOT_DELIVERY_PROMISE,
  LF_PILOT_FISH_NAMES,
} from "@/lib/lfPilot";
import {
  calculateLFSubscriptionCost,
  LF_SUBSCRIPTION_PLANS,
  type LFSubscriptionPlan,
} from "@/lib/lfSubscription";
import { formatMWK } from "@/data/products";
import {
  useLakeFreshCatalog,
  useLakeFreshZones,
  LF_BRAND_ID,
} from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const makeSubscriptionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

type SubscriptionForm = {
  plan: LFSubscriptionPlan;
  fish_product_id: string;
  quantity_kg: string;
  preparation: string;
  zone_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
};

const LakeFreshSubscribe = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get("status");
  const [verification, setVerification] = useState<"checking" | "paid" | "failed" | "pending">("pending");
  const verificationStarted = useRef(false);
  const { data: zones, isLoading: zonesLoading, error: zonesError, refetch: refetchZones } = useLakeFreshZones();
  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useLakeFreshCatalog();
  const [submitting, setSubmitting] = useState(false);

  const catchOptions = useMemo(
    () => (catalog || []).filter(
      (product) => product.availabilityStatus === "available" && product.availableKg > 0
    ),
    [catalog]
  );

  const [form, setForm] = useState<SubscriptionForm>({
    plan: "weekly",
    fish_product_id: "",
    quantity_kg: "2",
    preparation: "whole",
    zone_id: "",
    customer_name: (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "",
    customer_phone: (user?.user_metadata?.phone as string) || "",
    customer_email: user?.email || "",
    notes: "",
  });

  const selectedCatch = catchOptions.find((product) => product.id === form.fish_product_id) || null;
  const selectedZone = (zones || []).find((zone) => zone.id === form.zone_id) || null;
  const preparationOptions = selectedCatch?.preparationOptions.length
    ? selectedCatch.preparationOptions
    : ["whole"];

  const cost = useMemo(
    () => calculateLFSubscriptionCost({
      plan: form.plan,
      pricePerKgMwk: selectedCatch?.pricePerKgMwk || 0,
      monthlyKg: Number(form.quantity_kg),
      deliveryFeeMwk: selectedZone?.baseFeeMwk || 0,
      minOrderQtyKg: selectedCatch?.minOrderQtyKg || 0.5,
    }),
    [form.plan, form.quantity_kg, selectedCatch?.pricePerKgMwk, selectedCatch?.minOrderQtyKg, selectedZone?.baseFeeMwk]
  );

  const planLabel = LF_SUBSCRIPTION_PLANS.find((item) => item.value === form.plan)?.label || "Weekly";
  const catchUnavailable = !catalogLoading && !catalogError && catchOptions.length === 0;
  const zoneUnavailable = !zonesLoading && !zonesError && (zones?.length || 0) === 0;
  const dataReady = !catalogLoading && !zonesLoading && !catalogError && !zonesError && !catchUnavailable && !zoneUnavailable;

  useEffect(() => {
    if (!form.zone_id && zones && zones.length > 0) {
      setForm((current) => ({ ...current, zone_id: zones[0].id }));
    }
  }, [zones, form.zone_id]);

  useEffect(() => {
    if (form.fish_product_id || catchOptions.length === 0) return;
    const first = catchOptions[0];
    setForm((current) => ({
      ...current,
      fish_product_id: first.id,
      preparation: first.preparationOptions[0] || "whole",
    }));
  }, [catchOptions, form.fish_product_id]);

  useEffect(() => {
    const current = Number(form.quantity_kg);
    if (!Number.isFinite(current) || current < cost.minMonthlyKg) {
      setForm((formState) => ({ ...formState, quantity_kg: String(cost.minMonthlyKg) }));
    }
  }, [cost.minMonthlyKg, form.quantity_kg]);

  useEffect(() => {
    if (!paymentReturn || verificationStarted.current) return;
    const saved = sessionStorage.getItem("lfSubscriptionPayment");
    if (!saved) return;
    verificationStarted.current = true;

    let parsed: { id?: string; txRef?: string };
    try {
      parsed = JSON.parse(saved);
    } catch {
      return;
    }
    if (!parsed.id || !parsed.txRef) return;

    setVerification("checking");
    void supabase
      .rpc("lf_public_subscription_status", {
        p_subscription_id: parsed.id,
        p_tx_ref: parsed.txRef,
      })
      .then(({ data, error }) => {
        if (error) throw error;
        if (data === "paid") setVerification("paid");
        else if (data === "failed") setVerification("failed");
        else setVerification("pending");
      })
      .catch(() => setVerification("pending"));
  }, [paymentReturn]);

  const chooseCatch = (productId: string) => {
    const nextCatch = catchOptions.find((product) => product.id === productId);
    const options = nextCatch?.preparationOptions.length ? nextCatch.preparationOptions : ["whole"];
    setForm((current) => ({
      ...current,
      fish_product_id: productId,
      preparation: options.includes(current.preparation) ? current.preparation : options[0],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_email.trim()) {
      toast({ title: "Add your details", description: "Please add your name, phone and email.", variant: "destructive" });
      return;
    }
    if (!selectedCatch || !selectedZone) {
      toast({ title: "Choose your plan", description: "Please wait for the catch and delivery areas to load.", variant: "destructive" });
      return;
    }
    if (!dataReady) {
      toast({ title: "Checking prices", description: "We are getting live prices. Please wait.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const subscriptionId = makeSubscriptionId();
      const txRef = `LF-SUB-${subscriptionId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      const catchLabel = lfDisplayCopy(selectedCatch.speciesName || selectedCatch.name);

      const { error } = await supabase.from("lf_subscriptions").insert({
        id: subscriptionId,
        brand_id: LF_BRAND_ID,
        user_id: user?.id || null,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        plan: form.plan,
        delivery_zone_id: selectedZone.id,
        fish_product_id: selectedCatch.id,
        price_per_kg_mwk: selectedCatch.pricePerKgMwk,
        quantity_kg: cost.perDeliveryKg,
        preparation: form.preparation,
        status: "pending_payment",
        payment_reference: txRef,
        consent_given: true,
        consent_given_at: new Date().toISOString(),
        notes: form.notes.trim() || null,
      });
      if (error) throw error;

      sessionStorage.setItem(
        "lfSubscriptionPayment",
        JSON.stringify({ id: subscriptionId, txRef })
      );

      const [firstName, ...rest] = form.customer_name.trim().split(/\s+/);
      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: cost.firstPaymentMwk,
        currency: "MWK",
        email: form.customer_email.trim(),
        firstName: firstName || form.customer_name.trim(),
        lastName: rest.join(" ") || "Fresh",
        txRef,
        callbackUrl: `${lfUrl("/subscribe")}?status=callback`,
        returnUrl: `${lfUrl("/subscribe")}?status=return`,
        title: "Lake Fresh Subscription",
        description: `First payment for ${planLabel} ${catchLabel} plan, ${cost.perDeliveryKg} kg`,
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Subscribe | Lake Fresh Fish Mart" description="Choose your catch and set up a simple fish subscription with manual payment." />
      <div className="container max-w-2xl py-10 sm:py-14">
        <LFLink to="/lf" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#08A9E8]">
          <Repeat className="h-3.5 w-3.5" /> Lake Fresh
        </LFLink>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78]">FISH ON YOUR DAYS</h1>
        <p className="mt-2 text-sm text-[#073B78]/60">
          Choose weekly, every 2 weeks or monthly. We pack your fish and bring it on the days you choose.
          You pay each time. We never charge you on our own.
        </p>
        <div className="mt-4 rounded-xl border border-[#39B54A]/30 bg-[#F4FBF7] p-3 text-xs text-[#073B78]/80">
          Pick your fish, cut and area. {LF_PILOT_DELIVERY_PROMISE}. We will remind you before
          each delivery. PayChangu keeps each payment safe.
        </div>

        {paymentReturn && (
          <div className="mt-4 rounded-xl border border-[#08A9E8]/30 bg-[#F7FBFC] p-3 text-sm text-[#073B78]">
            {verification === "checking" && "We are checking your payment. Please wait."}
            {verification === "paid" && "Payment confirmed. Your plan is active."}
            {verification === "failed" && "PayChangu did not confirm this payment. Please try again or contact us."}
            {verification === "pending" && "Payment sent. We will confirm it soon. If you paid, your plan will show as active after PayChangu reaches us."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Plan</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.plan}
              onChange={(event) => setForm({ ...form, plan: event.target.value as LFSubscriptionPlan })}
            >
              {LF_SUBSCRIPTION_PLANS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#073B78]/60">
              {planLabel} means {cost.deliveriesPerMonth} {cost.deliveriesPerMonth === 1 ? "delivery" : "deliveries"} each month.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Type of catch</label>
            {catalogLoading && <p className="mt-1 text-xs text-[#073B78]/60">Loading catch types...</p>}
            {catalogError && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-600">
                <span>Could not load catch types. Please try again.</span>
                <button type="button" onClick={() => refetchCatalog()} className="font-bold underline">Retry</button>
              </div>
            )}
            {catchUnavailable && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-600">
                <span>We expect {LF_PILOT_FISH_NAMES}. They are not available right now.</span>
                <button type="button" onClick={() => refetchCatalog()} className="font-bold underline">Retry</button>
              </div>
            )}
            {!catalogLoading && !catalogError && !catchUnavailable && (
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.fish_product_id}
                onChange={(event) => chooseCatch(event.target.value)}
              >
                <option value="" disabled>Choose a catch</option>
                {catchOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {lfDisplayCopy(product.speciesName || product.name)}, {formatMWK(product.pricePerKgMwk)} per kg
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Monthly kilograms</label>
              <input
                type="number"
                min={cost.minMonthlyKg}
                step={cost.minMonthlyKg || 0.5}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.quantity_kg}
                onChange={(event) => setForm({ ...form, quantity_kg: event.target.value })}
              />
              <p className="mt-1 text-[11px] text-[#073B78]/60">
                At least {cost.minMonthlyKg} kg each month. Each delivery carries at least {selectedCatch?.minOrderQtyKg || 0.5} kg.
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Cut</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.preparation} onChange={(event) => setForm({ ...form, preparation: event.target.value })}>
                {preparationOptions.map((option) => (
                  <option key={option} value={option}>{lfDisplayCopy(option)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Delivery area</label>
            {zonesLoading && <p className="mt-1 text-xs text-[#073B78]/60">Loading delivery areas...</p>}
            {zonesError && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-600">
                <span>Could not load delivery areas. Please try again.</span>
                <button type="button" onClick={() => refetchZones()} className="font-bold underline">Retry</button>
              </div>
            )}
            {zoneUnavailable && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-600">
                <span>Delivery areas are not available right now.</span>
                <button type="button" onClick={() => refetchZones()} className="font-bold underline">Retry</button>
              </div>
            )}
            {!zonesLoading && !zonesError && !zoneUnavailable && (
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.zone_id} onChange={(event) => setForm({ ...form, zone_id: event.target.value })}>
                <option value="" disabled>Choose an area</option>
                {(zones || []).map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-2xl border border-[#39B54A]/30 bg-[#F4FBF7] p-4" aria-live="polite">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Total monthly cost</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#073B78]">
              {formatMWK(cost.monthlyTotalMwk)}
            </p>
            {dataReady && selectedCatch && selectedZone ? (
              <>
                <div className="mt-3 space-y-1.5 text-xs text-[#073B78]/75">
                  <div className="flex items-start justify-between gap-4">
                    <span>
                      {lfDisplayCopy(selectedCatch.speciesName || selectedCatch.name)}: {formatMWK(selectedCatch.pricePerKgMwk)} per kg x {cost.monthlyKg} kg
                    </span>
                    <span className="shrink-0 font-bold">{formatMWK(cost.fishCostMwk)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>
                      Delivery: {formatMWK(selectedZone.baseFeeMwk)} x {cost.deliveriesPerMonth} {cost.deliveriesPerMonth === 1 ? "trip" : "trips"}
                    </span>
                    <span className="shrink-0 font-bold">{formatMWK(cost.deliveryCostMwk)}</span>
                  </div>
                </div>
                <p className="mt-3 border-t border-[#39B54A]/25 pt-3 text-xs font-bold text-[#073B78]">
                  First payment now: {formatMWK(cost.firstPaymentMwk)} for {cost.perDeliveryKg} kg and one delivery.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-[#073B78]/60">
                Choose a catch and delivery area to see your cost.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Name *</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Phone *</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Email *</label>
            <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Notes</label>
            <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>

          <button
            type="submit"
            disabled={submitting || !dataReady}
            className="inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {submitting ? "Sending..." : "Subscribe and pay"}
          </button>
          {!dataReady ? (
            <p className="text-[11px] text-[#073B78]/60">We are getting live catch types, areas and prices.</p>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default LakeFreshSubscribe;
