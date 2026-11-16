import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, CreditCard, Fish, Loader2, MapPin, Snowflake, Truck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import {
  useLakeFreshDeliveryConfig,
  useLakeFreshSlots,
  useLakeFreshZones,
} from "@/hooks/useLakeFresh";
import {
  DEFAULT_LF_DELIVERY_CONFIG,
  formatCutoff,
  formatDeliveryDate,
  getDeliveryFee,
  getEffectiveWeightKg,
  getEligibleDeliveryDates,
  isSlotAvailable,
  calculateFinalPrice,
} from "@/lib/lfDelivery";
import { buildLakeFreshPaymentRef } from "@/lib/lfPayments";
import { formatMWK } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const prepLabel = (value: string) =>
  value === "whole" ? "Whole" : value === "cleaned" ? "Cleaned" : value === "portioned" ? "Portioned" : value;

const LakeFreshCheckout = () => {
  const { user } = useAuth();
  const { items, subtotal, totalWeight, clear } = useLakeFreshCart();
  const navigate = useNavigate();

  const { data: zones, isLoading: zonesLoading, isError: zonesError, refetch: refetchZones } = useLakeFreshZones();
  const { data: config } = useLakeFreshDeliveryConfig();
  const deliveryConfig = config || DEFAULT_LF_DELIVERY_CONFIG;

  const [now] = useState(() => new Date());
  const dates = useMemo(
    () => getEligibleDeliveryDates(now, deliveryConfig),
    [now, deliveryConfig]
  );

  const [zoneId, setZoneId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || ""
  );
  const [phone, setPhone] = useState((user?.user_metadata?.phone as string | undefined) || "");
  const [notes, setNotes] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedZone = zones?.find((zone) => zone.id === zoneId) || null;
  const { data: slots, isLoading: slotsLoading } = useLakeFreshSlots(zoneId, dates);

  useEffect(() => {
    if (!zoneId && zones && zones.length > 0) setZoneId(zones[0].id);
  }, [zones, zoneId]);

  const slotForDate = (date: string) => slots?.find((slot) => slot.deliveryDate === date) || null;

  const isSlotUsable = (slot: {
    isOpen: boolean;
    bookedOrders: number;
    capacityOrders: number;
    bookedWeightKg: number;
    capacityWeightKg: number;
  }) =>
    isSlotAvailable(
      {
        is_open: slot.isOpen,
        booked_orders: slot.bookedOrders,
        capacity_orders: slot.capacityOrders,
        booked_weight_kg: slot.bookedWeightKg,
        capacity_weight_kg: slot.capacityWeightKg,
      },
      totalWeight
    );

  const isDateUsable = (date: string) => {
    const slot = slotForDate(date);
    if (!slot) return false;
    if (new Date(slot.cutoffAt).getTime() <= Date.now()) return false;
    return isSlotUsable(slot);
  };

  useEffect(() => {
    if (!slots || slots.length === 0) {
      if (deliveryDate) setDeliveryDate("");
      return;
    }
    if (deliveryDate && isDateUsable(deliveryDate)) return;
    const firstUsable = dates.find((date) => isDateUsable(date));
    setDeliveryDate(firstUsable || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, totalWeight, zoneId]);

  const selectedSlot = deliveryDate ? slotForDate(deliveryDate) : null;

  const zoneFee = selectedZone?.baseFeeMwk ?? null;
  const deliveryFee = getDeliveryFee(zoneFee, subtotal, deliveryConfig);
  const estimatedTotal = subtotal + deliveryFee;
  const minOrderBlocked = Boolean(selectedZone && selectedZone.minOrderMwk > 0 && subtotal < selectedZone.minOrderMwk);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <SEO brand="lake-fresh" title="Checkout — Lake Fresh Fish Mart" description="Lake Fresh fish checkout." />
        <Fish className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-[#0a2540]">Your basket is empty</h1>
        <p className="mt-2 text-sm text-gray-500">Choose fresh fish before checking out.</p>
        <Link
          to="/lf/fish"
          className="mt-6 inline-flex rounded-lg bg-[#0a2540] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
        >
          Browse the catch
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedZone) {
      toast({ title: "Choose your delivery area", variant: "destructive" });
      return;
    }
    if (!selectedSlot || !isDateUsable(selectedSlot.deliveryDate)) {
      toast({ title: "Choose an available delivery date", variant: "destructive" });
      return;
    }
    if (!name.trim() || phone.replace(/[^0-9]/g, "").length < 7) {
      toast({ title: "Enter your name and a valid phone number", variant: "destructive" });
      return;
    }
    if (minOrderBlocked && selectedZone) {
      toast({
        title: "Minimum order not reached",
        description: `${selectedZone.name} requires at least ${formatMWK(selectedZone.minOrderMwk)}.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = items.map((item) => ({
        product_id: item.productId,
        weight_kg: getEffectiveWeightKg(item.weightKg, item.minOrderQtyKg),
        preparation: item.preparation,
      }));

      const { data, error } = await supabase.rpc("lf_place_order", {
        p_customer_name: name.trim(),
        p_customer_phone: phone.trim(),
        p_zone_id: selectedZone.id,
        p_slot_id: selectedSlot.id,
        p_items: payload,
        p_notes: notes.trim() || undefined,
        p_marketing_consent: marketingConsent,
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Order could not be created");

      const orderId = String(data);
      const txRef = buildLakeFreshPaymentRef(orderId);
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const [firstName, ...rest] = name.trim().split(/\s+/);

      clear();

      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: estimatedTotal,
        currency: "MWK",
        email: user?.email || `${cleanPhone}@lakefreshmw.com`,
        firstName: firstName || "Lake",
        lastName: rest.join(" ") || "Fresh",
        txRef,
        callbackUrl: `${window.location.origin}/lf/orders/${orderId}?payment=callback`,
        returnUrl: `${window.location.origin}/lf/orders/${orderId}?payment=complete`,
        title: "Lake Fresh Fish Mart Order",
        description: `Order ${txRef}`,
      });
    } catch (error) {
      toast({
        title: "Could not place order",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#ecfeff]/30">
      <SEO
        brand="lake-fresh"
        title="Checkout — Lake Fresh Fish Mart"
        description="Place your Lake Fresh fish order for next-day delivery in Blantyre."
      />
      <div className="container max-w-5xl py-8 sm:py-12">
        <button
          type="button"
          onClick={() => navigate("/lf/cart")}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#0a2540]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to basket
        </button>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">CHECKOUT</h1>
          <p className="mt-2 text-sm text-gray-500">
            Next-day delivery · signed in as {user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-display text-lg font-extrabold text-[#0a2540]">Your details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Full name *</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#0a2540] outline-none focus:border-[#0a2540]"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone / WhatsApp *</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                    maxLength={20}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#0a2540] outline-none focus:border-[#0a2540]"
                    placeholder="e.g. 0888 000 000"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Delivery notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#0a2540] outline-none focus:border-[#0a2540]"
                  placeholder="Landmark, gate colour, or any delivery instructions"
                />
              </label>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#0a2540]">
                <MapPin className="h-4 w-4 text-[#22d3ee]" /> Delivery area
              </h2>

              {zonesLoading && (
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading delivery areas…
                </p>
              )}

              {zonesError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Could not load delivery areas.{" "}
                  <button type="button" onClick={() => refetchZones()} className="font-bold underline">
                    Try again
                  </button>
                </div>
              )}

              {!zonesLoading && !zonesError && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(zones || []).map((zone) => {
                    const selected = zoneId === zone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setZoneId(zone.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          selected
                            ? "border-[#0a2540] bg-[#0a2540] text-white"
                            : "border-gray-200 bg-white text-[#0a2540] hover:border-[#0a2540]/40"
                        }`}
                      >
                        <span className="block text-sm font-bold">{zone.name}</span>
                        <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/70" : "text-gray-500"}`}>
                          Delivery {zone.baseFeeMwk > 0 ? formatMWK(zone.baseFeeMwk) : "free"}
                          {zone.minOrderMwk > 0 ? ` · min ${formatMWK(zone.minOrderMwk)}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#0a2540]">
                <CalendarDays className="h-4 w-4 text-[#22d3ee]" /> Delivery date
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Orders placed before {formatCutoff(deliveryConfig.cutoff)} qualify for next-day delivery.
              </p>

              {!zoneId && <p className="mt-3 text-sm text-gray-500">Choose a delivery area first.</p>}

              {zoneId && slotsLoading && (
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading delivery calendar…
                </p>
              )}

              {zoneId && !slotsLoading && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {dates.map((date) => {
                    const slot = slotForDate(date);
                    const cutoffPassed = slot ? new Date(slot.cutoffAt).getTime() <= Date.now() : false;
                    const full = slot ? !isSlotUsable(slot) : false;
                    const usable = isDateUsable(date);
                    const selected = deliveryDate === date;
                    const status = !slot
                      ? "Unavailable"
                      : cutoffPassed
                      ? "Cut-off passed"
                      : full
                      ? "Full"
                      : slot.bookedOrders >= slot.capacityOrders
                      ? "Full"
                      : "Available";

                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!usable}
                        onClick={() => setDeliveryDate(date)}
                        className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          selected
                            ? "border-[#0a2540] bg-[#0a2540] text-white"
                            : "border-gray-200 bg-white text-[#0a2540] hover:border-[#0a2540]/40"
                        }`}
                      >
                        <span className="block text-sm font-bold">{formatDeliveryDate(date)}</span>
                        <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/70" : "text-gray-500"}`}>
                          {status}
                          {slot && status === "Available"
                            ? ` · ${Math.max(0, slot.capacityOrders - slot.bookedOrders)} orders left`
                            : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {zoneId && !slotsLoading && slots && slots.length === 0 && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No delivery slots are open for this area. Please try another area or check back shortly.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#0a2540]">
                <CreditCard className="h-4 w-4 text-[#22d3ee]" /> Payment
              </h2>
              <div className="mt-3 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-bold text-[#0a2540]">Pay online via PayChangu</p>
                <p className="mt-1 text-xs text-gray-500">Airtel Money · TNM Mpamba · Visa · Mastercard</p>
                <p className="mt-2 text-xs text-gray-500">
                  You will be redirected to PayChangu after placing the order. Your order is only marked paid after
                  the payment provider confirms it.
                </p>
              </div>
              <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0a2540]"
                />
                Send me occasional Lake Fresh offers. This consent is separate from SB Streetwear.
              </label>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-display text-lg font-extrabold text-[#0a2540]">Order summary</h2>
              <div className="mt-3 space-y-3">
                {items.map((item) => {
                  const lineTotal = calculateFinalPrice(item.pricePerKgMwk, item.weightKg, item.minOrderQtyKg);
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-[#0a2540]">{item.speciesName || item.name}</p>
                        <p className="text-xs text-gray-500">
                          {getEffectiveWeightKg(item.weightKg, item.minOrderQtyKg).toFixed(1)} kg ·{" "}
                          {prepLabel(item.preparation)}
                        </p>
                      </div>
                      <span className="font-semibold text-[#0a2540]">{formatMWK(lineTotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal · {totalWeight.toFixed(1)} kg</span>
                  <span>{formatMWK(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery{selectedZone ? ` · ${selectedZone.name}` : ""}</span>
                  <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-extrabold text-[#0a2540]">
                  <span>Estimated total</span>
                  <span>{formatMWK(estimatedTotal)}</span>
                </div>
              </div>

              {minOrderBlocked && selectedZone && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Add {formatMWK(selectedZone.minOrderMwk - subtotal)} more to meet the {selectedZone.name} minimum
                  order.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlot || minOrderBlocked}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a2540] py-3.5 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white hover:bg-[#0a2540]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {submitting ? "Placing order…" : `Pay ${formatMWK(estimatedTotal)}`}
              </button>

              <p className="mt-3 flex items-start gap-2 text-[11px] text-gray-500">
                <Snowflake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0a2540]/60" />
                You authorize the estimated total. We confirm packed weight before final settlement and will never
                silently charge more than you authorized.
              </p>
              <p className="mt-2 flex items-start gap-2 text-[11px] text-gray-500">
                <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0a2540]/60" />
                Stock is reserved when the order is created. If capacity changed, you will be asked to pick another
                slot.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default LakeFreshCheckout;
