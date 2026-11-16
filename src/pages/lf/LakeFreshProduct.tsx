import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, Check, Fish, Loader2, Minus, Plus, Snowflake, ShieldCheck, Truck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import {
  useLakeFreshCatalog,
  useLakeFreshDeliveryConfig,
} from "@/hooks/useLakeFresh";
import {
  calculateFinalPrice,
  formatCutoff,
  formatDeliveryDate,
  getEarliestDeliveryDate,
} from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const prepCopy: Record<string, { label: string; description: string }> = {
  whole: { label: "Whole", description: "Whole fish, cleaned and ready to cook." },
  cleaned: { label: "Cleaned", description: "Gutted, scaled and cleaned." },
  portioned: { label: "Portioned", description: "Cut into evenly sized portions." },
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
    setSelectedSpices((prev) => {
      if (prev.includes(spiceId)) return prev.filter((value) => value !== spiceId);
      if (prev.length >= 5) {
        toast({ title: "Up to 5 seasonings", description: "Remove one to choose another." });
        return prev;
      }
      return [...prev, spiceId];
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-gray-500">
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
        <Fish className="mx-auto h-10 w-10 text-gray-300" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Fish not found</h1>
        <p className="mt-2 text-sm text-gray-500">This fish is no longer on the catch list.</p>
        <Link
          to="/lf/fish"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
        >
          Back to the catch
        </Link>
      </div>
    );
  }

  const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
  const minWeight = product.minOrderQtyKg || 0.5;
  const effectiveWeight = Math.max(weightKg || 0, minWeight);
  const lineTotal = calculateFinalPrice(product.pricePerKgMwk, weightKg, minWeight);
  const overStock = !soldOut && product.availableKg > 0 && effectiveWeight > product.availableKg;
  const options = product.preparationOptions.length > 0 ? product.preparationOptions : ["whole"];
  const selectedPreparation = options.includes(preparation) ? preparation : options[0];
  const deliveryConfig = config;
  const earliestDate = deliveryConfig
    ? getEarliestDeliveryDate(new Date(), deliveryConfig)
    : null;

  const adjustWeight = (delta: number) => {
    setWeightKg((current) => Math.max(minWeight, Math.round((current + delta) * 1000) / 1000));
  };

  const handleAdd = () => {
    if (soldOut) return;
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
        `${effectiveWeight} kg ${product.speciesName || product.name} · ${prepCopy[selectedPreparation]?.label || selectedPreparation}`,
        extras > 0 ? `${extras} extra${extras === 1 ? "" : "s"}` : null,
        selectedRecipe ? `free recipe: ${selectedRecipe.title}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  };

  const extrasTotal = recommendedSpices
    .filter((s: any) => selectedSpices.includes(s.id))
    .reduce((sum: number, s: any) => sum + (s.price_mwk || 0), 0);
  const extrasCount = selectedSpices.length;

  return (
    <div className="bg-white text-gray-900">
      <SEO
        brand="lake-fresh"
        title={`${product.speciesName || product.name} — Lake Fresh Fish Mart`}
        description={`${product.description || product.name} Priced ${formatMWK(product.pricePerKgMwk)} per kilogram with next-day delivery in Blantyre.`}
      />

      <section className="border-b border-gray-200 bg-[#EAF6FB]/50">
        <div className="container py-10 sm:py-14">
          <Link
            to="/lf/fish"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#073B78]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the catch
          </Link>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-[#073B78] lg:w-96">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
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
                    soldOut ? "bg-gray-100 text-gray-500" : "bg-[#39B54A]/10 text-[#39B54A]"
                  }`}
                >
                  {soldOut ? "Sold out" : `${product.availableKg.toFixed(1)} kg available`}
                </span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
                {product.speciesName || product.name}
              </h1>
              <p className="mt-3 leading-relaxed text-gray-600">{product.description}</p>

              <p className="mt-4 text-sm text-gray-600">
                <span className="font-bold uppercase tracking-wide text-[#073B78]">Price:</span>{" "}
                {formatMWK(product.pricePerKgMwk)} per kilogram · minimum {minWeight} kg
              </p>

              {!soldOut && (
                <div className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Weight</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustWeight(-0.5)}
                        disabled={weightKg <= minWeight}
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
                          value={weightKg}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setWeightKg(Number.isFinite(value) ? Math.max(minWeight, value) : minWeight);
                          }}
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-lg font-bold text-[#073B78]"
                          aria-label="Weight in kilograms"
                        />
                        <span className="text-sm font-semibold text-gray-500">kg</span>
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
                    <p className="mt-2 text-xs text-gray-500">
                      Charged on packed weight at dispatch. Price differences are reconciled transparently.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Preparation</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {options.map((option) => {
                        const copy = prepCopy[option] || { label: option, description: "" };
                        const selected = selectedPreparation === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPreparation(option)}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              selected
                                ? "border-[#073B78] bg-[#073B78] text-white"
                                : "border-gray-200 bg-white text-[#073B78] hover:border-[#073B78]/40"
                            }`}
                          >
                            <span className="block text-sm font-bold">{copy.label}</span>
                            <span className={`mt-1 block text-[11px] ${selected ? "text-white/70" : "text-gray-500"}`}>
                              {copy.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Estimated total</p>
                      <p className="text-2xl font-extrabold text-[#073B78]">{formatMWK(lineTotal + extrasTotal)}</p>
                      <p className="text-xs text-gray-500">
                        {effectiveWeight} kg × {formatMWK(product.pricePerKgMwk)}/kg
                        {extrasCount > 0 ? ` + ${extrasCount} extra${extrasCount === 1 ? "" : "s"}` : ""}
                        {selectedRecipe ? " · free recipe" : ""}
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
                </div>
              )}

              {soldOut && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  This fish is sold out for the current batch. It will return with the next catch.
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-gray-200 p-4">
                  <Truck className="h-5 w-5 shrink-0 text-[#073B78]" />
                  <div>
                    <p className="text-sm font-bold text-[#073B78]">Next-day delivery</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {earliestDate ? (
                        <>
                          Order before {formatCutoff(deliveryConfig.cutoff)} for{" "}
                          {formatDeliveryDate(earliestDate)}.
                        </>
                      ) : (
                        "Order before the daily cut-off for next-day delivery."
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-gray-200 p-4">
                  <Snowflake className="h-5 w-5 shrink-0 text-[#073B78]" />
                  <div>
                    <p className="text-sm font-bold text-[#073B78]">Storage &amp; handling</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.storageInfo || "Keep refrigerated at 0–4°C and consume within 2 days."}
                    </p>
                  </div>
                </div>
              </div>

              {product.handlingInfo && (
                <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
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
          <h2 className="font-display text-2xl font-extrabold text-[#073B78]">COMPLETE YOUR MEAL</h2>
          <p className="mt-2 text-sm text-gray-500">
            Pick your seasonings and one free recipe. Everything you select is added with this fish.
          </p>

          {recommendedSpices.length > 0 ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  LakeFresh seasonings <span className="text-[#39B54A]">· choose up to 5</span>
                </p>
                <span className="text-[11px] font-bold text-[#073B78]">{selectedSpices.length}/5 selected</span>
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
                            selected ? "bg-[#39B54A] text-white" : "border border-gray-300 text-gray-400"
                          }`}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">{s.size_label || "Seasoning"}</span>
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Choose your free recipe <span className="text-[#39B54A]">· included with this fish</span>
                </p>
                {selectedRecipe ? (
                  <button
                    type="button"
                    onClick={() => setSelectedRecipeId(null)}
                    className="text-[11px] font-bold text-gray-500 underline hover:text-[#073B78]"
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
                      <span className="mt-1 block text-xs text-gray-500">
                        {r.prep_time_min ? `Prep ${r.prep_time_min}m` : ""}
                        {r.prep_time_min && r.cook_time_min ? " · " : ""}
                        {r.cook_time_min ? `Cook ${r.cook_time_min}m` : ""}
                      </span>
                      {r.recommended_spice ? (
                        <span className="mt-2 block text-[11px] text-[#39B54A]">Spice: {r.recommended_spice}</span>
                      ) : null}
                      {selected ? (
                        <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#2c6e12]">
                          <Check className="h-3.5 w-3.5" /> Chosen — emailed with your order
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Fish + extras</p>
                <p className="text-xl font-extrabold text-[#073B78]">{formatMWK(lineTotal + extrasTotal)}</p>
                <p className="text-xs text-gray-500">
                  {extrasCount} extra{extrasCount === 1 ? "" : "s"}
                  {extrasCount > 0 ? ` · ${formatMWK(extrasTotal)}` : ""} ·{" "}
                  {selectedRecipe ? `free recipe: ${selectedRecipe.title}` : "choose a free recipe above"}
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
