import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useSbMerchandising } from "@/hooks/useSbMerchandising";

const formatReleaseDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const CollectionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading: productsLoading } = useProducts();
  const { collections, loading: merchandisingLoading } = useSbMerchandising();
  const loading = productsLoading || merchandisingLoading;

  const collection = collections.find((candidate) => candidate.slug === slug);

  // Resolve by id and keep the curated productIds order intact.
  const collectionProducts = collection
    ? collection.productIds.flatMap((id) => {
        const product = products.find((candidate) => candidate.id === id);
        return product ? [product] : [];
      })
    : [];

  const heroImage = collection?.heroImage || collectionProducts[0]?.image || "";
  const released = formatReleaseDate(collection?.releaseDate || null);
  const isDrop = Boolean(collection && (collection.kind === "drop" || collection.limitedDrop));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#141414] border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#fbfbfc]">
        <SEO
          title="Collection Not Found | SB"
          description="We couldn't find that collection. Explore current SB collections and drops instead."
        />
        <div className="container flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">404 · Collection</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#141414] sm:text-5xl">
            We couldn&apos;t find that collection
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
            It may have moved. Explore the current collections instead.
          </p>
          <Link to="/collections" className="mt-8 inline-flex h-12 items-center justify-center gap-2 bg-[#141414] px-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-primary">
            <ArrowLeft className="h-4 w-4" /> Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc] text-[#141414]">
      <SEO
        title={`${collection.name} | SB`}
        description={
          collection.description ||
          `Shop the ${collection.name} ${isDrop ? "limited drop" : "collection"} from SB in Blantyre, Malawi.`
        }
        path={`/collections/${collection.slug}`}
        image={heroImage || undefined}
      />

      <section className="relative isolate overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0">
          {heroImage ? (
            <img src={heroImage} alt="" className="h-full w-full object-cover object-top opacity-75" loading="eager" fetchPriority="high" decoding="async" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#141414] via-primary/70 to-[#2a2a2a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
        </div>

        <div className="container relative py-20 sm:py-28 lg:py-32">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link to="/collections" className="hover:text-white">Collections</Link>
            <span>/</span>
            <span className="text-white">{collection.name}</span>
          </nav>

          <div className="mt-12 max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">
              {isDrop ? "Limited Drop" : "Collection"}
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl text-balance">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                {collection.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {released && (
                <span className="inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5" /> {isDrop ? "Drops" : "Released"} {released}
                </span>
              )}
              <span className="border border-white/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {collectionProducts.length} {collectionProducts.length === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">The lineup</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#141414] sm:text-5xl">
              Pieces in this {isDrop ? "drop" : "collection"}
            </h2>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
            {collectionProducts.length} {collectionProducts.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        {collectionProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {collectionProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-black/15 bg-white px-6 py-16 text-center">
            <p className="font-display text-2xl font-extrabold tracking-tight text-[#141414]">
              This {isDrop ? "drop" : "collection"} is being curated
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-600">
              The pieces are on their way. Explore everything else in the shop.
            </p>
            <Link to="/shop" className="mt-8 inline-flex h-12 items-center justify-center bg-[#141414] px-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-primary">Shop all</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectionDetail;
