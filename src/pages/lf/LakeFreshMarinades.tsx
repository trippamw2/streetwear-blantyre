import { Link } from "react-router-dom";
import { Droplets, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { formatMWK } from "@/data/products";

const LakeFreshMarinades = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["lf", "marinades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_marinades")
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
      <SEO brand="lake-fresh" title="Marinades — Lake Fresh Fish Mart" description="Lake Fresh marinades for fish." />
      <div className="container max-w-5xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">MARINADES</h1>
        <p className="mt-2 text-sm text-gray-500">Marinate your fish with LakeFresh blends.</p>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading marinades…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((m: any) => (
              <div key={m.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#0a2540]">
                  {m.image ? <img src={m.image} alt={m.name} className="h-full w-full rounded-xl object-cover" /> : <Droplets className="h-10 w-10 text-[#22d3ee]" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#0a2540]">{m.name}</h3>
                {m.size_label ? <p className="text-xs text-gray-500">{m.size_label}</p> : null}
                {m.description ? <p className="mt-2 line-clamp-2 text-sm text-gray-500">{m.description}</p> : null}
                <p className="mt-3 text-lg font-extrabold text-[#0a2540]">{formatMWK(m.price_mwk)}</p>
                {m.stock_qty <= 0 ? (
                  <span className="mt-2 inline-block text-xs font-bold text-gray-400">Out of stock</span>
                ) : (
                  <span className="mt-2 inline-block text-xs font-bold text-emerald-600">In stock · {m.stock_qty}</span>
                )}
              </div>
            ))}
            {(data || []).length === 0 && (
              <p className="col-span-full text-sm text-gray-500">No marinades published yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LakeFreshMarinades;
