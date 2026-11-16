import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useWearableCategories } from "@/hooks/useWearableCategories";
import { SEO, defaultSEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  MapPin,
  Shirt,
  Sparkles,
  Sun,
  Trophy,
  Truck,
  Wallet,
} from "lucide-react";
import hero from "@/assets/hero-lifestyle.jpg";

const FACEBOOK_URL = import.meta.env.VITE_FACEBOOK_URL || "https://www.facebook.com/";

const categoryLookup: Record<
  string,
  { line: string; copy: string; icon: typeof Shirt }
> = {
  "t-shirts": {
    line: "Everyday essentials.",
    copy: "Clean fits, strong graphics and the tees you reach for first.",
    icon: Shirt,
  },
  jerseys: {
    line: "Sport meets style.",
    copy: "Pitch energy for match days, city days and everything after.",
    icon: Trophy,
  },
  "short-sleeve-shirts": {
    line: "Relaxed everyday looks.",
    copy: "Easy, breathable shirts for warm days and late plans.",
    icon: Sun,
  },
  vests: {
    line: "Sleeveless essentials.",
    copy: "Clean, breathable vests for layering or wearing solo.",
    icon: Shirt,
  },
};

const categoryStyles = [
  {
    className: "bg-primary text-white",
    accent: "text-white/70",
    arrow: "bg-white text-primary",
  },
  {
    className: "bg-gray-900 text-white",
    accent: "text-white/65",
    arrow: "bg-white text-gray-900",
  },
  {
    className: "bg-gray-100 text-gray-900 border border-gray-200",
    accent: "text-gray-500",
    arrow: "bg-primary text-white",
  },
];

const benefits = [
  {
    title: "Curated Fashion",
    copy: "Different styles and brands brought together in one place.",
    icon: Sparkles,
  },
  {
    title: "Everyday Versatility",
    copy: "Clothing for casual wear, outdoor days and city life.",
    icon: Sun,
  },
  {
    title: "Convenient Shopping",
    copy: "Shop online or visit our physical store in Blantyre.",
    icon: Truck,
  },
  {
    title: "Accessible Fashion",
    copy: "Discover styles at approachable prices, in Malawi Kwacha.",
    icon: Wallet,
  },
];

