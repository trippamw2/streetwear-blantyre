import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Shirt, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { useSbMerchandising, type SbLook } from "@/hooks/useSbMerchandising";

const lookCover = (look: SbLook, products: Product[]) => {
  if (look.heroImage) return look.heroImage;
  for (const item of look.items) {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (product?.image) return product.image;
  }
  return "";
};

const shoppablePoints = [
  { icon: Shirt, title: "Real pieces", description: "Every item is real and ready to buy." },
  { icon: ShoppingBag, title: "Add to bag", description: "Pick only what you want." },
  { icon: Sparkles, title: "Easy styling", description: "See how to wear it." },
];

const LookCard = ({
  look,
  products,
  featured = false,
}: {
  look: SbLook;
  products: Product[];
  featured?: boolean;
}) => {
  const cover = lookCover(look, products);

  if (featured) {
    return (
      <Link
        to={`/looks/${look.slug}`}
        className="group mb-10 block overflow-hidden rounded-3xl border border-gray-200 bg-white transition-shadow duration-300 hover:shadow-xl"
      >
        <div className="relative h-72 bg-gray-100 sm:h-96">
          {cover ? (
            <img
              src={cover}
              alt={look.title}
              className="h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-primary/80 to-gray-700">
              <span className="font-display text-5xl font-bold tracking-[0.12em] text-white/70">
                Look
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-10">
            <p className="eyebrow mb-3 text-white/75">Featured look</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              {look.title}
            </h2>
            {look.subtitle && <p className="mt-2 text-sm text-white/80 sm:text-base">{look.subtitle}</p>}
            <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white group-hover:gap-3">
              Shop this look <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/looks/${look.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-gray-900/5"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={look.title}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-primary/80 to-gray-700">
            <span className="font-display text-4xl font-extrabold uppercase tracking-[0.2em] text-white/70">
              LOOK
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-900 shadow-sm">
          {look.items.filter((item) => item.isPurchasable).length} shoppable{" "}
          {look.items.filter((item) => item.isPurchasable).length === 1 ? "piece" : "pieces"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-2 text-primary">Styled Look</p>
        <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-gray-900">
          {look.title}
        </h3>
        {look.subtitle && <p className="mt-2 text-sm text-gray-600">{look.subtitle}</p>}
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900 group-hover:text-primary">
          View the look <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

const Looks = () => {
  const { products, loading: productsLoading } = useProducts();
  const { looks, loading: merchandisingLoading } = useSbMerchandising();
  const loading = productsLoading || merchandisingLoading;

  const publishedLooks = looks.filter((look) => look.isPublished);
  const featuredLooks = publishedLooks.filter((look) => look.isFeatured);
  const otherLooks = publishedLooks.filter((look) => !look.isFeatured);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Looks | SB"
        description="Shoppable style looks from SB. See the full outfit, explore each piece, and shop the look."
        path="/looks"
      />

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl space-y-5">
            <span className="eyebrow inline-block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-primary">
              Styled with intention
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Looks
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
              Full fits for everyday urban life. Every look is built from pieces you can wear, style your way, and shop right now.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-14 sm:py-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
          </div>
        ) : publishedLooks.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="eyebrow mb-3 text-primary">In the Studio</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              New looks are on the way
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Our stylists are putting the next edits together. Check back soon, or shop the pieces
              in the meantime.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-7">
              <Link to="/shop">
                Shop all <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {featuredLooks.length > 0 && (
              <div>
                {featuredLooks.map((look) => (
                  <LookCard key={look.id} look={look} products={products} featured />
                ))}
              </div>
            )}

            {otherLooks.length > 0 ? (
              <>
                <div className="mb-8 mt-14">
                  <p className="eyebrow mb-2 text-primary">The edit</p>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
                    More looks
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                  {otherLooks.map((look) => (
                    <LookCard key={look.id} look={look} products={products} />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
                <p className="font-display text-base font-extrabold uppercase text-gray-900">
                  More looks are being styled
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                  Explore the featured look above while the rest of the edit is on its way.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3 text-primary">Shop the story</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Every look is shoppable
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              Nothing here is just for the camera. Open any look to see the exact pieces, why each one
              is in the edit, and add your favourites straight to the bag.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-7">
              <Link to="/shop">
                Shop all <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {shoppablePoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold tracking-tight text-gray-950">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Looks;
