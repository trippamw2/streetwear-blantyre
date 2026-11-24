import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock3, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { useProducts } from "@/hooks/useProducts";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";

const heroImage = "/images/sb/home-menu.jpg";
const lifestyleImage = "/images/sb/blue-streetwear-squad.png";
const detailImage = "/images/sb/urban-blue-style-duo.png";

const categoryImages: Record<string, string> = {
  "t-shirts": "/images/sb/home-street.jpg",
  vests: "/images/sb/look-01.jpg",
  "short-sleeve-shirts": "/images/sb/urban-blue-style-duo.png",
  shorts: "/images/sb/street-campaign.jpg",
};

const planSteps = [
  {
    title: "Choose your fit",
    copy: "Pick from tees, vests, shirts, and shorts designed for everyday wear.",
  },
  {
    title: "Order in minutes",
    copy: "Simple checkout, clear sizing, and support when you need it.",
  },
  {
    title: "Wear it your way",
    copy: "Comfortable, quality streetwear that fits campus, city, and weekend life.",
  },
];

const proofPoints = [
  { icon: ShieldCheck, title: "Quality you can feel", copy: "Fabric, fit, and finish chosen for everyday confidence." },
  { icon: Clock3, title: "Convenience first", copy: "Easy browsing, quick checkout, and helpful local support." },
  { icon: Truck, title: "Delivered across Malawi", copy: "Reliable delivery from Blantyre to your doorstep." },
];

const Home = () => {
  const { products, loading } = useProducts();
  const featuredProducts = (products.filter((p) => p.is_featured || p.is_new_arrival || p.is_best_seller).length > 0
    ? products.filter((p) => p.is_featured || p.is_new_arrival || p.is_best_seller)
    : products
  ).slice(0, 8);

  return (
    <div className="bg-white text-gray-950">
      <SEO
        title="SB | Your Style. Your Everyday."
        description="SB makes everyday streetwear simple. Shop quality tees, vests, shirts, and shorts in Malawi, made for comfort, lifestyle, and convenience."
        path="/"
      />

      {/* Hero - StoryBrand: character + problem/desire */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#f5f7fa]">
        <div className="container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">Streetwear Clothing | Blantyre, Malawi</p>
            <h1 className="mt-5 font-display text-[2.75rem] font-extrabold leading-[0.92] tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
              Look good.
              <span className="block text-primary">Feel ready.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
              Finding clothes that feel right shouldn't be complicated. SB makes everyday streetwear simple with quality tees, vests, shirts, and shorts built for your lifestyle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 rounded-none px-8 text-sm font-semibold uppercase tracking-[0.12em]">
                <Link to="/shop">Shop the Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-12 rounded-none px-8 text-sm font-semibold uppercase tracking-[0.12em] text-gray-900 hover:bg-gray-100">
                <Link to="/collections">New Arrivals</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Quality fabrics</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Everyday comfort</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fair everyday prices</span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden bg-gray-100">
              <img src={heroImage} alt="SB streetwear clothing" className="block h-auto w-full object-contain" loading="eager" />
            </div>
            <div className="absolute bottom-4 left-4 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:bottom-6 sm:left-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">The SB Standard</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Streetwear made for real life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide / value proposition */}
      <section className="border-b border-gray-200">
        <div className="container grid gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="overflow-hidden bg-gray-100">
            <img src={lifestyleImage} alt="People wearing SB streetwear" className="block h-auto w-full object-contain" loading="lazy" />
          </div>
          <div className="max-w-xl lg:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">Why SB</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
              Clothes that keep up with your day.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-gray-600">
              You want to look put together without overthinking it. SB gives you streetwear essentials that feel comfortable, look sharp, and fit your routine, from campus runs to city moves and weekend plans.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              We focus on the clothing you actually wear: <span className="font-semibold text-gray-900">tees, vests, shirts, and shorts</span>. No noise, just quality pieces at everyday prices.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline" className="h-11 rounded-none border-gray-300 px-6 text-sm font-semibold uppercase tracking-[0.1em]">
                <Link to="/about">Our Story <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - clothing only */}
      <section className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">Shop by Category</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">The essentials.</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">Four staples. Endless ways to wear them.</p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:text-primary">
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SB_PRODUCT_TYPES.map((type) => (
            <Link key={type.slug} to={`/shop?category=${type.slug}`} className="group relative overflow-hidden bg-gray-100">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={categoryImages[type.slug] || "/images/sb/home-street.jpg"}
                  alt={type.label}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">SB Clothing</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{type.label}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white/90">
                  Shop now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Plan */}
      <section className="bg-gray-950 py-16 text-white sm:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-200">How it works</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Getting dressed should be easy.</h2>
          </div>
          <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
            {planSteps.map((step, i) => (
              <div key={step.title} className="bg-gray-950 p-6 sm:p-8">
                <p className="text-sm font-semibold text-blue-200">0{i + 1}</p>
                <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products - real DB */}
      <section className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">Featured</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Ready when you are.</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              Popular picks and new arrivals from the latest SB collection.
            </p>
          </div>
          <Link to="/shop?sort=new" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:text-primary">
            Shop new arrivals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
            <p className="font-display text-2xl font-bold text-gray-900">New pieces are landing soon.</p>
            <p className="mt-2 text-sm text-gray-600">In the meantime, explore the full collection.</p>
            <Button asChild className="mt-6 rounded-none px-8">
              <Link to="/shop">Browse Shop</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Proof / quality-convenience */}
      <section className="border-y border-gray-200 bg-[#f5f7fa]">
        <div className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">The SB Promise</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
              Premium feel. Everyday ease.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-gray-600">
              Good style shouldn't feel out of reach or hard to buy. SB brings you quality streetwear, a simple shopping experience, and dependable local delivery, all at prices made for everyday life.
            </p>
            <div className="mt-8 space-y-5">
              {proofPoints.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-950">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden bg-gray-100">
            <img src={detailImage} alt="SB clothing detail and style" className="block h-auto w-full object-contain" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Closing CTA - success */}
      <section className="container py-16 sm:py-20">
        <div className="grid overflow-hidden bg-primary text-white lg:grid-cols-[1fr_auto]">
          <div className="px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-100">SB Streetwear</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Your everyday style, sorted.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-50">
              Skip the stress. Find tees, vests, shirts, and shorts you’ll actually want to wear, made for comfort, quality, and real life.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-none bg-white px-8 text-sm font-semibold uppercase tracking-[0.12em] text-primary hover:bg-blue-50">
                <Link to="/shop">Shop All Clothing</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-none border-white/40 bg-transparent px-8 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 hover:text-white">
                <Link to="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
          <div className="hidden items-end justify-end p-10 lg:flex">
            <p className="max-w-[14rem] text-right text-sm leading-relaxed text-blue-100">
              Quality streetwear.<br />Simple shopping.<br />Everyday prices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