const Home = () => {
  const { products, loading } = useProducts();
  const { categories } = useWearableCategories();

  const newArrivals = products
    .filter((p) => p.is_new_arrival)
    .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
    .slice(0, 4);
  const newIds = new Set(newArrivals.map((p) => p.id));
  const featuredProducts = products
    .filter((p) => !newIds.has(p.id))
    .sort(
      (a, b) =>
        Number(Boolean(b.is_featured || b.is_best_seller)) -
          Number(Boolean(a.is_featured || a.is_best_seller)) ||
        Number(Boolean(b.image)) - Number(Boolean(a.image)),
    )
    .slice(0, 4);

  const categoryLinks = categories.map((category, index) => {
    const match = categoryLookup[category.slug];
    const style = categoryStyles[index % categoryStyles.length];
    return {
      name: category.name,
      slug: category.slug,
      line: match?.line || "New category",
      copy: match?.copy || category.description || "Fresh pieces added to the SB collection.",
      icon: match?.icon || Shirt,
      ...style,
    };
  });

  return (
    <div className="bg-white">
      <SEO {...defaultSEO.home} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-950">
        <img
          src={hero}
          alt="SB Streetwear everyday outdoor lifestyle in Blantyre"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 to-gray-950/25" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/70 to-transparent" />

        <div className="container relative flex min-h-[78vh] flex-col justify-center py-20 sm:min-h-[84vh] sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6 sm:space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/25 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
                Blantyre, Malawi
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Wear Your Identity
              </span>
            </div>

            <h1 className="font-display text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Style That{" "}
              <br />
              Moves With You.
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              From everyday essentials to football inspired fashion, discover clothing that fits
              your lifestyle. Made for the street, the pitch and everywhere in between.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                <Link to="/shop">
                  Shop Collection <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/about">Explore SB</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Delivery across Malawi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Blantyre store pickup
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND TICKER */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 sm:gap-x-10">
          <span>Street Culture</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>Football Energy</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>Everyday Style</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>Outdoor Living</span>
        </div>
      </div>

      {/* SHOP BY CATEGORY */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2 text-primary">Find Your Style</p>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Shop by Category
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Explore clothing for every mood, moment and everyday adventure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {categoryLinks.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.slug}
                  to={`/shop?category=${card.slug}`}
                  className={`group flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 sm:min-h-[17rem] sm:p-7 ${card.className}`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className={`h-7 w-7 ${card.accent}`} />
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 ${card.arrow}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${card.accent}`}>
                      {card.line}
                    </p>
                    <h3 className="font-display text-2xl font-extrabold leading-tight">{card.name}</h3>
                    <p className={`max-w-[16rem] text-xs leading-relaxed ${card.accent}`}>{card.copy}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container">
          <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="eyebrow mb-2 text-primary">Fresh Drops</p>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
                New Arrivals
              </h2>
              <p className="mt-2 text-sm text-gray-500">The latest styles added to SB.</p>
            </div>
            <Link
              to="/shop"
              className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900 hover:text-primary sm:inline-flex"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
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
                    <div className="h-8 w-full rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {newArrivals.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-12">
              <Shirt className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-display text-xl font-bold text-gray-900">New drops are landing soon</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Message us on WhatsApp to hear about new stock first, or visit the kiosk in Blantyre.
              </p>
              <Button asChild className="mt-5" variant="hero">
                <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">
                  Ask About New Stock
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-16 sm:py-24">
          <div className="container">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <div>
                <p className="eyebrow mb-2 text-primary">The Latest Finds</p>
                <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Shop the Collection
                </h2>
                <p className="mt-2 text-sm text-gray-500">Styles worth adding to your wardrobe.</p>
              </div>
              <Link
                to="/shop"
                className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900 hover:text-primary sm:inline-flex"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {featuredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LIFESTYLE STORY */}
      <section className="bg-gray-950">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[20rem] lg:min-h-full">
            <img
              src={hero}
              alt="Everyday street style in Blantyre"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent lg:bg-gradient-to-r" />
          </div>
          <div className="flex flex-col justify-center px-5 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
            <p className="eyebrow mb-3 text-white/50">A Way of Life</p>
            <h2 className="font-display max-w-lg text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl lg:text-5xl">
              More Than Clothing. It&apos;s a Way of Life.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Life happens outdoors, in the city, on the pitch and everywhere in between. SB brings
              together fashion for the moments that make life yours.
            </p>
            <p className="mt-3 max-w-lg text-sm font-medium text-white/85">
              Find your fit. Express your style. Live your way.
            </p>
            <div className="mt-7">
              <Button asChild variant="hero" size="lg" className="bg-white text-primary hover:bg-gray-100">
                <Link to="/about">
                  Discover Our Story <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SHOP SB */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
            <p className="eyebrow mb-3 text-primary">Why Shop SB?</p>
            <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Built for Everyday Style
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-primary/30"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-bold text-gray-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{benefit.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FACEBOOK */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container">
          <div className="overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="eyebrow mb-3 text-white/55">Stay Connected</p>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
              Stay Connected with SB
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Discover new arrivals, fresh styles and what&apos;s happening at SB.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                  Follow Us on Facebook
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:border-white hover:bg-white/10 hover:text-white"
              >
                <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white pb-20 pt-4 sm:pb-24">
        <div className="container">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center sm:px-12 sm:py-20">
            <p className="eyebrow mb-3 text-primary">SB Streetwear</p>
            <h2 className="font-display text-3xl font-extrabold uppercase leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              Wear Your Identity.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">
              Clothing for everyday life, sport and outdoor experiences. Inspired by Blantyre,
              made for the way you live.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="hero">
                <Link to="/shop">
                  Shop Collection <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Read Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
