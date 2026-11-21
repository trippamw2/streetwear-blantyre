import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatMWK } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { useSbMerchandising } from "@/hooks/useSbMerchandising";

const LookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { add } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const { looks, loading: merchandisingLoading } = useSbMerchandising();
  const loading = productsLoading || merchandisingLoading;

  const look = looks.find((candidate) => candidate.slug === slug);

  // Only items flagged as purchasable are shown, in the curated sort order.
  const items = look
    ? look.items
        .filter((item) => item.isPurchasable)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const heroImage =
    look?.heroImage ||
    items
      .map((item) => products.find((candidate) => candidate.id === item.productId))
      .find((product) => product?.image)?.image ||
    "";

  const lookProductIds = new Set(items.map((item) => item.productId));
  const morePieces = products.filter((product) => !lookProductIds.has(product.id)).slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  if (!look) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="Look Not Found | SB Streetwear"
          description="We couldn't find that SB Streetwear look. Explore the current looks and shoppable edits instead."
        />
        <div className="container flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
          <p className="eyebrow mb-3 text-primary">404 · Look</p>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
            We couldn&apos;t find that look
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
            It may have been archived, or the link might be out of date. There are plenty of other
            edits to explore.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/looks">
              <ArrowLeft /> Back to Looks
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${look.title} | SB Streetwear`}
        description={
          look.description ||
          look.subtitle ||
          `Shop the ${look.title} look from SB Streetwear. Every piece in the edit is available to buy.`
        }
        path={`/looks/${look.slug}`}
        image={heroImage || undefined}
      />

      <section className="relative isolate overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          {heroImage ? (
            <img src={heroImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-900 via-primary/80 to-gray-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <div className="container relative py-20 sm:py-28">
          <Link
            to="/looks"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All looks
          </Link>

          <div className="mt-12 max-w-2xl">
            <p className="eyebrow mb-3 text-white/70">Shoppable Look</p>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {look.title}
            </h1>
            {look.subtitle && <p className="mt-4 text-base font-medium text-white/85 sm:text-lg">{look.subtitle}</p>}
            {look.description && (
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">{look.description}</p>
            )}
            <span className="mt-7 inline-flex rounded-full border border-white/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
              {items.length} {items.length === 1 ? "shoppable piece" : "shoppable pieces"}
            </span>
          </div>
        </div>
      </section>

      <section className="container py-14 sm:py-20">
        <div className="mb-8">
          <p className="eyebrow mb-2 text-primary">The Edit</p>
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-3xl">
            Shop this look
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-500">
            Every piece below is available on its own. Tap through for sizing, or add it straight to
            your cart.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="font-display text-xl font-extrabold uppercase text-gray-900">
              This look is still being styled
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
              No pieces are available to shop here just yet. Explore the other looks or browse the
              full range.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/looks">More Looks</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/shop">Shop All Pieces</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item, index) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              const price =
                product && product.is_on_sale && product.discount_percent > 0
                  ? product.price * (1 - product.discount_percent / 100)
                  : product?.price;
              const soldOut = Boolean(product && product.stock <= 0);

              const handleAdd = () => {
                if (!product || soldOut) return;
                add({
                  productKey: `${product.id}-${item.variantId || "default"}`,
                  productId: product.id,
                  name: product.name,
                  price: price ?? product.price,
                  image: product.image,
                });
              };

              return (
                <article
                  key={item.id}
                  className="grid gap-5 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-lg sm:grid-cols-[180px_1fr] sm:p-5"
                >
                  <Link
                    to={`/product/${item.productId}`}
                    className="group block h-48 overflow-hidden rounded-xl bg-gray-100 sm:h-auto sm:min-h-[180px]"
                  >
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="font-display text-3xl font-extrabold uppercase tracking-[0.2em] text-primary/30">
                          SB
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="eyebrow text-primary">Piece {String(index + 1).padStart(2, "0")}</span>
                      {item.role && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
                          {item.role}
                        </span>
                      )}
                      {soldOut && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                          Sold out
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-xl font-extrabold uppercase tracking-tight text-gray-900">
                      <Link to={`/product/${item.productId}`} className="transition-colors hover:text-primary">
                        {product?.name || "Piece coming soon"}
                      </Link>
                    </h3>

                    {typeof price === "number" && (
                      <p className="mt-1 text-base font-bold text-gray-900">{formatMWK(price)}</p>
                    )}

                    {item.stylingNote && (
                      <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic leading-relaxed text-gray-500">
                        {item.stylingNote}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button onClick={handleAdd} variant="hero" size="sm" disabled={!product || soldOut}>
                        Add to Cart
                      </Button>
                      <Button asChild variant="link" size="sm">
                        <Link to={`/product/${item.productId}`}>
                          View Piece <ArrowRight />
                        </Link>
                      </Button>
                      {!product && (
                        <span className="text-xs text-gray-500">This piece is no longer available.</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {morePieces.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50 py-14 sm:py-20">
          <div className="container">
            <div className="mb-8">
              <p className="eyebrow mb-2 text-primary">Keep Building</p>
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-3xl">
                More pieces to explore
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {morePieces.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LookDetail;
