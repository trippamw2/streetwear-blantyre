import { Link } from "react-router-dom";
import { ArrowRight, Search, ShieldCheck, Sparkles, Truck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { SEO, defaultSEO } from "@/components/SEO";
import { useProducts } from "@/hooks/useProducts";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";

const heroImage = "/images/sb/home-menu.jpg";
const lifestyleImage = "/images/sb/blue-streetwear-squad.png";
const editorialImage = "/images/sb/urban-blue-style-duo.png";

const CATEGORY_CARDS = [
  {
    title: "Clothing",
    description: "Tees, shirts, vests, shorts and everyday layers.",
    to: "/shop",
    image: "/images/sb/home-street.jpg",
  },
  {
    title: "Footwear",
    description: "Sneakers and shoes made for movement and style.",
    to: "/shop?search=shoes",
    image: "/images/sb/look-01.jpg",
  },
  {
    title: "Accessories",
    description: "Bags, caps, and finishing touches that complete the fit.",
    to: "/shop?search=accessories",
    image: "/images/sb/street-campaign.jpg",
  },
  {
    title: "Lifestyle Essentials",
    description: "Curated everyday picks for your routine and your vibe.",
    to: "/collections",
    image: "/images/sb/hero-campaign.jpg",
  },
];

const COMMUNITIES = [
  {
    title: "Campus Trendsetters",
    copy: "Clean fits, easy layers, and standout essentials for class, hangouts, and everyday campus life.",
  },
  {
    title: "Thrift Curators",
    copy: "Unique pieces, smart styling, and character-rich finds for people who love making style personal.",
  },
  {
    title: "Culture Shapers",
    copy: "Bold looks for creatives, tastemakers, and anyone shaping the vibe around them.",
  },
  {
    title: "Weekend Flexers",
    copy: "Relaxed, confident outfits for off-duty days, linkups, and moments that call for effortless style.",
  },
];

const VALUES = [
  {
    icon: Sparkles,
    title: "Curated Style",
    copy: "A thoughtful selection of pieces that work together across your lifestyle.",
  },
  {
    icon: ShieldCheck,
    title: "Quality You Can Trust",
    copy: "Products chosen for everyday wear, comfort, and lasting value.",
  },
  {
    icon: Search,
    title: "Easy Shopping",
    copy: "Simple discovery, clear product details, and a smooth path from browse to checkout.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    copy: "Convenient delivery across Malawi with clear updates and support.",
  },
];

const Home = () => {
  const { products, loading } = useProducts();

  const featured = products
    .filter((p) => p.is_featured || p.is_best_seller || p.is_new_arrival)
    .slice(0, 8);
  const fallbackFeatured = products.slice(0, 8);
  const featuredProducts = featured.length > 0 ? featured : fallbackFeatured;

  return (
    <div className="bg-white">
      <SEO {...defaultSEO.home} path="/" />

      {/* Hero */}
      <section className="border-b border-gray-200 bg-[#f7f8fb]">
        <div className="container py-8 sm:py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div className="order-2 max-w-xl lg:order-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-primary">SB Urban Lifestyle Store</p>
              <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                Your Style.
                <span className="block text-primary">Your Everyday.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
                Everything your everyday style needs, in one place. Discover curated streetwear and lifestyle essentials for campus, city, weekends, and every version of you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-7 text-sm font-semibold">
                  <Link to="/shop">
                    Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 border-gray-300 px-7 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                  <Link to="/collections">Explore Collections</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                <span>Curated for everyday life</span>
                <span>Blantyre, Malawi</span>
                <span>Delivery nationwide</span>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
                <img
                  src={heroImage}
                  alt="SB urban streetwear campaign"
                  className="block h-auto w-full object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category discovery */}
      <section className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Shop by Category</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Find what fits your day
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              From everyday clothing to finishing touches, explore the essentials that make your style feel complete.
            </p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORY_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                <img src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-bold text-gray-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {SB_PRODUCT_TYPES.map((type) => (
            <Link
              key={type.slug}
              to={`/shop?category=${type.slug}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              {type.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Community / Lifestyle */}
      <section className="bg-gray-950 py-16 text-white sm:py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="overflow-hidden rounded-[2rem] border border-white/10">
              <img src={lifestyleImage} alt="SB community lifestyle" className="h-auto w-full object-contain" loading="lazy" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Made for Every Version of You</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Style for the way you actually live
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
                SB is built around real lifestyles. Whether you are dressing for campus, curating your own look, shaping culture, or stepping out for the weekend, there is something here for you.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {COMMUNITIES.map((community) => (
                  <div key={community.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-display text-lg font-bold text-white">{community.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">{community.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Featured Picks</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Fresh finds, ready to wear
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Discover popular picks and new arrivals selected from the SB collection.
            </p>
          </div>
          <Link to="/shop?sort=new" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            View new arrivals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
            <p className="font-display text-xl font-bold text-gray-900">New products are coming soon</p>
            <p className="mt-2 text-sm text-gray-600">Check back shortly for fresh arrivals from SB.</p>
            <Button asChild className="mt-6">
              <Link to="/shop">Browse Shop</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Editorial / value */}
      <section className="border-y border-gray-200 bg-[#f7f8fb] py-16 sm:py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">The SB Experience</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
                More than a store. A style destination.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
                SB brings together urban fashion, lifestyle essentials, and everyday confidence. We curate pieces that help you look good, feel comfortable, and move through your day your way.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {VALUES.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white">
              <img src={editorialImage} alt="SB urban style editorial" className="h-auto w-full object-contain" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-16 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-white sm:px-10 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100">SB</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your everyday style starts here.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-50 sm:text-base">
            Shop the latest drops, discover essentials, and build a wardrobe that moves with you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-white px-7 text-primary hover:bg-blue-50">
              <Link to="/shop">Shop the Collection</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 border-white/40 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blue-100">
            <RefreshCw className="h-4 w-4" />
            <span>Need help? We are here on WhatsApp and in store.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
