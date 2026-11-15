import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Fish } from "lucide-react";
import { SEO } from "@/components/SEO";
import { FISH_SPECIES, FISH_PRODUCTS, getFishPriceForWeight, DEFAULT_LF_DELIVERY_FEE_MWK } from "@/data/lakefresh";
import { Button } from "@/components/ui/button";

const LakeFreshProduct = () => {
  const { id } = useParams();
  const product = FISH_PRODUCTS.find((p) => p.id === id) || FISH_PRODUCTS[0];

  const species = FISH_SPECIES.find((s) => s.id === product.speciesId);

  return (
    <div className="bg-white text-gray-900">
      <SEO
        title={`${product.name} — Lake Fresh Fish Mart`}
        description={`${product.name}. Priced per kilogram with next-day delivery. ${species?.description || ""}`}
      />

      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container py-12 sm:py-16">
          <Link to="/lf/fish">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to the catch
            </span>
          </Link>
          <div className="mt-6 flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-full sm:w-72 rounded-2xl bg-[#0a2540] h-72 flex items-center justify-center">
              <Fish className="h-16 w-16 text-[#22d3ee]" />
            </div>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold tracking-[0.15em] uppercase mb-4">
                <Fish className="h-3.5 w-3.5" /> {species?.name || "Fresh Fish"}
              </span>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
                {product.name}
              </h1>
              <p className="text-gray-500 mt-3 leading-relaxed">{product.description}</p>
              <p className="mt-4 text-sm text-gray-600">
                <span className="font-bold uppercase tracking-wide text-gray-900">Pricing:</span>{" "}
                {`MK ${product.pricePerKgMwk.toLocaleString("en-US")} per kilogram`} · Min. order {product.minOrderQtyKg} kg
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Delivery fee: MK {DEFAULT_LF_DELIVERY_FEE_MWK.toLocaleString("en-US")} · Free over threshold (TBD per brand rules).
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Next weight-based price: MK {getFishPriceForWeight(product.pricePerKgMwk, product.minOrderQtyKg, product.minOrderQtyKg).toLocaleString("en-US")}
              </p>
              <div className="mt-6">
                <Button className="rounded-lg bg-[#0a2540] text-white hover:bg-[#0a2540]/90 font-bold uppercase tracking-widest text-xs">
                  Add to order (checkout coming soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshProduct;
