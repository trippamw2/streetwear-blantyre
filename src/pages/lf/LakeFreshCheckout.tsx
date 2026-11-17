import { Fragment, useEffect, useMemo, useState } from "react";
import { LFLink, useLFNavigate } from "@/components/lf/lfRouter";
import { lfUrl } from "@/lib/brandSite";
import { AlertCircle, ArrowLeft, CalendarDays, Clock, CreditCard, Fish, Gift, Loader2, MapPin, Snowflake, Truck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { LeafletMap } from "@/components/lf/LeafletMap";
import { useAuth } from "@/contexts/AuthContext";
import { useLakeFreshCart, type LakeFreshCartItem } from "@/contexts/LakeFreshCartContext";
import {
  useLakeFreshDeliveryConfig,
  useLakeFreshSlots,
  useLakeFreshZones,
  LF_BRAND_ID,
} from "@/hooks/useLakeFresh";
import { useLoyalty } from "@/hooks/useLoyalty";
import {
  DEFAULT_LF_DELIVERY_CONFIG,
  formatDeliveryDate,
  getDeliveryFee,
  getEffectiveWeightKg,
  getEligibleDeliveryDates,
  isSlotAvailable,
  calculateFinalPrice,
} from "@/lib/lfDelivery";
import { buildLakeFreshPaymentRef } from "@/lib/lfPayments";
import { sendOrderConfirmationEmail } from "@/lib/brevo";
import { formatMWK } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LF_PILOT_DELIVERY_PROMISE, LF_PILOT_ZONE_NAMES } from "@/lib/lfPilot";

const prepLabel = (value: string) =>
  value === "whole"
    ? "Whole"
    : value === "cleaned"
      ? "Cleaned"
      : value === "portioned"
        ? "Cleaned and cut"
        : value === "seasoned"
          ? "Seasoned"
          : value;

const itemLine = (item: LakeFreshCartItem) => {
  if (item.kind === "unit") {
    return {
      detail: `${item.quantity || 1} pack${item.quantity === 1 ? "" : "s"}${item.unit ? `. ${item.unit}` : ""}`,
      total: (item.unitPriceMwk || 0) * (item.quantity || 1),
    };
  }
  return {
    detail: `${getEffectiveWeightKg(item.weightKg || 0, item.minOrderQtyKg || 0.5).toFixed(1)} kg. ${prepLabel(item.preparation || "whole")}`,
    total: calculateFinalPrice(item.pricePerKgMwk || 0, item.weightKg || 0, item.minOrderQtyKg || 0.5),
  };
};

