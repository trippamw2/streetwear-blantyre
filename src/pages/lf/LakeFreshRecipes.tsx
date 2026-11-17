import { LFLink } from "@/components/lf/lfRouter";
import { ArrowRight, BookOpen, Clock, Fish, Loader2, Sparkles, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { lfDisplayCopy } from "@/lib/lfCopy";
import { isPilotSpeciesSlug } from "@/lib/lfPilot";

const accents = ["#39B54A", "#08A9E8", "#7ED321"];

const LakeFreshRecipes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["lf", "recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_recipes")
        .select("id, title, slug, image, prep_time_min, cook_time_min, servings, cooking_method, fish_species(name, slug)")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data || []).filter((recipe: any) => isPilotSpeciesSlug(recipe.fish_species?.slug));
    },
  });

  return (
    <div className="bg-white">
      <SEO
        brand="lake-fresh"
        title="Recipes | Lake Fresh Fish Mart"
        description="Lake Fresh fish recipes: clean, season and cook your fish at home. Free with every fish order."
      />

      <section className="relative overflow-hidden border-b border-[#F7FCEB] bg-gradient-to-br from-white via-[#F4FBF7] to-[#EAF6FB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#08A9E8] shadow-sm">
            <BookOpen className="h-3.5 w-3.5" /> Cook it well
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">RECIPES</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#073B78]/70 sm:text-base">
            See how to cook fresh fish at home, one clear step at a time. Pick a free recipe on the fish page and we add
            it to your order.
          </p>
          <div className="mt-6 inline-flex items-start gap-3 rounded-2xl border border-[#7ED321]/40 bg-white px-4 py-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#39B54A]" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#073B78]">Free with every fish</p>
              <p className="mt-0.5 text-xs text-[#073B78]/60">Pick a recipe on the fish page and it travels with your order.</p>
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#073B78] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <Fish className="h-3.5 w-3.5 text-[#7ED321]" /> Our recipes are made for Lake Malawi fish
          </p>
        </div>
      </section>

      <section className="container max-w-6xl py-12 sm:py-16">
        {isLoading ? (
          <p className="flex items-center gap-2 py-10 text-sm text-[#073B78]/60">
            <Loader2 className="h-4 w-4 animate-spin text-[#08A9E8]" /> Loading recipes…
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((r: any, index: number) => {
              const accent = accents[index % accents.length];
              return (
                <LFLink
                  key={r.id}
                  to={`/lf/recipes/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden bg-[#EAF6FB]">
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${accent}14, #EAF6FB)` }}
                      >
                        <BookOpen className="h-10 w-10" style={{ color: accent }} />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-[#7ED321] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]">
                      Free
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#39B54A]">
                      <Fish className="h-3.5 w-3.5" /> {lfDisplayCopy(r.fish_species?.name) || "Fish recipe"}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-extrabold text-[#073B78]">{lfDisplayCopy(r.title)}</h3>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#073B78]/70">
                      {r.prep_time_min ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5 text-[#08A9E8]" /> Get ready {r.prep_time_min}m
                        </span>
                      ) : null}
                      {r.cook_time_min ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5 text-[#39B54A]" /> Cook {r.cook_time_min}m
                        </span>
                      ) : null}
                      {r.servings ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                          <Users className="h-3.5 w-3.5 text-[#7ED321]" /> Serves {r.servings}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      {r.cooking_method ? (
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                          style={{ backgroundColor: `${accent}14`, color: accent }}
                        >
                          {lfDisplayCopy(r.cooking_method)}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">
                        View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </LFLink>
              );
            })}
            {(data || []).length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-[#073B78]/60">No recipes published yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default LakeFreshRecipes;
