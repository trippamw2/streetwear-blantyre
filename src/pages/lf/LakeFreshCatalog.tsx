import { Link } from "react-router-dom";
import { Fish, ArrowRight, Leaf, BookOpen, Snowflake, AlertCircle, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCatalog } from "@/hooks/useLakeFresh";
import { formatMWK } from "@/data/products";

const prepLabel = (value: string) =>
  value === "whole" ? "Whole" : value === "cleaned" ? "Cleaned" : value === "portioned" ? "Portioned" : value;

const accents = ["#39B54A", "#08A9E8", "#7ED321"];

const LakeFreshCatalog = () => {
  const { data: products, isLoading, isError, refetch } = useLakeFreshCatalog();

  return (
    <div className="bg-white text-gray-900">
      <SEO
        brand="lake-fresh"
        title="The Catch — Lake Fresh Fish Mart"
        description="Browse fresh Chambo, Ncheni/Micheni and Usipa. Priced per kilogram with signature spices, free recipes and next-day delivery across Blantyre."
      />

      <section className="relative overflow-hidden border-b border-[#EAF6FB] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Fish className="h-3.5 w-3.5" /> Today&apos;s catch
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
            THE CATCH
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Fresh fish from the lake, prepared whole, cleaned or portioned. Priced per kilogram with next-day delivery
            — then add signature spices and a free recipe to finish the meal.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/lf/spices"
              className="inline-flex items-center gap-2 rounded-full border border-[#39B54A]/30 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#2c6e12]"
            >
              <Leaf className="h-3.5 w-3.5 text-[#39B54A]" /> Signature spices
            </Link>
            <Link
              to="/lf/recipes"
              className="inline-flex items-center gap-2 rounded-full border border-[#08A9E8]/30 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-[#073B78]"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#08A9E8]" /> Free recipes
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#39B54A]" /> Loading the catch…
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
            <p className="mt-2 font-semibold text-red-700">We couldn&apos;t load the catch.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#073B78] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {products && products.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500">
                No fish is listed right now. Please check back soon.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(products || []).map((product, index) => {
                  const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
                  const accent = accents[index % accents.length];
                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="relative h-44 overflow-hidden bg-[#EAF6FB]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Fish className="h-12 w-12 text-[#08A9E8]" />
                          </div>
                        )}
                        <span
                          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            soldOut ? "bg-white/90 text-gray-500" : "bg-[#39B54A] text-white"
                          }`}
                        >
                          {soldOut ? "Sold out" : `${product.availableKg.toFixed(1)} kg available`}
                        </span>
                        <span
                          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
                          style={{ color: accent }}
                        >
                          <Leaf className="h-4 w-4" />
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-[#073B78]">
                          {product.speciesName || product.name}
                        </h2>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{product.description}</p>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="text-lg font-extrabold text-[#073B78]">
                            {formatMWK(product.pricePerKgMwk)}
                            <span className="ml-1 text-xs font-semibold text-gray-400">/ kg</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Min. {product.minOrderQtyKg} kg · {product.preparationOptions.map(prepLabel).join(" · ")}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                            <Snowflake className="h-3.5 w-3.5 text-[#08A9E8]" /> Cold-chain handled · free recipe included
                          </div>
                        </div>

                        <Link
                          to={`/lf/fish/${product.id}`}
                          className="mt-5 inline-flex items-center justify-between rounded-xl bg-[#073B78] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#073B78]/90"
                        >
                          {soldOut ? "View details" : "Choose weight"}
                          <ArrowRight className="h-3.5 w-3.5" style={{ color: accent }} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-8 text-xs text-gray-400">
              Availability reflects the current fresh batch. If a fish is sold out, it will return with the next catch.
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default LakeFreshCatalog;