const LakeFreshCheckout = () => {
  const { user } = useAuth();
  const { items, subtotal, totalWeight, clear } = useLakeFreshCart();
  const navigate = useLFNavigate();

  const { data: zones, isLoading: zonesLoading, isError: zonesError, refetch: refetchZones } = useLakeFreshZones();
  const { data: config } = useLakeFreshDeliveryConfig();
  const deliveryConfig = config || DEFAULT_LF_DELIVERY_CONFIG;

  const [now] = useState(() => new Date());
  const dates = useMemo(
    () => getEligibleDeliveryDates(now, deliveryConfig),
    [now, deliveryConfig],
  );

  const [zoneId, setZoneId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || ""
  );
  const [phone, setPhone] = useState((user?.user_metadata?.phone as string | undefined) || "");
  const [notes, setNotes] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState<"morning" | "afternoon">("morning");
  const [houseNumber, setHouseNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  const { loyalty, program } = useLoyalty(user?.id, user?.email, LF_BRAND_ID);
  const availablePoints = loyalty?.available_points || 0;
  const redeemStep = program?.points_to_redeem || 100;
  const rewardValue = program?.reward_value_mwk || 1000;
  const maxRedeemPercent = program?.max_redeem_percent || 50;

  const pointsToUse = useMemo(() => {
    if (!usePoints || !program || availablePoints < redeemStep) return 0;
    const maxDiscount = Math.floor((subtotal * maxRedeemPercent) / 100);
    const cap = Math.floor(maxDiscount / rewardValue) * redeemStep;
    return Math.min(Math.floor(availablePoints / redeemStep) * redeemStep, cap);
  }, [usePoints, program, availablePoints, subtotal, redeemStep, rewardValue, maxRedeemPercent]);

  const loyaltyPreview = pointsToUse > 0 ? (pointsToUse / redeemStep) * rewardValue : 0;

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
  const promoDiscount = promoPreview?.discount || 0;
  const totalDiscount = Math.min(subtotal, loyaltyPreview + promoDiscount);
  const estimatedTotal = Math.max(0, subtotal + deliveryFee - totalDiscount);
  const minOrderBlocked = Boolean(selectedZone && selectedZone.minOrderMwk > 0 && subtotal < selectedZone.minOrderMwk);

  const applyPromo = async () => {
    const code = promoCode.trim();
    setPromoError(null);
    if (!code) return;

    // The server checks the code and its limits. The browser only learns
    // whether it is valid, never the whole promo table.
    const { data, error } = await supabase.rpc("lf_preview_promo", { p_code: code });

    if (error || !data?.ok) {
      setPromoError("That code is not valid or has expired.");
      setPromoPreview(null);
      return;
    }
    if (subtotal < Number(data.min_order || 0)) {
      setPromoError(`That code needs a minimum order of ${formatMWK(Number(data.min_order || 0))}.`);
      setPromoPreview(null);
      return;
    }

    const discount =
      data.type === "percentage" || data.type === "percent"
        ? Math.floor((subtotal * Number(data.value)) / 100)
        : Math.floor(Number(data.value));
    setPromoPreview({ code: data.code as string, discount });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setDeliveryLat(lat);
    setDeliveryLng(lng);
    // reverse geocode via OpenStreetMap Nominatim (free, no key)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { "Accept-Language": "en" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.display_name) setDeliveryPlace(data.display_name);
      })
      .catch(() => {});
  };

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
    if (!landmark.trim()) {
      toast({ title: "Add the nearest landmark and gate directions", variant: "destructive" });
      return;
    }
    if (!deliveryWindow) {
      toast({ title: "Choose a delivery window", variant: "destructive" });
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
      const payload = items.map((item) => {
        if (item.kind === "unit") {
          return {
            kind: "unit",
            item_type: item.itemType || "other",
            product_id: item.productId,
            quantity: item.quantity || 1,
          };
        }
        return {
          kind: "fish",
          product_id: item.productId,
          weight_kg: getEffectiveWeightKg(item.weightKg || 0, item.minOrderQtyKg || 0.5),
          preparation: item.preparation || "whole",
          recipe_id: item.recipeId || undefined,
          recipe_title: item.recipeTitle || undefined,
        };
      });

      const windowLabel =
        deliveryWindow === "morning" ? "Morning, 8 AM to 11 AM" : "Afternoon, 4 PM to 6:30 PM";
      const finalNotes = [
        `Landmark and directions: ${landmark.trim()}`,
        `Delivery window: ${windowLabel}`,
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" | ");

      const { data, error } = await supabase.rpc("lf_place_order", {
        p_customer_name: name.trim(),
        p_customer_phone: phone.trim(),
        p_zone_id: selectedZone.id,
        p_slot_id: selectedSlot.id,
        p_items: payload,
        p_notes: finalNotes,
        p_marketing_consent: marketingConsent,
        p_redeem_points: pointsToUse,
        p_promo_code: promoPreview?.code || (promoCode.trim() || null),
        p_customer_email: user?.email || undefined,
        p_house_number: houseNumber.trim() || undefined,
        p_street_name: streetName.trim() || undefined,
        p_delivery_lat: deliveryLat ?? undefined,
        p_delivery_lng: deliveryLng ?? undefined,
        p_delivery_place: deliveryPlace.trim() || undefined,
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Order could not be created");

      const orderId = String(data);
      const txRef = buildLakeFreshPaymentRef(orderId);
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const [firstName, ...rest] = name.trim().split(/\s+/);

      // The server calculates the real total (promo and loyalty are validated
      // there), so read it back before charging.
      const { data: savedOrder } = await supabase
        .from("orders")
        .select("total_mwk, subtotal_mwk, delivery_fee_mwk, discount_mwk, payment_reference")
        .eq("id", orderId)
        .maybeSingle();
      const payableTotal = savedOrder?.total_mwk || estimatedTotal;
      const reference = savedOrder?.payment_reference || txRef;

      // Recipe PDFs attached to this order are emailed as downloadable links.
      let recipePdfs: Array<{ title: string; url: string }> = [];
      const recipeIds = items
        .filter((item) => item.kind === "fish" && item.recipeId)
        .map((item) => item.recipeId as string);
      if (recipeIds.length > 0) {
        const { data: recipeRows } = await supabase
          .from("lf_recipes")
          .select("title, pdf_url")
          .in("id", recipeIds);
        recipePdfs = (recipeRows || [])
          .filter((row: any) => row.pdf_url)
          .map((row: any) => ({ title: row.title, url: row.pdf_url }));
      }

      // Send order confirmation email (Lake Fresh branded)
      try {
        const emailItems = items.map((item) => ({
          name:
            item.kind === "fish" && item.recipeTitle
              ? `${item.name} (free recipe: ${item.recipeTitle})`
              : item.name,
          quantity: item.kind === "unit" ? item.quantity || 1 : 1,
          price:
            item.kind === "unit"
              ? (item.unitPriceMwk || 0) * (item.quantity || 1)
              : calculateFinalPrice(item.pricePerKgMwk || 0, item.weightKg || 0, item.minOrderQtyKg || 0.5),
        }));
        await sendOrderConfirmationEmail({
          to: user?.email || `${cleanPhone}@lakefreshmw.com`,
          toName: name.trim(),
          orderId,
          items: emailItems,
          total: payableTotal,
          location: selectedZone?.name || "",
          deliveryMethod: selectedSlot ? `Next day. ${selectedSlot.deliveryDate}` : "Next day delivery",
          type: "confirmation",
          brand: "lake-fresh",
          recipes: recipePdfs,
          trackingUrl: `${lfUrl("/track")}?phone=${encodeURIComponent(phone.trim())}&reference=${encodeURIComponent(reference)}`,
        });
      } catch (emailErr) {
        console.warn("LF order confirmation email failed", emailErr);
      }

      clear();

      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: payableTotal,
        currency: "MWK",
        email: user?.email || `${cleanPhone}@lakefreshmw.com`,
        firstName: firstName || "Lake",
        lastName: rest.join(" ") || "Fresh",
        txRef: reference,
        callbackUrl: `${lfUrl("/orders/" + orderId)}?payment=callback`,
        returnUrl: `${lfUrl("/orders/" + orderId)}?payment=complete`,
        title: "Lake Fresh Fish Mart Order",
        description: `Order ${reference}`,
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

  const steps = [
    { key: "basket", label: "Basket", icon: Fish },
    { key: "delivery", label: "Delivery", icon: MapPin },
    { key: "pay", label: "Pay", icon: CreditCard },
  ];
  const stepMeta = steps[Math.min(Math.max(step, 0), steps.length - 1)];

  const continueToDelivery = () => {
    if (minOrderBlocked && selectedZone) {
      toast({
        title: "Minimum order not reached",
        description: `${selectedZone.name} requires at least ${formatMWK(selectedZone.minOrderMwk)}.`,
        variant: "destructive",
      });
      return;
    }
    setStep(1);
  };

  const continueToPay = () => {
    if (!name.trim() || phone.replace(/[^0-9]/g, "").length < 7) {
      toast({ title: "Enter your name and a valid phone number", variant: "destructive" });
      return;
    }
    if (!selectedZone) {
      toast({ title: "Choose your delivery area", variant: "destructive" });
      return;
    }
    if (!selectedSlot || !isDateUsable(selectedSlot.deliveryDate)) {
      toast({ title: "Choose an available delivery date", variant: "destructive" });
      return;
    }
    if (!landmark.trim()) {
      toast({ title: "Add the nearest landmark and gate directions", variant: "destructive" });
      return;
    }
    if (!deliveryWindow) {
      toast({ title: "Choose a delivery window", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  return (
    <div className="bg-[#EAF6FB]/30">
      <SEO
        brand="lake-fresh"
        title="Checkout | Lake Fresh Fish Mart"
        description={`${LF_PILOT_DELIVERY_PROMISE} in ${LF_PILOT_ZONE_NAMES}. Pay with PayChangu.`}
      />
      <div className="container max-w-5xl py-8 sm:py-12">
        <button
          type="button"
          onClick={() => navigate("/lf/cart")}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to basket
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              Finish your order
            </h1>
            <p className="mt-2 text-sm text-[#073B78]/70">
              Three short steps. You choose where and when to get your fish, then pay with PayChangu.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
            {steps.map((s, index) => (
              <Fragment key={s.key}>
                {index > 0 && (
                  <span className={`hidden h-0.5 w-6 sm:block ${index <= step ? "bg-[#39B54A]" : "bg-gray-200"}`} />
                )}
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest ${
                    index === step
                      ? "bg-[#073B78] text-white"
                      : index < step
                        ? "bg-[#7ED321]/15 text-[#2c6e12]"
                        : "bg-gray-50 text-[#073B78]/60"
                  }`}
                >
                  <s.icon className="h-3 w-3" /> {s.label}
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        {step === 0 && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              continueToDelivery();
            }}
            className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"
          >
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                <Fish className="h-4 w-4 text-[#39B54A]" /> Your basket
              </h2>
              <p className="mt-1 text-xs text-[#073B78]/60">Fresh fish, seasonings and one free recipe. {LF_PILOT_DELIVERY_PROMISE}.</p>

              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const line = itemLine(item);
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-[#073B78]">{item.speciesName || item.name}</p>
                        <p className="text-xs text-[#073B78]/60">
                          {line.detail}
                          {item.recipeTitle ? `. Free recipe: ${item.recipeTitle}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold text-[#073B78]">{formatMWK(line.total)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-[#073B78]/70">
                  <span>Fish and spices, {totalWeight.toFixed(1)} kg</span>
                  <span>{formatMWK(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#073B78]/70">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-extrabold text-[#073B78]">
                  <span>Your total so far</span>
                  <span>{formatMWK(estimatedTotal)}</span>
                </div>
              </div>

              {minOrderBlocked && selectedZone && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Add {formatMWK(selectedZone.minOrderMwk - subtotal)} more to reach the {selectedZone.name} minimum.
                </p>
              )}

              <button
                type="submit"
                disabled={Boolean(minOrderBlocked && selectedZone)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#073B78] py-3.5 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white hover:bg-[#073B78]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to delivery
              </button>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-display text-lg font-extrabold text-[#073B78]">Order summary</h2>
                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const line = itemLine(item);
                    return (
                      <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-[#073B78]">{item.speciesName || item.name}</p>
                          <p className="text-xs text-[#073B78]/60">{line.detail}</p>
                        </div>
                        <span className="font-semibold text-[#073B78]">{formatMWK(line.total)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Fish and spices, {totalWeight.toFixed(1)} kg</span>
                    <span>{formatMWK(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Delivery{selectedZone ? ` to ${selectedZone.name}` : ""}</span>
                    <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Cold box packing</span>
                    <span className="text-[#39B54A] font-bold">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-extrabold text-[#073B78]">
                    <span>Total to pay</span>
                    <span>{formatMWK(estimatedTotal)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        )}

        {step === 1 && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              continueToPay();
            }}
            className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"
          >
            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-display text-lg font-extrabold text-[#073B78]">Your details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Full name *</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Phone or WhatsApp *</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      type="tel"
                      maxLength={20}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                      placeholder="e.g. 0888 000 000"
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">House number</span>
                  <input
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    maxLength={40}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                    placeholder="e.g. 12"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Street name</span>
                  <input
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    maxLength={120}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                    placeholder="e.g. Main Road"
                  />
                </label>
                <div className="mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Pin your exact location on the map</span>
                  <p className="mt-1 text-xs text-[#073B78]/60">Tap the map to drop a pin. We use it to plan the fastest delivery route.</p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                    <LeafletMap
                      center={deliveryLat && deliveryLng ? [deliveryLat, deliveryLng] : [-15.7861, 35.0058]}
                      zoom={deliveryLat ? 16 : 13}
                      marker={deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : null}
                      onClick={handleMapClick}
                      height={260}
                    />
                  </div>
                  {deliveryLat && deliveryLng && (
                    <p className="mt-2 text-xs text-[#073B78]/70">
                      Pinned: {deliveryLat.toFixed(5)}, {deliveryLng.toFixed(5)}
                      {deliveryPlace ? `. ${deliveryPlace}` : ""}
                    </p>
                  )}
                </div>
                <label className="mt-4 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
                    Nearest landmark and gate directions *
                  </span>
                  <textarea
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    required
                    maxLength={300}
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                    placeholder="e.g. Opposite the blue gate, near the Shoprite junction"
                  />
                  <span className="mt-1 block text-[11px] text-[#073B78]/60">
                    This helps our rider find you fast.
                  </span>
                </label>
                <label className="mt-4 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Other notes for the rider</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#073B78] outline-none focus:border-[#073B78]"
                    placeholder="Anything else our rider should know"
                  />
                </label>
                <label className="mt-4 flex items-start gap-2 text-xs text-[#073B78]/70">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#073B78]"
                  />
                  Send me occasional Lake Fresh offers. We do not share this with other brands.
                </label>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <MapPin className="h-4 w-4 text-[#08A9E8]" /> Delivery area
                </h2>
                <p className="mt-1 text-xs text-[#073B78]/60">
                  For this pilot we deliver to {LF_PILOT_ZONE_NAMES} only.
                </p>

                {zonesLoading && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-[#073B78]/60">
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
                              ? "border-[#073B78] bg-[#073B78] text-white"
                              : "border-gray-200 bg-white text-[#073B78] hover:border-[#073B78]/40"
                          }`}
                        >
                          <span className="block text-sm font-bold">{zone.name}</span>
                          <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/70" : "text-[#073B78]/60"}`}>
                            Delivery {zone.baseFeeMwk > 0 ? formatMWK(zone.baseFeeMwk) : "free"}
                            {zone.minOrderMwk > 0 ? `. At least ${formatMWK(zone.minOrderMwk)}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <CalendarDays className="h-4 w-4 text-[#08A9E8]" /> Delivery date
                </h2>
                <p className="mt-1 text-xs text-[#073B78]/60">
                  {LF_PILOT_DELIVERY_PROMISE} in {LF_PILOT_ZONE_NAMES}, when a next day slot is open.
                </p>

                {!zoneId && <p className="mt-3 text-sm text-[#073B78]/60">Choose a delivery area first.</p>}

                {zoneId && slotsLoading && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-[#073B78]/60">
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
                          ? "Order time passed"
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
                              ? "border-[#073B78] bg-[#073B78] text-white"
                              : "border-gray-200 bg-white text-[#073B78] hover:border-[#073B78]/40"
                          }`}
                        >
                          <span className="block text-sm font-bold">{formatDeliveryDate(date)}</span>
                          <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/70" : "text-[#073B78]/60"}`}>
                            {status}
                            {slot && status === "Available"
                              ? `. ${Math.max(0, slot.capacityOrders - slot.bookedOrders)} places left`
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
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <Clock className="h-4 w-4 text-[#08A9E8]" /> Delivery window *
                </h2>
                <p className="mt-1 text-xs text-[#073B78]/60">Choose when you would like your fish delivered.</p>
                {selectedSlot && new Date(selectedSlot.cutoffAt).getTime() <= Date.now() ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    It is too late for this day. Pick another delivery day.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      { key: "morning" as const, label: "Morning slot", time: "8 AM to 11 AM" },
                      { key: "afternoon" as const, label: "Afternoon slot", time: "4 PM to 6:30 PM" },
                    ].map((option) => {
                      const selected = deliveryWindow === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setDeliveryWindow(option.key)}
                          className={`rounded-xl border p-3 text-left transition-colors ${
                            selected
                              ? "border-[#073B78] bg-[#073B78] text-white"
                              : "border-gray-200 bg-white text-[#073B78] hover:border-[#073B78]/40"
                          }`}
                        >
                          <span className="block text-sm font-bold">{option.label}</span>
                          <span className={`mt-0.5 block text-[11px] ${selected ? "text-white/70" : "text-[#073B78]/60"}`}>
                            {option.time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-display text-lg font-extrabold text-[#073B78]">Order summary</h2>
                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const line = itemLine(item);
                    return (
                      <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-[#073B78]">{item.speciesName || item.name}</p>
                          <p className="text-xs text-[#073B78]/60">{line.detail}</p>
                        </div>
                        <span className="font-semibold text-[#073B78]">{formatMWK(line.total)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Fish and spices, {totalWeight.toFixed(1)} kg</span>
                    <span>{formatMWK(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Delivery{selectedZone ? ` to ${selectedZone.name}` : ""}</span>
                    <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Cold box packing</span>
                    <span className="text-[#39B54A] font-bold">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-extrabold text-[#073B78]">
                    <span>Total to pay</span>
                    <span>{formatMWK(estimatedTotal)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <Gift className="h-4 w-4 text-[#39B54A]" /> Rewards and promo code
                </h2>

                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F6FBFD] p-3">
                    <div>
                      <p className="text-sm font-bold text-[#073B78]">Your points</p>
                      <p className="text-xs text-[#073B78]/70">
                        {availablePoints} points available
                        {program ? `. ${program.points_to_redeem} points give ${formatMWK(program.reward_value_mwk)} off` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUsePoints((prev) => !prev)}
                      disabled={availablePoints < redeemStep}
                      className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-40 ${
                        usePoints ? "bg-[#39B54A] text-white" : "bg-[#073B78] text-white"
                      }`}
                    >
                      {availablePoints < redeemStep ? "Not enough" : usePoints ? "Points on" : "Use points"}
                    </button>
                  </div>
                  {usePoints && loyaltyPreview > 0 && (
                    <p className="text-xs font-bold text-[#39B54A]">
                      Using {pointsToUse} points saves {formatMWK(loyaltyPreview)}.
                    </p>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
                      Promo code
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(event) => {
                          setPromoCode(event.target.value);
                          setPromoError(null);
                        }}
                        placeholder="Enter code"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 px-3 text-sm uppercase text-[#073B78] outline-none focus:border-[#08A9E8]"
                      />
                      <button
                        type="button"
                        onClick={() => void applyPromo()}
                        className="shrink-0 rounded-xl bg-[#073B78] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="mt-1.5 text-xs font-semibold text-red-600">{promoError}</p>}
                    {promoPreview && (
                      <p className="mt-1.5 text-xs font-bold text-[#39B54A]">
                        {promoPreview.code} saves {formatMWK(promoPreview.discount)}.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <CreditCard className="h-4 w-4 text-[#08A9E8]" /> Pay securely
                </h2>
                <div className="mt-3 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-bold text-[#073B78]">Pay online via PayChangu</p>
                  <p className="mt-1 text-xs text-[#073B78]/60">
                    Pay with Airtel Money, TNM Mpamba, Visa or Mastercard.
                  </p>
                  <p className="mt-2 text-xs text-[#073B78]/60">
                    After you place the order, we take you to PayChangu. Your order is paid only after PayChangu
                    confirms it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Airtel Money", "TNM Mpamba", "Visa", "Mastercard", "Bank transfer"].map((m) => (
                      <span key={m} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-[#073B78]">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#39B54A]">
                    PayChangu confirms payments quickly. If your fish is not right, message us and we will help.
                  </p>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-display text-lg font-extrabold text-[#073B78]">Order summary</h2>
                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const line = itemLine(item);
                    return (
                      <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-[#073B78]">{item.speciesName || item.name}</p>
                          <p className="text-xs text-[#073B78]/60">{line.detail}</p>
                        </div>
                        <span className="font-semibold text-[#073B78]">{formatMWK(line.total)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Fish and spices, {totalWeight.toFixed(1)} kg</span>
                    <span>{formatMWK(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Delivery{selectedZone ? ` to ${selectedZone.name}` : ""}</span>
                    <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#073B78]/70">
                    <span>Cold box packing</span>
                    <span className="text-[#39B54A] font-bold">Free</span>
                  </div>
                  {loyaltyPreview > 0 && (
                    <div className="flex justify-between text-[#39B54A]">
                      <span>Rewards ({pointsToUse} points)</span>
                      <span>-{formatMWK(loyaltyPreview)}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-[#39B54A]">
                      <span>Promo ({promoPreview?.code})</span>
                      <span>-{formatMWK(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-extrabold text-[#073B78]">
                    <span>Total to pay</span>
                    <span>{formatMWK(estimatedTotal)}</span>
                  </div>
                </div>

                {minOrderBlocked && selectedZone && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    Add {formatMWK(selectedZone.minOrderMwk - subtotal)} more to reach the {selectedZone.name} minimum.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot || minOrderBlocked}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#073B78] py-3.5 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white hover:bg-[#073B78]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {submitting ? "Placing order…" : `Pay ${formatMWK(estimatedTotal)}`}
                </button>

                <p className="mt-3 flex items-start gap-2 text-[11px] text-[#073B78]/60">
                  <Snowflake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#073B78]/60" />
                  We use the estimated weight for payment. We weigh the fish when we pack it and tell you if the price
                  changes. We never charge more than you agreed.
                </p>
                <p className="mt-2 flex items-start gap-2 text-[11px] text-[#073B78]/60">
                  <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#073B78]/60" />
                  We keep your fish aside when you place the order. If that day is full, we ask you to choose another
                  day.
                </p>
                <p className="mt-3 text-center text-[11px] text-[#073B78]/60">
                  Already ordered?{" "}
                  <LFLink to="/lf/track" className="font-bold text-[#073B78] underline">
                    Track your order
                  </LFLink>
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
};

export default LakeFreshCheckout;
