import { Link } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { formatMWK } from "@/data/products";

const LakeFreshMealKits = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["lf", "meal-kits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_meal_kits")
        .select("*, lf_meal_kit_items(*)")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Meal Kits — Lake Fresh Fish Mart" description="Complete fish meal kits from Lake Fresh." />
      <div className="container max-w-5xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">MEAL KITS</h1>
        <p className="mt-2 text-sm text-gray-500">Everything you need for a complete fish meal.</p>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading meal kits…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((k: any) => (
              <div key={k.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#0a2540]">
                  {k.image ? <img src={k.image} alt={k.name} className="h-full w-full rounded-xl object-cover" /> : <Package className="h-10 w-10 text-[#22d3ee]" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#0a2540]">{k.name}</h3>
                {k.description ? <p className="mt-2 line-clamp-2 text-sm text-gray-500">{k.description}</p> : null}
                <p className="mt-3 text-lg font-extrabold text-[#0a2540]">{formatMWK(k.price_mwk)}</p>
                {k.discount_percent ? <p className="text-xs text-emerald-600">{k.discount_percent}% off</p> : null}
                {Array.isArray(k.lf_meal_kit_items) && k.lf_meal_kit_items.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    {k.lf_meal_kit_items.map((it: any) => (
                      <li key={it.id}>• {it.item_name} {it.quantity ? `× ${it.quantity} ${it.unit || ""}` : ""}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {(data || []).length === 0 && (
              <p className="col-span-full text-sm text-gray-500">No meal kits published yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LakeFreshMealKits;
