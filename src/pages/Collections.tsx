import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { useSbMerchandising, type SbCollection } from "@/hooks/useSbMerchandising";

const formatReleaseDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const resolveProducts = (ids: string[], products: Product[]) =>
  ids.flatMap((id) => {
    const product = products.find((candidate) => candidate.id === id);
    return product ? [product] : [];
  });

const CollectionCard = ({ collection, products }: { collection: SbCollection; products: Product[] }) => {
  const items = resolveProducts(collection.productIds, products);
  const cover = collection.heroImage || items[0]?.image || "";
  const released = formatReleaseDate(collection.releaseDate);
  const isDrop = collection.kind === "drop" || collection.limitedDrop;

  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-black/[0.06] bg-white transition-all duration-500 hover:border-black/15 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f0f0ee]">
        {cover ? (
          <img
            src={cover}
            alt={collection.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain object-center bg-black/0 sm:object-cover sm:object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#141414] via-primary/70 to-[#2a2a2a]">
            <span className="font-display text-3xl font-bold tracking-[0.18em] text-white/70">
              SB
            </span>
          </div>
        )}
        {isDrop && (
          <span className="absolute left-3 top-3 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#141414] backdrop-blur-sm">
            Limited drop
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{isDrop ? "Drop" : "Collection"}</p>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#141414]">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{collection.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
            {released ? ` · ${released}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#141414] transition-colors group-hover:text-primary">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const EmptySection = ({ title, message }: { title: string; message: string }) => (
  <div className="border border-dashed border-black/15 bg-white px-6 py-14 text-center">
    <p className="font-display text-xl font-extrabold tracking-tight text-[#141414]">{title}</p>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">{message}</p>
  </div>
);

const Collections = () => {
  const { products, loading: productsLoading } = useProducts();
  const { collections, loading: merchandisingLoading } = useSbMerchandising();
  const loading = productsLoading || merchandisingLoading;

  const visible = collections.filter(
    (collection) =>
      collection.isActive !== false &&
      (collection.kind === "collection" || collection.kind === "drop"),
  );
  const coreCollections = visible.filter((collection) => collection.kind === "collection");
  const limitedDrops = visible.filter((collection) => collection.kind === "drop");

  const featuredPreview = products
    .filter((product) => product.is_featured || product.is_new_arrival)
    .slice(0, 4);
  const preview = featuredPreview.length > 0 ? featuredPreview : products.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fbfbfc] text-[#141414]">
      <SEO title="Collections | SB" description="Explore curated SB collections and limited drops designed for everyday urban style." path="/collections" />

      <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#0a0a0a] text-white">
        <div className="absolute inset-0">
          <img src="/images/sb/home-street.jpg" alt="" aria-hidden="true" className="h-full w-full object-contain object-center bg-black/0 sm:object-cover sm:object-top opacity-30" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35" />
        </div>
        <div className="container relative py-20 sm:py-28 lg:py-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Curated with care</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl text-balance">
            Collections <span className="text-white/45">&amp; drops.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Clothes that go well together. Shop full collections and limited drops.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#collections" className="inline-flex h-13 items-center justify-center gap-2 bg-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0a0a0a] transition-all duration-300 hover:bg-primary hover:text-white">
              Explore collections
            </a>
            <Link to="/shop" className="inline-flex h-13 items-center justify-center gap-2 border border-white/25 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:border-white hover:bg-white/10">
              Shop all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#141414] border-t-transparent" />
        </div>
      ) : visible.length === 0 ? (
        <section className="container py-16 sm:py-24">
          <div className="border border-black/[0.08] bg-white px-6 py-16 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Coming soon</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">
              New collections are being curated
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Nothing is live here just yet. Explore the pieces already in the shop.
            </p>
            <Link to="/shop" className="mt-8 inline-flex h-12 items-center justify-center gap-2 bg-[#141414] px-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-primary">
              Shop collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {preview.length > 0 && (
            <div className="mt-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Start here</p>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#141414]">
                Popular right now
              </h3>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {preview.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          <section id="collections" className="container scroll-mt-24 py-16 sm:py-24">
            <div className="mb-10 sm:mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">The wardrobe</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#141414] sm:text-5xl">
                Collections
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
                Core lines made to mix, match and wear every day.
              </p>
            </div>
            {coreCollections.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {coreCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} products={products} />
                ))}
              </div>
            ) : (
              <EmptySection
                title="Core collections are on the way"
                message="Our permanent lines are being put together. Check back soon, or browse individual pieces in the shop."
              />
            )}
          </section>

          <section id="drops" className="scroll-mt-24 border-t border-black/[0.06] bg-[#f6f6f4] py-16 sm:py-24">
            <div className="container">
              <div className="mb-10 sm:mb-14">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Limited availability</p>
                <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#141414] sm:text-5xl">
                  Limited drops
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
                  Small runs, released with intention. When they are gone, they are gone.
                </p>
              </div>
              {limitedDrops.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {limitedDrops.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} products={products} />
                  ))}
                </div>
              ) : (
                <EmptySection
                  title="No drops live right now"
                  message="The next drop is in the works. Follow along and catch it when it lands."
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Collections;
