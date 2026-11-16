import { Link } from "react-router-dom";
import { Leaf, Loader2, Package, Plus } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";

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

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Signature Spices — Lake Fresh Fish Mart" description="Lake Fresh signature fish spices and seasonings." />
      <div className="container max-w-5xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#073B78]">SIGNATURE SPICES</h1>
        <p className="mt-2 text-sm text-gray-500">Season your fish with LakeFresh blends.</p>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading spices…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((s: any) => (
              <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#073B78]">
                  {s.image ? <img src={s.image} alt={s.name} className="h-full w-full rounded-xl object-cover" /> : <Leaf className="h-10 w-10 text-[#08A9E8]" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#073B78]">{s.name}</h3>
                {s.size_label ? <p className="text-xs text-gray-500">{s.size_label}</p> : null}
                {s.description ? <p className="mt-2 line-clamp-2 text-sm text-gray-500">{s.description}</p> : null}
                <p className="mt-3 text-lg font-extrabold text-[#073B78]">{formatMWK(s.price_mwk)}</p>
                {s.stock_qty <= 0 ? (
                  <span className="mt-2 inline-block text-xs font-bold text-gray-400">Out of stock</span>
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
                      });
                      toast({ title: "Added to basket", description: s.name });
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add to basket
                  </button>
                )}
              </div>
            ))}
            {(data || []).length === 0 && (
              <p className="col-span-full text-sm text-gray-500">No spices published yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LakeFreshSpices;
