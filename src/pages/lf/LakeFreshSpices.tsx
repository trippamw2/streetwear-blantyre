import { LFLink } from "@/components/lf/lfRouter";
import LakeFreshImageCarousel from "@/components/lf/LakeFreshImageCarousel";
import { ArrowRight, Fish, Leaf, Loader2, Plus } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID, useLakeFreshCatalog } from "@/hooks/useLakeFresh";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { lfDisplayCopy } from "@/lib/lfCopy";
import { lfGalleryImages } from "@/lib/lfImages";

const accents = ["#39B54A", "#08A9E8", "#7ED321"];

const LakeFreshSpices = () => {
  const { addUnit } = useLakeFreshCart();
  const { data: catalog } = useLakeFreshCatalog();

  const { data, isLoading } = useQuery({
    queryKey: ["lf", "spices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_spices")
        .select("*")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
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

  const speciesName = (id: string) => species?.find((item) => item.id === id)?.name;

  return (
    <div className="bg-white">
      <SEO
        brand="lake-fresh"
        title="Seasonings | Lake Fresh Fish Mart"
        description="Five seasonings made for lake fish. Pick one for Chambo, Micheni or Usipa."
      />

      <section className="relative overflow-hidden border-b border-[#F2FBEE] bg-gradient-to-br from-[#F4FBF7] via-white to-[#F7FCEB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Leaf className="h-3.5 w-3.5" /> Made for lake fish
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
            SEASONINGS
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#073B78]/70 sm:text-base">
            Pick a seasoning that suits your fish. We make five seasonings for lake fish and show which ones go with
            each catch, so your meal is easy to plan.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LFLink
              to="/lf/fish"
              className="inline-flex items-center gap-2 rounded-full border border-[#073B78]/15 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#073B78]"
            >
              <Fish className="h-3.5 w-3.5 text-[#08A9E8]" /> See the three options
            </LFLink>
            <LFLink
              to="/lf/recipes"
              className="inline-flex items-center gap-2 rounded-full border border-[#39B54A]/30 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#2c6e12]"
            >
              Free recipes <ArrowRight className="h-3.5 w-3.5" />
            </LFLink>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#073B78] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Fish className="h-3.5 w-3.5 text-[#7ED321]" /> We know which seasoning works with each fish
            </p>
          </div>
        </div>
      </section>

      <section className="container max-w-6xl py-12 sm:py-16">
        {isLoading ? (
          <p className="flex items-center gap-2 py-10 text-sm text-[#073B78]/60">
            <Loader2 className="h-4 w-4 animate-spin text-[#39B54A]" /> Loading spices…
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((s: any, index: number) => {
              const accent = accents[index % accents.length];
              const images = lfGalleryImages(s.image, s.images);
              const pairings = (s.recommended_species || [])
                .map((id: string) => ({ id, name: speciesName(id) }))
                .filter((p: { name?: string }) => Boolean(p.name));
              const pairedProducts = pairings
                .map((p: { id: string; name?: string }) => {
                  const product = (catalog || []).find((c) => c.speciesId === p.id && c.availabilityStatus === "available");
                  return product ? { name: p.name, linkTo: `/lf/fish/${product.id}` } : null;
                })
                .filter(Boolean) as { name?: string; linkTo: string }[];
              return (
                <div
                  key={s.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <LFLink
                    to={`/lf/spices/${s.id}`}
                    aria-label={`See photos of ${lfDisplayCopy(s.name)}`}
                    className="relative flex h-36 items-center justify-center overflow-hidden bg-[#F4FBF7]"
                  >
                    {images.length > 0 ? (
                      <LakeFreshImageCarousel images={images} alt={s.name} coverOnly />
                    ) : (
                      <>
                        <div
                          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
                          style={{ backgroundColor: accent }}
                        />
                        <span
                          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm"
                          style={{ color: accent }}
                        >
                          <Leaf className="h-8 w-8" />
                        </span>
                      </>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">
                      {lfDisplayCopy(s.size_label) || "Spice blend"}
                    </span>
                  </LFLink>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-extrabold text-[#073B78]">
                      <LFLink to={`/lf/spices/${s.id}`} className="hover:text-[#39B54A]">
                        {lfDisplayCopy(s.name)}
                      </LFLink>
                    </h3>
                    {s.description ? (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#073B78]/60">{lfDisplayCopy(s.description)}</p>
                    ) : (
                      <p className="mt-2 flex-1 text-sm text-[#073B78]/60">A Lake Fresh blend for fresh fish.</p>
                    )}

                    {s.ingredients ? (
                      <p className="mt-3 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-[#073B78]/60">
                        {lfDisplayCopy(s.ingredients)}
                      </p>
                    ) : null}

                    {pairings.length > 0 ? (
                      <div className="mt-3">
                        <p className="flex flex-wrap items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#2c6e12]">
                          <Fish className="h-3.5 w-3.5 shrink-0 text-[#39B54A]" /> Good with this fish
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {pairedProducts.length > 0
                            ? pairedProducts.map((p) => (
                                <LFLink
                                  key={p.linkTo}
                                  to={p.linkTo}
                                  className="rounded-full border border-[#39B54A]/30 bg-[#F4FBF7] px-2.5 py-1 text-[11px] font-bold text-[#2c6e12] hover:bg-[#39B54A]/10"
                                >
                                  {p.name}
                                </LFLink>
                              ))
                            : pairings.map((p) => (
                                <span key={p.id} className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] text-[#073B78]/70">
                                  {p.name}
                                </span>
                              ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                      <p className="text-lg font-extrabold text-[#073B78]">{formatMWK(s.price_mwk)}</p>
                      {s.stock_qty <= 0 ? (
                        <span className="text-xs font-bold text-[#073B78]/50">Out of stock</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addUnit({
                              productId: s.id,
                              name: s.name,
                              itemType: "spice",
                              quantity: 1,
                              unitPriceMwk: s.price_mwk,
                              image: s.image,
                              unit: s.size_label,
                            });
                            toast({ title: "Added to basket", description: s.name });
                          }}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white transition-transform hover:-translate-y-0.5"
                          style={{ backgroundColor: accent }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {(data || []).length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-[#073B78]/60">No spices published yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default LakeFreshSpices;
