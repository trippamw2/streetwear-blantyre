import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Fish, Leaf, Loader2, Plus } from "lucide-react";
import { LFLink } from "@/components/lf/lfRouter";
import LakeFreshImageCarousel from "@/components/lf/LakeFreshImageCarousel";
import { SEO } from "@/components/SEO";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { LF_BRAND_ID, useLakeFreshCatalog } from "@/hooks/useLakeFresh";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { lfDisplayCopy } from "@/lib/lfCopy";
import { lfGalleryImages } from "@/lib/lfImages";
import { toast } from "@/hooks/use-toast";

const LakeFreshSpiceDetail = () => {
  const { id } = useParams();
  const { addUnit } = useLakeFreshCart();
  const { data: catalog } = useLakeFreshCatalog();

  const { data: spice, isLoading, isError, refetch } = useQuery({
    queryKey: ["lf", "spice", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_spices")
        .select("*")
        .eq("id", id)
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: species } = useQuery({
    queryKey: ["lf", "species"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fish_species")
        .select("id, name")
        .eq("brand_id", LF_BRAND_ID)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const images = useMemo(
    () => lfGalleryImages(spice?.image, spice?.images),
    [spice?.image, spice?.images]
  );

  const pairings = useMemo(() => {
    const ids: string[] = Array.isArray(spice?.recommended_species) ? spice.recommended_species : [];
    return ids
      .map((speciesId) => {
        const name = species?.find((item) => item.id === speciesId)?.name;
        const product = (catalog || []).find(
          (item) => item.speciesId === speciesId && item.availabilityStatus === "available"
        );
        return name ? { name, productId: product?.id ?? null } : null;
      })
      .filter(Boolean) as { name: string; productId: string | null }[];
  }, [spice?.recommended_species, species, catalog]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#073B78]/60">
        <Loader2 className="h-5 w-5 animate-spin text-[#39B54A]" /> Loading seasoning…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
        <p className="mt-2 font-semibold text-red-700">We couldn&apos;t load this seasoning.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-lg bg-[#073B78] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!spice) {
    return (
      <div className="container py-16 text-center">
        <Leaf className="mx-auto h-10 w-10 text-[#39B54A]" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Seasoning not found</h1>
        <p className="mt-2 text-sm text-[#073B78]/60">This seasoning is no longer on the list.</p>
        <LFLink
          to="/lf/spices"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
        >
          Back to seasonings
        </LFLink>
      </div>
    );
  }

  const name = lfDisplayCopy(spice.name);
  const soldOut = Number(spice.stock_qty || 0) <= 0;

  const addToBasket = () => {
    if (soldOut) return;
    addUnit({
      productId: spice.id,
      name,
      itemType: "spice",
      quantity: 1,
      unitPriceMwk: Number(spice.price_mwk || 0),
      image: images[0] || null,
      unit: spice.size_label ? lfDisplayCopy(spice.size_label) : null,
    });
    toast({ title: "Added to basket", description: name });
  };

  return (
    <div className="bg-white text-[#073B78]">
      <SEO
        brand="lake-fresh"
        title={`${name} | Lake Fresh Fish Mart`}
        description={lfDisplayCopy(spice.description) || `A Lake Fresh seasoning for fresh fish. ${formatMWK(spice.price_mwk)}.`}
      />

      <section className="border-b border-[#EAF6FB] bg-[#F4FBF7]/45">
        <div className="container py-10 sm:py-14">
          <LFLink
            to="/lf/spices"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to seasonings
          </LFLink>

          <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[28rem_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <LakeFreshImageCarousel images={images} alt={name} />
              {images.length > 1 ? (
                <p className="mt-3 text-center text-[11px] font-semibold text-[#073B78]/60">
                  Use the arrows or choose a small photo to see more.
                </p>
              ) : null}
            </div>

            <div className="min-w-0 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B54A] shadow-sm">
                <Leaf className="h-3.5 w-3.5" /> Made for lake fish
              </span>
              <h1 className="mt-4 break-words font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{name}</h1>
              <p className="mt-3 leading-relaxed text-[#073B78]/70">
                {lfDisplayCopy(spice.description) || "A Lake Fresh blend for fresh fish."}
              </p>

              <p className="mt-4 text-2xl font-extrabold">{formatMWK(spice.price_mwk)}</p>
              <p className="mt-1 text-xs text-[#073B78]/60">
                {spice.size_label ? lfDisplayCopy(spice.size_label) : "Seasoning pack"}
                {soldOut ? " Out of stock" : ` ${spice.stock_qty} in stock`}
              </p>

              {spice.ingredients ? (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">What is inside</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#073B78]/70">{lfDisplayCopy(spice.ingredients)}</p>
                </div>
              ) : null}

              {pairings.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-[#39B54A]/25 bg-[#F4FBF7] p-5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2c6e12]">
                    <Fish className="h-3.5 w-3.5 text-[#39B54A]" /> Good with this fish
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pairings.map((pairing) =>
                      pairing.productId ? (
                        <LFLink
                          key={pairing.name}
                          to={`/lf/fish/${pairing.productId}`}
                          className="rounded-full border border-[#39B54A]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#2c6e12] hover:bg-[#39B54A]/10"
                        >
                          {lfDisplayCopy(pairing.name)}
                        </LFLink>
                      ) : (
                        <span
                          key={pairing.name}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#073B78]/70"
                        >
                          {lfDisplayCopy(pairing.name)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={addToBasket}
                disabled={soldOut}
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#073B78]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="mr-2 h-4 w-4" /> {soldOut ? "Out of stock" : "Add to basket"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshSpiceDetail;
