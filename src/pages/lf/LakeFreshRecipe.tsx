import { useParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Fish, Leaf, Loader2, Sparkles, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";

const LakeFreshRecipe = () => {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["lf", "recipe", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lf_recipes")
        .select("*, fish_species(name)")
        .eq("brand_id", LF_BRAND_ID)
        .eq("slug", slug as string)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Recipe not found");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-[#08A9E8]" /> Loading recipe…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Recipe not available</h1>
        <p className="mt-2 text-sm text-gray-500">{error instanceof Error ? error.message : "We could not load this recipe."}</p>
        <LFLink
          to="/lf/recipes"
          className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white"
        >
          All recipes
        </LFLink>
      </div>
    );
  }

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const stepAccents = ["#39B54A", "#08A9E8", "#7ED321"];

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title={`${data.title} — Lake Fresh Fish Mart`} description="Lake Fresh fish recipe." />

      <section className="border-b border-[#EAF6FB] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div className="container max-w-4xl py-10 sm:py-14">
          <LFLink
            to="/lf/recipes"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#073B78]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All recipes
          </LFLink>

          <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_1.05fr] sm:items-center">
            <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF6FB]">
              {data.image ? (
                <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-16 w-16 text-[#08A9E8]" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-[#7ED321] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]">
                Free with fish
              </span>
            </div>

            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B54A]">
                <Fish className="h-3.5 w-3.5" /> {data.fish_species?.name || "Fish recipe"}
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#073B78] sm:text-4xl">
                {data.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                {data.prep_time_min ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-[#08A9E8]" /> Prep {data.prep_time_min} min
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
                    {data.cooking_method}
                  </span>
                ) : null}
              </div>
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
              <p className="mt-1 text-xs text-gray-500">Pick it on any {data.fish_species?.name || "fish"} page and it arrives with your basket.</p>
            </div>
          </div>
          <LFLink
            to="/lf/fish"
            className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#39B54A] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white sm:mt-0"
          >
            Shop fish <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>

        {data.recommended_spice ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#39B54A]/25 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#39B54A]/10 text-[#39B54A]">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recommended spice</p>
                <p className="text-sm font-bold text-[#073B78]">{data.recommended_spice}</p>
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
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {ingredients.map((ing: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39B54A]" />
                  <span>{ing}</span>
                </li>
              ))}
              {ingredients.length === 0 && <li className="text-gray-500">No ingredients listed.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-[#073B78]">Method</h2>
            <ol className="mt-4 space-y-4">
              {steps.map((step: string, idx: number) => (
                <li key={idx} className="flex gap-3">
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ backgroundColor: stepAccents[idx % stepAccents.length] }}
                  >
                    {idx + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-gray-700">{step}</p>
                </li>
              ))}
              {steps.length === 0 && <li className="text-sm text-gray-500">No steps listed.</li>}
            </ol>
          </section>
        </div>

        {data.safety_notes ? (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-display text-lg font-extrabold text-amber-900">Food safety</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">{data.safety_notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default LakeFreshRecipe;
