import { Link } from "react-router-dom";
import { ArrowRight, Fish, Leaf, Loader2, Plus } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";

const accents = ["#39B54A", "#08A9E8", "#7ED321"];

const LakeFreshSpices = () => {
  const { addUnit } = useLakeFreshCart();

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
        title="Signature Spices — Lake Fresh Fish Mart"
        description="Lake Fresh signature fish spices and seasonings, paired with Chambo, Ncheni and Usipa."
      />

      <section className="relative overflow-hidden border-b border-[#F2FBEE] bg-gradient-to-br from-[#F4FBF7] via-white to-[#F7FCEB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Leaf className="h-3.5 w-3.5" /> Made for lake fish
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
            SIGNATURE SPICES
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Five blends built to lift fresh fish — not bury it. Every seasoning is matched to the fish on our catch
            list, so you always know what works.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/lf/fish"
              className="inline-flex items-center gap-2 rounded-full border border-[#073B78]/15 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#073B78]"
            >
              <Fish className="h-3.5 w-3.5 text-[#08A9E8]" /> Shop the catch
            </Link>
            <Link
              to="/lf/recipes"
              className="inline-flex items-center gap-2 rounded-full border border-[#39B54A]/30 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#2c6e12]"
            >
              Free recipes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container max-w-6xl py-12 sm:py-16">
        {isLoading ? (
          <p className="flex items-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#39B54A]" /> Loading spices…
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((s: any, index: number) => {
              const accent = accents[index % accents.length];
              const pairings = (s.recommended_species || [])
                .map((id: string) => speciesName(id))
                .filter(Boolean);
              return (
                <div
                  key={s.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#F4FBF7]">
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
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
                      {s.size_label || "Seasoning"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-extrabold text-[#073B78]">{s.name}</h3>
                    {s.description ? (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">{s.description}</p>
                    ) : (
                      <p className="mt-2 flex-1 text-sm text-gray-500">A Lake Fresh blend for fresh fish.</p>
                    )}

                    {s.ingredients ? (
                      <p className="mt-3 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
                        {s.ingredients}
                      </p>
                    ) : null}

                    {pairings.length > 0 ? (
                      <p className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-[#2c6e12]">
                        <Fish className="h-3.5 w-3.5 shrink-0 text-[#39B54A]" />
                        Pairs with {pairings.join(" · ")}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                      <p className="text-lg font-extrabold text-[#073B78]">{formatMWK(s.price_mwk)}</p>
                      {s.stock_qty <= 0 ? (
                        <span className="text-xs font-bold text-gray-400">Out of stock</span>
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
              <p className="col-span-full py-10 text-center text-sm text-gray-500">No spices published yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default LakeFreshSpices;
