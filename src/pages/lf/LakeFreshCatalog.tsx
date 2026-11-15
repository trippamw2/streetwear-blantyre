import { Link } from "react-router-dom";
import { Fish, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { FISH_SPECIES, FISH_PRODUCTS } from "@/data/lakefresh";

const LakeFreshCatalog = () => {
  return (
    <div className="bg-white text-gray-900">
      <SEO
        title="Lake Fresh Fish Mart — Fresh Fish"
        description="Browse fresh Chambo, Ncheni/Micheni and Usipa. Priced per kilogram with next-day delivery across Blantyre."
      />

      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container py-12 sm:py-16">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
            THE CATCH
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl">
            Fresh fish from the lake, prepared whole, cleaned or portioned. Weigh it per kilogram at delivery — you only pay for what arrives.
          </p>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FISH_SPECIES.map((species) => (
            <div key={species.slug} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a2540] text-[#22d3ee]">
                <Fish className="h-5 w-5" />
              </span>
              <h2 className="font-display font-extrabold uppercase text-lg mt-4 tracking-wide">
                {species.name}
              </h2>
              <p className="text-sm text-gray-500 mt-2">{species.description}</p>
              <Link to={`/lf/fish/${species.slug}`}>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0a2540]">
                  View fish <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Products for this stage: {FISH_PRODUCTS.map((p) => p.name).join(", ")}
        </p>
      </section>
    </div>
  );
};

export default LakeFreshCatalog;
