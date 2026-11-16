import { Link } from "react-router-dom";
import { Fish, ArrowRight, Snowflake, AlertCircle, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCatalog } from "@/hooks/useLakeFresh";
import { formatMWK } from "@/data/products";

const prepLabel = (value: string) =>
  value === "whole" ? "Whole" : value === "cleaned" ? "Cleaned" : value === "portioned" ? "Portioned" : value;

const LakeFreshCatalog = () => {
  const { data: products, isLoading, isError, refetch } = useLakeFreshCatalog();

  return (
    <div className="bg-white text-gray-900">
      <SEO
        brand="lake-fresh"
        title="The Catch — Lake Fresh Fish Mart"
        description="Browse fresh Chambo, Ncheni/Micheni and Usipa. Priced per kilogram with next-day delivery across Blantyre."
      />

      <section className="border-b border-gray-200 bg-[#ecfeff]/50">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0a2540]/60">
            <Fish className="h-3.5 w-3.5" /> Today&apos;s catch
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#0a2540] sm:text-5xl">
            THE CATCH
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Fresh fish from the lake, prepared whole, cleaned or portioned. Priced per kilogram with next-day
            delivery — choose your weight and preparation at checkout.
          </p>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#0a2540]" /> Loading the catch…
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
            <p className="mt-2 font-semibold text-red-700">We couldn&apos;t load the catch.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#0a2540] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
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
                {(products || []).map((product) => {
                  const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
                  return (
                    <div
                      key={product.id}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a2540] text-[#22d3ee]">
                          <Fish className="h-5 w-5" />
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            soldOut
                              ? "bg-gray-100 text-gray-500"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {soldOut ? "Sold out" : `${product.availableKg.toFixed(1)} kg available`}
                        </span>
                      </div>

                      <h2 className="mt-4 font-display text-lg font-extrabold uppercase tracking-wide text-[#0a2540]">
                        {product.speciesName || product.name}
                      </h2>
                      <p className="mt-2 flex-1 text-sm text-gray-500">{product.description}</p>

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-lg font-extrabold text-[#0a2540]">
                          {formatMWK(product.pricePerKgMwk)}
                          <span className="ml-1 text-xs font-semibold text-gray-400">/ kg</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Min. {product.minOrderQtyKg} kg · {product.preparationOptions.map(prepLabel).join(" · ")}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                          <Snowflake className="h-3.5 w-3.5 text-[#0a2540]/50" /> Cold-chain handled
                        </div>
                      </div>

                      <Link
                        to={`/lf/fish/${product.id}`}
                        className="mt-5 inline-flex items-center justify-between rounded-lg bg-[#0a2540] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#0a2540]/90"
                      >
                        {soldOut ? "View details" : "Choose weight"}
                        <ArrowRight className="h-3.5 w-3.5 text-[#22d3ee]" />
                      </Link>
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
