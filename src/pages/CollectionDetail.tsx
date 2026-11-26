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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="Collection Not Found | SB"
          description="We couldn't find that collection. Explore current SB collections and drops instead."
        />
        <div className="container flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
          <p className="eyebrow mb-3 text-primary">404 · Collection</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            We couldn&apos;t find that collection
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
            It may have been renamed, retired, or the link might be out of date. The current lines are
            all waiting for you.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/collections">
              <ArrowLeft /> Browse Collections
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${collection.name} | SB`}
        description={
          collection.description ||
          `Shop the ${collection.name} ${isDrop ? "limited drop" : "collection"} from SB in Blantyre, Malawi.`
        }
        path={`/collections/${collection.slug}`}
        image={heroImage || undefined}
      />

      <section className="relative isolate overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          {heroImage ? (
            <img src={heroImage} alt="" className="h-full w-full object-cover object-top" loading="eager" fetchPriority="high" decoding="async" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-900 via-primary/80 to-gray-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <div className="container relative py-20 sm:py-28">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link to="/collections" className="hover:text-white">Collections</Link>
            <span>/</span>
            <span className="text-white">{collection.name}</span>
          </nav>

          <div className="mt-12 max-w-2xl">
            <p className="eyebrow mb-3 text-white/70">
              {isDrop ? "Limited Drop" : "Collection"}
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {collection.description}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {released && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                  <CalendarDays className="h-3.5 w-3.5" /> {isDrop ? "Drops" : "Released"} {released}
                </span>
              )}
              <span className="rounded-full border border-white/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {collectionProducts.length} {collectionProducts.length === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-primary">The lineup</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              Pieces in this {isDrop ? "drop" : "collection"}
            </h2>
          </div>
          <span className="text-sm text-gray-600">
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
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="font-display text-xl font-extrabold uppercase text-gray-900">
              This {isDrop ? "drop" : "collection"} is being curated
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
              The pieces are on their way. Until then, explore everything else in the shop.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-7">
              <Link to="/shop">Shop all</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectionDetail;
