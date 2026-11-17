import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { ArrowLeft, AlertCircle, Check, Fish, Loader2, Minus, Plus, Snowflake, ShieldCheck, Truck, PackageCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import {
  useLakeFreshCatalog,
  useLakeFreshDeliveryConfig,
} from "@/hooks/useLakeFresh";
import {
  calculateFinalPrice,
  formatDeliveryDate,
  getEarliestDeliveryDate,
} from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";
import { lfDisplayCopy } from "@/lib/lfCopy";
import { LF_PILOT_DELIVERY_PROMISE, LF_PILOT_ZONE_NAMES } from "@/lib/lfPilot";

const prepCopy: Record<string, { label: string; description: string }> = {
  whole: { label: "Whole, cleaned", description: "We scale and clean the whole fish for you." },
  filleted: { label: "Fillets", description: "Boneless fish pieces for your pan." },
  steak: { label: "Steaks", description: "Thick cuts for grilling or frying." },
  uncleaned: { label: "Whole as caught", description: "Whole fish left as it was caught." },
  cleaned: { label: "Cleaned", description: "Scaled and cleaned for your pan." },
  portioned: { label: "Cleaned and cut", description: "We clean the fish and cut it into even pieces." },
  seasoned: { label: "Seasoned", description: "We season the cleaned fish with your chosen spice." },
};

const LakeFreshProduct = () => {
  const { id } = useParams();
  const { data: products, isLoading, isError, refetch } = useLakeFreshCatalog();
  const { data: config } = useLakeFreshDeliveryConfig();
  const { add, addUnit } = useLakeFreshCart();

  const { data: spices } = useQuery({
    queryKey: ["lf", "spices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_spices")
        .select("id, name, price_mwk, size_label, stock_qty, recommended_species")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ["lf", "recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_recipes")
        .select("id, title, slug, species_id, prep_time_min, cook_time_min, recommended_spice")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const product = useMemo(() => products?.find((item) => item.id === id), [products, id]);
  const [weightKg, setWeightKg] = useState(0.5);
  const [preparation, setPreparation] = useState("whole");
  const [selectedSpices, setSelectedSpices] = useState<string[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSpices([]);
    setSelectedRecipeId(null);
    setWeightKg(0.5);
    setPreparation("whole");
  }, [id]);

  useEffect(() => {
    if (product) setWeightKg(product.minOrderQtyKg || 0.5);
  }, [product?.id, product?.minOrderQtyKg]);

  const recommendedSpices = useMemo(
    () => (spices || []).filter((s: any) => (s.recommended_species || []).includes(product?.speciesId)),
    [spices, product?.speciesId]
  );
  const recommendedRecipes = useMemo(
    () => (recipes || []).filter((r: any) => r.species_id === product?.speciesId),
    [recipes, product?.speciesId]
  );
  const selectedRecipe = recommendedRecipes.find((r: any) => r.id === selectedRecipeId) || null;

  const toggleSpice = (spiceId: string) => {
    const limit = preparation === "seasoned" ? 1 : 5;
    setSelectedSpices((prev) => {
      if (prev.includes(spiceId)) return prev.filter((value) => value !== spiceId);
      if (prev.length >= limit) {
        toast({
          title: preparation === "seasoned" ? "Choose one seasoning" : "Pick up to 5 seasonings",
          description: "Remove one to choose another.",
        });
        return prev;
      }
      return [...prev, spiceId];
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#073B78]/60">
        <Loader2 className="h-5 w-5 animate-spin text-[#073B78]" /> Loading fish…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
        <p className="mt-2 font-semibold text-red-700">We couldn&apos;t load this fish.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-[#073B78] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <Fish className="mx-auto h-10 w-10 text-[#073B78]/40" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Fish not found</h1>
        <p className="mt-2 text-sm text-[#073B78]/60">This fish is no longer on the catch list.</p>
        <LFLink
          to="/lf/fish"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
        >
          Back to the catch
        </LFLink>
      </div>
    );
  }

  const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
  const minWeight = product.minOrderQtyKg || 0.5;
  const effectiveWeight = Math.max(weightKg || 0, minWeight);
  const lineTotal = calculateFinalPrice(product.pricePerKgMwk, weightKg, minWeight);
  const overStock = !soldOut && product.availableKg > 0 && effectiveWeight > product.availableKg;
  const options = product.preparationOptions.length > 0
    ? product.preparationOptions
    : ["whole", "cleaned", "portioned", "seasoned"];
  const selectedPreparation = options.includes(preparation) ? preparation : options[0];
  const deliveryConfig = config;
  const earliestDate = deliveryConfig
    ? getEarliestDeliveryDate(new Date(), deliveryConfig)
    : null;

  const adjustWeight = (delta: number) => {
    setWeightKg(Math.max(minWeight, Math.round((effectiveWeight + delta) * 1000) / 1000));
  };

  const handleAdd = () => {
    if (soldOut) return;
    if (selectedPreparation === "seasoned" && selectedSpices.length !== 1) {
      toast({
        title: "Choose one seasoning",
        description: "Pick the seasoning you want on this fish.",
      });
      return;
    }
    if (overStock) {
      toast({
        title: "Not enough stock",
        description: `Only ${product.availableKg.toFixed(1)} kg is available right now.`,
        variant: "destructive",
      });
      return;
    }
    add({
      productId: product.id,
      name: product.name,
      speciesName: product.speciesName || product.name,
      weightKg: effectiveWeight,
      preparation: selectedPreparation,
      pricePerKgMwk: product.pricePerKgMwk,
      minOrderQtyKg: minWeight,
      preparationOptions: options,
      image: product.image,
      recipeId: selectedRecipe?.id ?? null,
      recipeTitle: selectedRecipe?.title ?? null,
    });

    const chosenSpices = recommendedSpices.filter((s: any) => selectedSpices.includes(s.id));

    chosenSpices.forEach((s: any) => {
      addUnit({
        productId: s.id,
        name: s.name,
        itemType: "spice",
        quantity: 1,
        unitPriceMwk: s.price_mwk,
        image: s.image,
        unit: s.size_label,
      });
    });

    const extras = chosenSpices.length;
    toast({
      title: "Added to basket",
      description: [
        `${effectiveWeight} kg ${lfDisplayCopy(product.speciesName || product.name)}. ${prepCopy[selectedPreparation]?.label || selectedPreparation}`,
        extras > 0 ? `${extras} extra${extras === 1 ? "" : "s"}` : null,
        selectedRecipe ? `free recipe: ${selectedRecipe.title}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  };

  const extrasTotal = recommendedSpices
    .filter((s: any) => selectedSpices.includes(s.id))
    .reduce((sum: number, s: any) => sum + (s.price_mwk || 0), 0);
  const extrasCount = selectedSpices.length;

  return (
    <div className="bg-white text-[#073B78]">
      <SEO
        brand="lake-fresh"
        title={`${product.speciesName || product.name} | Lake Fresh Fish Mart`}
        description={`${lfDisplayCopy(product.description) || product.name} ${formatMWK(product.pricePerKgMwk)} per kilogram. ${LF_PILOT_DELIVERY_PROMISE} in ${LF_PILOT_ZONE_NAMES}.`}
      />

      <section className="border-b border-gray-200 bg-[#EAF6FB]/50">
        <div className="container py-10 sm:py-14">
          <LFLink
            to="/lf/fish"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the catch
          </LFLink>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-[#073B78] lg:w-96">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  decoding="async"
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <Fish className="h-20 w-20 text-[#08A9E8]" />
              )}
            </div>

            <div className="max-w-2xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 border border-[#073B78]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#073B78]">
                  <Fish className="h-3.5 w-3.5" /> {product.speciesName || "Fresh Fish"}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                    soldOut ? "bg-gray-100 text-[#073B78]/60" : "bg-[#39B54A]/10 text-[#39B54A]"
                  }`}
                >
                  {soldOut ? "Sold out" : `${product.availableKg.toFixed(1)} kg available`}
                </span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
                {product.speciesName || product.name}
              </h1>
              <p className="mt-3 leading-relaxed text-[#073B78]/70">{lfDisplayCopy(product.description)}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#073B78]/70">
                We know Lake Malawi fish. Pick what you like and we clean, weigh and pack it with care for you.
              </p>

              <p className="mt-4 text-sm text-[#073B78]/70">
                <span className="font-bold uppercase tracking-wide text-[#073B78]">Price:</span>{" "}
                {formatMWK(product.pricePerKgMwk)} per kilogram. At least {minWeight} kg
              </p>

              {!soldOut && (
                <div className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Weight</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustWeight(-0.5)}
                        disabled={effectiveWeight <= minWeight}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-[#073B78] disabled:opacity-40"
                        aria-label="Reduce weight"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          min={minWeight}
                          step={0.5}
                          value={effectiveWeight}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setWeightKg(Number.isFinite(value) ? Math.max(minWeight, value) : minWeight);
                          }}
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-lg font-bold text-[#073B78]"
                          aria-label="Weight in kilograms"
                        />
                        <span className="text-sm font-semibold text-[#073B78]/60">kg</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustWeight(0.5)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-[#073B78]"
                        aria-label="Increase weight"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#073B78]/60">
                      We weigh the fish when we pack it and adjust the price before you pay.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Cut</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {options.map((option) => {
                        const copy = prepCopy[option] || { label: option, description: "" };
                        const selected = selectedPreparation === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setPreparation(option);
                              if (option === "seasoned") setSelectedSpices((prev) => prev.slice(0, 1));
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              selected
                                ? "border-[#073B78] bg-[#073B78] text-white"
                                : "border-gray-200 bg-white text-[#073B78] hover:border-[#073B78]/40"
                            }`}
                          >
                            <span className="block text-sm font-bold">{copy.label}</span>
                            <span className={`mt-1 block text-[11px] ${selected ? "text-white/70" : "text-[#073B78]/60"}`}>
                              {copy.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#39B54A]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#39B54A]">
                      <PackageCheck className="h-3.5 w-3.5" /> {LF_PILOT_DELIVERY_PROMISE}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#08A9E8]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#073B78]">
                      If something is wrong, tell us
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Your total</p>
                      <p className="text-2xl font-extrabold text-[#073B78]">{formatMWK(lineTotal + extrasTotal)}</p>
                      <p className="text-xs text-[#073B78]/60">
                        {effectiveWeight} kg at {formatMWK(product.pricePerKgMwk)} per kg
                        {extrasCount > 0 ? ` plus ${extrasCount} seasoning${extrasCount === 1 ? "" : "s"}` : ""}
                        {selectedRecipe ? ". Free recipe" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={overStock}
                      className="inline-flex items-center justify-center rounded-lg bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#073B78]/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {overStock ? "Not enough stock" : extrasCount > 0 ? `Add fish + ${extrasCount} extras` : "Add to basket"}
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#39B54A]/25 bg-[#F4FBF7] p-3 text-xs text-[#073B78]">
                    <span className="font-extrabold">Need help?</span> If your fish is not right, message us on WhatsApp
                    and we will help.
                  </div>
                </div>
              )}

              {soldOut && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-[#073B78]/70">
                  This fish is sold out for the current batch. It will return with the next catch.
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-gray-200 p-4">
                  <Truck className="h-5 w-5 shrink-0 text-[#073B78]" />
                  <div>
                    <p className="text-sm font-bold text-[#073B78]">Next day delivery</p>
                    <p className="mt-1 text-xs text-[#073B78]/60">
                      {earliestDate ? (
                        <>
                          {LF_PILOT_DELIVERY_PROMISE} in {LF_PILOT_ZONE_NAMES}. Next delivery day:{" "}
                          {formatDeliveryDate(earliestDate)}.
                        </>
                      ) : (
                        LF_PILOT_DELIVERY_PROMISE
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-gray-200 p-4">
                  <Snowflake className="h-5 w-5 shrink-0 text-[#073B78]" />
                  <div>
                    <p className="text-sm font-bold text-[#073B78]">Keep it cold</p>
                    <p className="mt-1 text-xs text-[#073B78]/60">
                      {product.storageInfo || "Keep it cold at 0 to 4°C and eat within 2 days."}
                    </p>
                  </div>
                </div>
              </div>

              {product.handlingInfo && (
                <p className="mt-4 flex items-start gap-2 text-xs text-[#073B78]/60">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#073B78]/60" />
                  {product.handlingInfo}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-[#EAF6FB]/40">
        <div className="container py-12 sm:py-16">
          <h2 className="font-display text-2xl font-extrabold text-[#073B78]">MAKE THIS FISH YOUR WAY</h2>
          <p className="mt-2 text-sm text-[#073B78]/60">
            Pick a seasoning and one free recipe. We add what you choose to this fish.
          </p>

          {recommendedSpices.length > 0 ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
                  Seasonings for this fish{" "}
                  <span className="text-[#39B54A]">
                    {selectedPreparation === "seasoned" ? "Choose one" : "Pick up to 5"}
                  </span>
                </p>
                <span className="text-[11px] font-bold text-[#073B78]">
                  {selectedSpices.length}/{selectedPreparation === "seasoned" ? 1 : 5} selected
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {recommendedSpices.map((s: any) => {
                  const selected = selectedSpices.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSpice(s.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? "border-[#39B54A] bg-[#7ED321]/10 ring-1 ring-[#39B54A]"
                          : "border-gray-200 bg-white hover:border-[#08A9E8]/50"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-display text-base font-extrabold text-[#073B78]">{s.name}</span>
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            selected ? "bg-[#39B54A] text-white" : "border border-gray-300 text-[#073B78]/50"
                          }`}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-[#073B78]/60">{s.size_label || "Seasoning"}</span>
                      <span className="mt-2 block text-sm font-bold text-[#073B78]">{formatMWK(s.price_mwk)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {recommendedRecipes.length > 0 ? (
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">
                  Free recipes for this fish <span className="text-[#39B54A]">Choose one</span>
                </p>
                {selectedRecipe ? (
                  <button
                    type="button"
                    onClick={() => setSelectedRecipeId(null)}
                    className="text-[11px] font-bold text-[#073B78]/60 underline hover:text-[#073B78]"
                  >
                    Clear recipe
                  </button>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedRecipes.map((r: any) => {
                  const selected = selectedRecipeId === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setSelectedRecipeId(selected ? null : r.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? "border-[#39B54A] bg-[#7ED321]/10 ring-1 ring-[#39B54A]"
                          : "border-gray-200 bg-white hover:border-[#08A9E8]/50"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-display text-base font-extrabold text-[#073B78]">{r.title}</span>
                        <span className="rounded-full bg-[#7ED321]/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#2c6e12]">
                          Free
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-[#073B78]/60">
                        {r.prep_time_min ? `Get ready ${r.prep_time_min} min` : ""}
                        {r.prep_time_min && r.cook_time_min ? " " : ""}
                        {r.cook_time_min ? `Cook ${r.cook_time_min} min` : ""}
                      </span>
                      {r.recommended_spice ? (
                        <span className="mt-2 block text-[11px] text-[#39B54A]">Spice: {r.recommended_spice}</span>
                      ) : null}
                      {selected ? (
                        <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#2c6e12]">
                          <Check className="h-3.5 w-3.5" /> Chosen. It comes with your order.
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!soldOut ? (
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#08A9E8]/30 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Fish and seasonings</p>
                <p className="text-xl font-extrabold text-[#073B78]">{formatMWK(lineTotal + extrasTotal)}</p>
                <p className="text-xs text-[#073B78]/60">
                  {extrasCount} extra{extrasCount === 1 ? "" : "s"}
                  {extrasCount > 0 ? ` ${formatMWK(extrasTotal)}` : ""}{" "}
                  {selectedRecipe ? `Free recipe: ${selectedRecipe.title}` : "choose one free recipe above"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={overStock}
                className="inline-flex items-center justify-center rounded-lg bg-[#39B54A] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2c8f38] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {overStock ? "Not enough stock" : "Add fish + extras to basket"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

    </div>
  );
};

export default LakeFreshProduct;
