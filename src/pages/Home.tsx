import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useSbMerchandising } from "@/hooks/useSbMerchandising";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import {
  SB_PRODUCT_TYPES,
  getCompleteLookProducts,
  getProductTypeCode,
  pickBalancedNewArrivals,
  type SbProductTypeCode,
} from "@/data/sbArchitecture";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { ArrowRight, ArrowUpRight, Shirt, Sparkles, Truck } from "lucide-react";

const hero = "/images/sb/home-menu.jpg";
const streetHero = "/images/sb/home-street.jpg";

const LOOK_COMBINATIONS: { label: string; types: [SbProductTypeCode, SbProductTypeCode] }[] = [
  { label: "Tee + Shorts", types: ["TEE", "SHORTS"] },
  { label: "Vest + Shorts", types: ["VEST", "SHORTS"] },
  { label: "Shirt + Shorts", types: ["SHORT_SLEEVE_SHIRT", "SHORTS"] },
  { label: "Tee + Shirt", types: ["TEE", "SHORT_SLEEVE_SHIRT"] },
];

const Home = () => {
  const { products, loading } = useProducts();
  const { placements, campaigns, completeLookRules, relations, looks } = useSbMerchandising();

  const heroPlacement = placements.find((placement) => placement.sectionKey === "home_hero" && placement.isActive);
  const heroCampaign = campaigns.find((campaign) => campaign.id === heroPlacement?.campaignId);
  const heroImage = heroPlacement?.imageOverride || heroCampaign?.heroImage || hero;
  const heroHref = heroPlacement?.ctaHref || heroCampaign?.ctaHref || "/shop";

  const newArrivalsPlacement = placements.find(
    (placement) => placement.sectionKey === "new_arrivals" && placement.isActive,
  );
  const teePlacement = placements.find((placement) => placement.sectionKey === "sb_tee" && placement.isActive);
  const teeHref = teePlacement?.ctaHref || "/shop?category=t-shirts";
  const completeLookPlacement = placements.find(
    (placement) => placement.sectionKey === "complete_look" && placement.isActive,
  );
  const streetPlacement = placements.find((placement) => placement.sectionKey === "sb_street" && placement.isActive);
  const streetCampaign = campaigns.find((campaign) => campaign.id === streetPlacement?.campaignId);
  const streetImage = streetPlacement?.imageOverride || streetCampaign?.heroImage || streetHero;
  const streetHref = streetPlacement?.ctaHref || streetCampaign?.ctaHref || "/shop";

  const newArrivals = pickBalancedNewArrivals(products);
  const teeProducts = products.filter((product) => getProductTypeCode(product) === "TEE");
  const heroTee = teeProducts[0];
  const featureLook = looks.find((look) => look.isFeatured && look.isPublished) || looks[0];

  const firstOfType = (code: SbProductTypeCode) =>
    products.find((product) => getProductTypeCode(product) === code && product.image);

  const completeLooks = LOOK_COMBINATIONS.map((combination) => ({
    ...combination,
    items: combination.types.map(firstOfType).filter((item): item is NonNullable<typeof item> => Boolean(item)),
  })).filter((combination) => combination.items.length === 2);

  const suggestions = heroTee
    ? getCompleteLookProducts(heroTee, products, completeLookRules, relations, 4)
    : [];

  return (
    <div className="bg-white">
      <SEO
        title="SB / Malawian Streetwear | Wear What Speaks"
        description="SB is a Malawian streetwear wardrobe from Blantyre. Shop tees, vests, short-sleeve shirts, shorts, collections and complete looks."
        path="/"
      />

      {/* HERO — editorial campaign */}
      <section className="bg-gray-950">
        <div className="relative w-full">
          <img
            src={heroImage}
            alt="SB streetwear campaign with Malawian models"
            className="block h-auto w-full"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="container pb-8 sm:pb-12 lg:pb-16">
              <div className="max-w-3xl space-y-4 rounded-xl bg-gray-950/55 p-5 backdrop-blur-sm sm:space-y-5 sm:p-8">
                <p className="font-display text-2xl font-black uppercase tracking-[0.35em] text-white sm:text-3xl">SB</p>
                <h1 className="font-display text-[2.5rem] font-extrabold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {heroPlacement?.headline || heroCampaign?.headline || "Wear What Speaks."}
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                  {heroPlacement?.body ||
                    heroCampaign?.description ||
                    "A full streetwear wardrobe from Blantyre, Malawi. Built to layer, mix and speak for itself."}
                </p>
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-4">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                    <Link to={heroHref}>
                      {heroPlacement?.ctaLabel || heroCampaign?.ctaLabel || "Shop the collection"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/looks">Explore the looks</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY PILLARS */}
      <section className="border-b border-gray-200 bg-white">
        <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 sm:gap-x-10">
          {SB_PRODUCT_TYPES.map((type) => (
            <Link key={type.code} to={`/shop?category=${type.slug}`} className="hover:text-primary">
              {type.label}
            </Link>
          ))}
          <span className="h-1 w-1 rounded-full bg-primary" />
          <Link to="/collections" className="hover:text-primary">Collections</Link>
          <Link to="/looks" className="hover:text-primary">Looks</Link>
        </div>
      </section>

      {/* NEW ARRIVALS — balanced across the wardrobe */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container">
          <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="eyebrow mb-2 text-primary">
                {newArrivalsPlacement?.headline || "New Arrivals"}
              </p>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {newArrivals.length > 0
                  ? newArrivalsPlacement?.body || "Fresh from the wardrobe"
                  : "New drops are landing soon"}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Tees, vests, shirts and shorts — the latest pieces across all four categories.
              </p>
            </div>
            <Link
              to={newArrivalsPlacement?.ctaHref || "/shop?sort=new"}
              className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900 hover:text-primary sm:inline-flex"
            >
              {newArrivalsPlacement?.ctaLabel || "View all"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="aspect-[3/4] bg-gray-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-2.5 w-1/3 rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {newArrivals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-12">
              <Shirt className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p className="mx-auto max-w-md text-sm text-gray-500">
                Message us on WhatsApp to hear about new stock first, or visit the kiosk in Blantyre.
              </p>
              <Button asChild className="mt-5" variant="hero">
                <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">Ask About New Stock</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* THE SB TEE */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container">
          <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="eyebrow mb-2 text-primary">The SB Tee</p>
              <h2 className="font-display text-3xl font-extrabold uppercase text-gray-900 sm:text-5xl">
                {teePlacement?.headline || "The Graphic Tee"}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {teePlacement?.body || "The piece that started the conversation."}
              </p>
            </div>
            <Link
              to={teeHref}
              className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900 hover:text-primary sm:inline-flex"
            >
              {teePlacement?.ctaLabel || "Shop T-Shirts"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {heroTee ? (
              <Link
                to={`/product/${heroTee.id}`}
                className="group relative col-span-1 overflow-hidden rounded-2xl bg-gray-900 sm:col-span-2"
              >
                <img
                  src={heroTee.image}
                  alt={heroTee.name}
                  className="h-full min-h-[22rem] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">The Graphic Tee</p>
                  <h3 className="font-display text-2xl font-extrabold uppercase">{heroTee.name}</h3>
                </div>
              </Link>
            ) : (
              <div className="col-span-1 flex min-h-[22rem] items-center justify-center rounded-2xl bg-gray-900 p-8 text-center sm:col-span-2">
                <div>
                  <Sparkles className="mx-auto mb-4 h-10 w-10 text-white/40" />
                  <p className="font-display text-2xl font-extrabold uppercase text-white">The Graphic Tee</p>
                  <p className="mt-2 text-sm text-white/60">The piece that started the conversation.</p>
                </div>
              </div>
            )}
            {teeProducts.slice(heroTee ? 1 : 0, heroTee ? 4 : 3).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Button asChild variant="hero">
              <Link to={teeHref}>{teePlacement?.ctaLabel || "Shop T-Shirts"} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* COMPLETE THE LOOK */}
      <section className="bg-gray-950 py-16 sm:py-24">
        <div className="container">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2 text-white/45">Shop the outfit</p>
              <h2 className="font-display text-3xl font-extrabold uppercase text-white sm:text-4xl">
                {completeLookPlacement?.headline || "Complete the Look"}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-white/60">
                {completeLookPlacement?.body ||
                  "The wardrobe is made to mix. Start with one piece, build the full fit."}
              </p>
            </div>
            <Link
              to={completeLookPlacement?.ctaHref || "/looks"}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:text-white/70"
            >
              {completeLookPlacement?.ctaLabel || (featureLook ? featureLook.title : "Explore all looks")}{" "}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {completeLooks.map((combination) => (
              <div key={combination.label} className="overflow-hidden rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Complete the Look</p>
                  <h3 className="font-display text-lg font-extrabold uppercase text-white">{combination.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {combination.items.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="group block">
                      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-white">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <p className="mt-2 truncate text-xs font-bold text-white">{product.name}</p>
                      <p className="text-[11px] text-white/50">MK {product.price.toLocaleString("en-US")}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {suggestions.length > 0 && (
            <div className="mt-10">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                Pairs well with the SB tee
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                {suggestions.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SB STREET */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container">
          <div className="overflow-hidden rounded-2xl bg-gray-900">
            <img
              src={streetImage}
              alt="SB Street lifestyle campaign in Blantyre"
              className="block h-auto w-full"
              loading="lazy"
            />
            <div className="flex flex-col gap-5 px-5 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10">
              <div className="max-w-2xl">
                <p className="eyebrow mb-3 text-primary">Campaign</p>
                <h2 className="font-display text-3xl font-extrabold uppercase leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  {streetPlacement?.headline || streetCampaign?.headline || "Made for the streets of Blantyre."}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
                  {streetPlacement?.body ||
                    streetCampaign?.description ||
                    "Music, movement and everyday hustle. SB Street is the full wardrobe for the city — not just a tee."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:shrink-0 sm:flex-row">
                <Button asChild variant="hero" size="lg">
                  <Link to="/stories">Read the stories <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={streetHref}>{streetPlacement?.ctaLabel || streetCampaign?.ctaLabel || "Shop the wardrobe"}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND PROMISE */}
      <section className="border-t border-gray-200 bg-gray-50 py-14 sm:py-20">
        <div className="container grid gap-6 text-center sm:grid-cols-3">
          <div>
            <Shirt className="mx-auto mb-3 h-7 w-7 text-primary" />
            <p className="font-display text-lg font-extrabold text-gray-900">A Full Wardrobe</p>
            <p className="mt-1 text-sm text-gray-500">Tees, vests, shirts and shorts made to work together.</p>
          </div>
          <div>
            <Sparkles className="mx-auto mb-3 h-7 w-7 text-primary" />
            <p className="font-display text-lg font-extrabold text-gray-900">Rooted in Blantyre</p>
            <p className="mt-1 text-sm text-gray-500">Malawian street culture in every piece.</p>
          </div>
          <div>
            <Truck className="mx-auto mb-3 h-7 w-7 text-primary" />
            <p className="font-display text-lg font-extrabold text-gray-900">Shop Online or In Store</p>
            <p className="mt-1 text-sm text-gray-500">Delivery across Malawi and Blantyre pickup.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
