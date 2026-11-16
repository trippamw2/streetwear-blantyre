import { Link } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { formatMWK } from "@/data/products";

const LakeFreshReadyToCook = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["lf", "ready-to-cook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_ready_to_cook")
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
      <SEO brand="lake-fresh" title="Ready to Cook — Lake Fresh Fish Mart" description="Ready-to-cook fish products from Lake Fresh." />
      <div className="container max-w-5xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">READY TO COOK</h1>
        <p className="mt-2 text-sm text-gray-500">Convenient fish products ready for your kitchen.</p>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((p: any) => (
              <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#0a2540]">
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full rounded-xl object-cover" /> : <Package className="h-10 w-10 text-[#22d3ee]" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#0a2540]">{p.name}</h3>
                {p.size_label ? <p className="text-xs text-gray-500">{p.size_label}</p> : null}
                {p.description ? <p className="mt-2 line-clamp-2 text-sm text-gray-500">{p.description}</p> : null}
                <p className="mt-3 text-lg font-extrabold text-[#0a2540]">{formatMWK(p.price_mwk)}</p>
                {p.storage_info ? <p className="mt-2 text-xs text-gray-500">Storage: {p.storage_info}</p> : null}
                {p.cooking_info ? <p className="mt-1 text-xs text-gray-500">Cooking: {p.cooking_info}</p> : null}
                {p.stock_qty <= 0 ? (
                  <span className="mt-2 inline-block text-xs font-bold text-gray-400">Out of stock</span>
                ) : (
                  <span className="mt-2 inline-block text-xs font-bold text-emerald-600">In stock · {p.stock_qty}</span>
                )}
              </div>
            ))}
            {(data || []).length === 0 && (
              <p className="col-span-full text-sm text-gray-500">No ready-to-cook products published yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LakeFreshReadyToCook;
