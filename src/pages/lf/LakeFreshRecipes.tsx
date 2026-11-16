import { Link } from "react-router-dom";
import { BookOpen, Clock, Loader2, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";

const LakeFreshRecipes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["lf", "recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_recipes")
        .select("id, title, slug, image, prep_time_min, cook_time_min, servings, cooking_method, fish_species(name)")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Recipes — Lake Fresh Fish Mart" description="Lake Fresh fish recipes: clean, season and cook your fish at home." />
      <div className="container max-w-5xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">RECIPES</h1>
        <p className="mt-2 text-sm text-gray-500">Learn how to clean, season and cook your fresh fish at home.</p>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading recipes…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((r: any) => (
              <Link
                key={r.id}
                to={`/lf/recipes/${r.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center rounded-xl bg-[#0a2540]">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-[#22d3ee]" />
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#0a2540]">{r.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{r.fish_species?.name || "Fish recipe"}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  {r.prep_time_min ? (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Prep {r.prep_time_min}m</span>
                  ) : null}
                  {r.cook_time_min ? (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cook {r.cook_time_min}m</span>
                  ) : null}
                  {r.servings ? (
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Serves {r.servings}</span>
                  ) : null}
                </div>
                {r.cooking_method ? (
                  <span className="mt-3 inline-block rounded-full bg-[#ecfeff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0a2540]">
                    {r.cooking_method}
                  </span>
                ) : null}
              </Link>
            ))}
            {(data || []).length === 0 && (
              <p className="col-span-full text-sm text-gray-500">No recipes published yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LakeFreshRecipes;
