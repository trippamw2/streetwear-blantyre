import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Loader2, Users } from "lucide-react";
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
        <Loader2 className="h-5 w-5 animate-spin text-[#073B78]" /> Loading recipe…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-[#073B78]">Recipe not available</h1>
        <p className="mt-2 text-sm text-gray-500">{error instanceof Error ? error.message : "We could not load this recipe."}</p>
        <Link to="/lf/recipes" className="mt-6 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white">
          All recipes
        </Link>
      </div>
    );
  }

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const steps = Array.isArray(data.steps) ? data.steps : [];

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title={`${data.title} — Lake Fresh Fish Mart`} description="Lake Fresh fish recipe." />
      <div className="container max-w-3xl py-10 sm:py-14">
        <Link to="/lf/recipes" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#073B78]">
          <ArrowLeft className="h-3.5 w-3.5" /> All recipes
        </Link>

        <div className="mt-4 flex h-56 items-center justify-center rounded-2xl bg-[#073B78]">
          {data.image ? (
            <img src={data.image} alt={data.title} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <BookOpen className="h-16 w-16 text-[#08A9E8]" />
          )}
        </div>

        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#073B78]">{data.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{data.fish_species?.name || "Fish recipe"}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {data.prep_time_min ? <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Prep {data.prep_time_min} min</span> : null}
          {data.cook_time_min ? <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Cook {data.cook_time_min} min</span> : null}
          {data.servings ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Serves {data.servings}</span> : null}
          {data.cooking_method ? <span className="rounded-full bg-[#EAF6FB] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">{data.cooking_method}</span> : null}
        </div>

        {data.recommended_spice || data.recommended_marinade ? (
          <div className="mt-6 rounded-xl border border-[#08A9E8]/30 bg-[#EAF6FB]/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Complete the meal</p>
            {data.recommended_spice ? <p className="mt-1 text-sm text-[#073B78]">Spice: {data.recommended_spice}</p> : null}
            {data.recommended_marinade ? <p className="mt-1 text-sm text-[#073B78]">Marinade: {data.recommended_marinade}</p> : null}
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-2xl font-extrabold text-[#073B78]">Ingredients</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {ingredients.map((ing: string, idx: number) => (
              <li key={idx}>{ing}</li>
            ))}
            {ingredients.length === 0 && <li className="list-none text-gray-500">No ingredients listed.</li>}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-extrabold text-[#073B78]">Steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
            {steps.map((step: string, idx: number) => (
              <li key={idx}>{step}</li>
            ))}
            {steps.length === 0 && <li className="list-none text-gray-500">No steps listed.</li>}
          </ol>
        </section>

        {data.safety_notes ? (
          <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-display text-lg font-extrabold text-amber-900">Food safety</h2>
            <p className="mt-2 text-sm text-amber-900">{data.safety_notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default LakeFreshRecipe;
