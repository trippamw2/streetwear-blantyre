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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-gray-900/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={collection.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-primary/80 to-gray-700">
            <span className="font-display text-3xl font-extrabold uppercase tracking-[0.24em] text-white/70">
              WARDROBE
            </span>
          </div>
        )}
        {isDrop && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-900 shadow-sm">
            Limited Drop
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-2 text-primary">{isDrop ? "Drop" : "Collection"}</p>
        <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-gray-900">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{collection.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <span className="text-xs text-gray-600">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
            {released ? ` · ${released}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900 group-hover:text-primary">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const EmptySection = ({ title, message }: { title: string; message: string }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
    <p className="font-display text-lg font-extrabold uppercase text-gray-900">{title}</p>
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
    <div className="min-h-screen bg-white">
      <SEO title="Collections | SB" description="Explore curated SB collections and limited drops designed for everyday urban style." path="/collections" />

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl space-y-5">
            <span className="eyebrow inline-block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-primary">
              Curated with care
            </span>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Collections &amp; Drops
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
              Every release is built as a wardrobe, not a one off. Explore the collections that
              define the street, and the limited drops that move fast.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" variant="hero">
                <a href="#collections">Explore Collections</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop">
                  Shop all <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
        </div>
      ) : visible.length === 0 ? (
        <section className="container py-16 sm:py-20">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="eyebrow mb-3 text-primary">Coming Soon</p>
            <h2 className="font-display text-2xl font-extrabold uppercase text-gray-900 sm:text-3xl">
              New collections are being curated
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Nothing is live here just yet. In the meantime, explore the pieces already in the shop.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-7">
              <Link to="/shop">
                Shop collection <ArrowRight />
              </Link>
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="mt-12">
              <p className="eyebrow mb-2 text-primary">Start Here</p>
              <h3 className="font-display text-xl font-extrabold uppercase text-gray-900">
                Popular right now
              </h3>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {preview.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          <section id="collections" className="container scroll-mt-20 py-14 sm:py-20">
            <div className="mb-8">
              <p className="eyebrow mb-2 text-primary">The Wardrobe</p>
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
                Collections
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
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

          <section id="drops" className="scroll-mt-20 border-t border-gray-200 bg-gray-50 py-14 sm:py-20">
            <div className="container">
              <div className="mb-8">
                <p className="eyebrow mb-2 text-primary">Limited Availability</p>
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
                  Limited Drops
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
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
