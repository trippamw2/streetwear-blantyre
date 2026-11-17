import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Download, Fish, Leaf, Loader2, ShoppingBasket, Sparkles, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID, useLakeFreshCatalog } from "@/hooks/useLakeFresh";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { lfDisplayCopy } from "@/lib/lfCopy";
import { isPilotSpeciesSlug } from "@/lib/lfPilot";

type ShopItem = {
  id: string;
  kind: "fish" | "spice";
  name: string;
  match: string;
  linkTo: string;
  price: number;
  weightKg: number;
  minWeightKg: number;
  preparationOptions: string[];
  image: string | null;
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/lake\s*fresh|lakefresh/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(spice|seasoning|blend|fish)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const weightFromIngredient = (ingredient: string, fallback: number) => {
  const match = ingredient.match(/([\d.]+)\s*(kg|g)\b/i);
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return fallback;
  return /^\s*g\b/i.test(match[2]) ? amount / 1000 : amount;
};

const LakeFreshRecipe = () => {
  const { slug } = useParams();
  const { add, addUnit } = useLakeFreshCart();
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["lf", "recipe", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_recipes")
        .select("*, fish_species(name, slug)")
        .eq("brand_id", LF_BRAND_ID)
        .eq("slug", slug as string)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Recipe not found");
      if (!isPilotSpeciesSlug((data as any).fish_species?.slug)) throw new Error("Recipe not found");
      return data;
    },
  });

  const { data: products } = useLakeFreshCatalog();

  const { data: spices } = useQuery({
    queryKey: ["lf", "spices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_spices")
        .select("id, name, price_mwk, size_label, stock_qty, image")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const ingredients = Array.isArray(data?.ingredients)
    ? (data.ingredients as string[]).map((value) => lfDisplayCopy(value))
    : [];
  const steps = Array.isArray(data?.steps)
    ? (data.steps as string[]).map((value) => lfDisplayCopy(value))
    : [];
  const stepAccents = ["#39B54A", "#08A9E8", "#7ED321"];

  // Build shoppable items by matching ingredient lines to live catalogue products.
  const shopItems = useMemo<ShopItem[]>(() => {
    if (!data) return [];
    const items: ShopItem[] = [];
    const speciesName = String((data as any).fish_species?.name || "");
    const speciesKey = normalise(speciesName);

    // Fish: match the recipe species to an available catalog product.
    const fishIngredient = ingredients.find((ing) => speciesKey && normalise(ing).includes(speciesKey)) || ingredients[0] || "";
    const fishProduct = (products || []).find(
      (p) => p.availabilityStatus === "available" && normalise(p.speciesName || p.name).includes(speciesKey)
    );
    if (fishProduct && speciesKey) {
      items.push({
        id: `fish-${fishProduct.id}`,
        kind: "fish",
        name: speciesName || fishProduct.name,
        match: fishIngredient,
        linkTo: `/lf/fish/${fishProduct.id}`,
        price: fishProduct.pricePerKgMwk,
        weightKg: Math.max(fishProduct.minOrderQtyKg, weightFromIngredient(fishIngredient, fishProduct.minOrderQtyKg)),
        minWeightKg: fishProduct.minOrderQtyKg,
        preparationOptions: fishProduct.preparationOptions,
        image: fishProduct.image,
      });
    }

    // Spices: match the recommended spice and any ingredient that names a spice.
    const spiceCandidates = [String((data as any).recommended_spice || ""), ...ingredients].filter(Boolean);
    const matchedSpiceIds = new Set<string>();
    for (const candidate of spiceCandidates) {
      const key = normalise(candidate);
      if (!key) continue;
      const spice = (spices || []).find((s) => {
        const sKey = normalise(s.name);
        return sKey && (key.includes(sKey) || sKey.includes(key) || key.split(" ").every((word) => word.length > 2 && sKey.includes(word)));
      });
      if (spice && !matchedSpiceIds.has(spice.id)) {
        matchedSpiceIds.add(spice.id);
        items.push({
          id: `spice-${spice.id}`,
          kind: "spice",
          name: spice.name,
          match: candidate,
          linkTo: "/lf/spices",
          price: Number(spice.price_mwk),
          weightKg: 1,
          minWeightKg: 1,
          preparationOptions: [],
          image: spice.image || null,
        });
      }
    }
    return items;
  }, [data, products, spices, ingredients.join("|")]);

  // Default all matched items to selected whenever the recipe changes.
  const activeIds = shopItems.map((item) => item.id).join("|");
  useEffect(() => {
    if (shopItems.length > 0) setSelected(shopItems.map((item) => item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const linkedForIngredient = (ingredient: string): ShopItem | undefined => {
    const exact = shopItems.find((item) => item.match === ingredient);
    if (exact) return exact;
    const key = normalise(ingredient);
    if (!key) return undefined;
    return shopItems.find((item) => {
      const nameKey = normalise(item.name);
      return nameKey && (key.includes(nameKey) || nameKey.includes(key));
    });
  };

  const addSelected = () => {
    const chosen = shopItems.filter((item) => selected.includes(item.id));
    if (chosen.length === 0) {
      toast({ title: "Choose at least one item", variant: "destructive" });
      return;
    }
    chosen.forEach((item) => {
      if (item.kind === "fish") {
        add({
          productId: item.id.replace("fish-", ""),
          name: item.name,
          speciesName: item.name,
          weightKg: item.weightKg,
          preparation: "whole",
          pricePerKgMwk: item.price,
          minOrderQtyKg: item.minWeightKg,
          preparationOptions: item.preparationOptions,
          image: item.image,
          recipeId: (data as any)?.id || null,
          recipeTitle: (data as any)?.title || null,
        });
      } else {
        addUnit({
          productId: item.id.replace("spice-", ""),
          name: item.name,
          itemType: "spice",
          quantity: 1,
          unitPriceMwk: item.price,
          image: item.image,
        });
      }
    });
    toast({ title: "Added to basket", description: `${chosen.length} ingredient${chosen.length === 1 ? "" : "s"} from this recipe.` });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#073B78]/60">
        <Loader2 className="h-5 w-5 animate-spin text-[#08A9E8]" /> Loading recipe…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-[#073B78]/40" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Recipe not available</h1>
        <p className="mt-2 text-sm text-[#073B78]/60">{error instanceof Error ? error.message : "We could not load this recipe."}</p>
        <LFLink
          to="/lf/recipes"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white"
        >
          All recipes
        </LFLink>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title={`${lfDisplayCopy(data.title)} | Lake Fresh Fish Mart`} description="Lake Fresh fish recipe." />

      <section className="border-b border-[#EAF6FB] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div className="container max-w-4xl py-10 sm:py-14">
          <LFLink
            to="/lf/recipes"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All recipes
          </LFLink>

          <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_1.05fr] sm:items-center">
            <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF6FB]">
              {data.image ? (
                <img src={data.image} alt={data.title} className="h-full w-full object-cover" decoding="async" />
              ) : (
                <BookOpen className="h-16 w-16 text-[#08A9E8]" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-[#7ED321] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]">
                Free with fish
              </span>
            </div>

            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B54A]">
                <Fish className="h-3.5 w-3.5" /> {lfDisplayCopy(data.fish_species?.name) || "Fish recipe"}
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#073B78] sm:text-4xl">
                {lfDisplayCopy(data.title)}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#073B78]/70">
                {data.prep_time_min ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-[#08A9E8]" /> Get ready {data.prep_time_min} min
                  </span>
                ) : null}
                {data.cook_time_min ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-[#39B54A]" /> Cook {data.cook_time_min} min
                  </span>
                ) : null}
                {data.servings ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                    <Users className="h-3.5 w-3.5 text-[#7ED321]" /> Serves {data.servings}
                  </span>
                ) : null}
                {data.cooking_method ? (
                  <span className="inline-flex items-center rounded-full bg-[#073B78] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    {lfDisplayCopy(data.cooking_method)}
                  </span>
                ) : null}
              </div>

              {data.pdf_url ? (
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#073B78]/20 bg-white px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78] shadow-sm transition-colors hover:border-[#073B78]"
                >
                  <Download className="h-3.5 w-3.5" /> Download recipe
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container max-w-3xl py-10 sm:py-14">
        <div className="rounded-2xl border border-[#7ED321]/40 bg-[#F4FBF7] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#39B54A]" />
            <div>
              <p className="text-sm font-extrabold text-[#073B78]">This recipe is free with your fish order.</p>
              <p className="mt-1 text-xs text-[#073B78]/60">Pick it on any {lfDisplayCopy(data.fish_species?.name) || "fish"} page and we add it to your order.</p>
            </div>
          </div>
          <LFLink
            to="/lf/fish"
            className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#39B54A] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white sm:mt-0"
          >
            Shop fish <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>

        {shopItems.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-[#08A9E8]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
                  <ShoppingBasket className="h-4 w-4 text-[#08A9E8]" /> Shop ingredients
                </h2>
                <p className="mt-1 text-xs text-[#073B78]/60">Tick what you need and add it to your basket in one tap.</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EAF6FB] px-2.5 py-1 text-[10px] font-extrabold text-[#073B78]">
                {selected.length}/{shopItems.length} chosen
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {shopItems.map((item) => {
                const checked = selected.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      checked ? "border-[#39B54A] bg-[#F4FBF7]" : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#39B54A]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#073B78]">{item.name}</p>
                      <p className="truncate text-[11px] text-[#073B78]/60">
                        {item.kind === "fish" ? `${item.weightKg} kg. Priced per kg` : "Spice blend"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-[#073B78]">
                      {item.kind === "fish" ? `${formatMWK(item.price)}/kg` : formatMWK(item.price)}
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addSelected}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              <Check className="h-4 w-4" /> Add selected to basket
            </button>
            <p className="mt-2 text-center text-[11px] text-[#073B78]/60">The recipe card stays free. You only pay for the items you tick.</p>
          </section>
        ) : null}

        {data.recommended_spice ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#39B54A]/25 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#39B54A]/10 text-[#39B54A]">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Best spice</p>
                <p className="text-sm font-bold text-[#073B78]">{lfDisplayCopy(data.recommended_spice)}</p>
              </div>
            </div>
            <LFLink
              to="/lf/spices"
              className="text-[10px] font-extrabold uppercase tracking-widest text-[#2c6e12] underline underline-offset-4"
            >
              Shop seasonings
            </LFLink>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-[#39B54A]/20 bg-[#F4FBF7] p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#39B54A] text-white">
                <Leaf className="h-3.5 w-3.5" />
              </span>
              Ingredients
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[#073B78]/80">
              {ingredients.map((ing: string, idx: number) => {
                const linked = linkedForIngredient(ing);
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39B54A]" />
                    <span>
                      {linked ? (
                        <LFLink to={linked.linkTo} className="font-bold text-[#2c6e12] underline underline-offset-2">
                          {ing}
                        </LFLink>
                      ) : (
                        ing
                      )}
                    </span>
                  </li>
                );
              })}
              {ingredients.length === 0 && <li className="text-[#073B78]/60">No ingredients listed.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-[#073B78]">Steps</h2>
            <ol className="mt-4 space-y-4">
              {steps.map((step: string, idx: number) => (
                <li key={idx} className="flex gap-3">
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ backgroundColor: stepAccents[idx % stepAccents.length] }}
                  >
                    {idx + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-[#073B78]/80">{step}</p>
                </li>
              ))}
              {steps.length === 0 && <li className="text-sm text-[#073B78]/60">No steps listed.</li>}
            </ol>
          </section>
        </div>

        {data.safety_notes ? (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-display text-lg font-extrabold text-amber-900">Safe food</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">{lfDisplayCopy(data.safety_notes)}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default LakeFreshRecipe;
