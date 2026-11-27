import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock3, MessageCircle, ShieldCheck, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { useProducts } from "@/hooks/useProducts";
import { useTestimonials } from "@/hooks/useTestimonials";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";

const heroImage = "/images/sb/home-menu.jpg";
const lifestyleImage = "/images/sb/blue-streetwear-squad.jpg";
const detailImage = "/images/sb/urban-blue-style-duo.jpg";

const categoryImages: Record<string, string> = {
  "t-shirts": "/images/sb/home-street.jpg",
  vests: "/images/sb/look-01.jpg",
  "short-sleeve-shirts": "/images/sb/urban-blue-style-duo.jpg",
  shorts: "/images/sb/street-campaign.jpg",
};

const planSteps = [
  { title: "Pick your look", copy: "Choose tees, vests, shirts, or shorts." },
  { title: "Order fast", copy: "Easy checkout. Help on WhatsApp if you need it." },
  { title: "Wear it", copy: "Feel good at school, work, or weekends." },
];

const proofPoints = [
  { icon: ShieldCheck, title: "Good quality", copy: "Made to feel good and last." },
  { icon: Clock3, title: "Easy to buy", copy: "Simple shopping on your phone." },
  { icon: Truck, title: "Delivered in Malawi", copy: "We deliver to your area." },
];

const Home = () => {
  const { products, loading } = useProducts();
  const { testimonials } = useTestimonials(4);
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

      {/* Hero - visual first, mobile first */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#f5f7fa]">
        <div className="container grid items-center gap-6 py-6 sm:py-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:py-16">
          <div className="order-2 max-w-xl lg:order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Streetwear in Malawi</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.9] tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
              Look good.
              <span className="block text-primary">Feel ready.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
              Easy streetwear for every day. Tees, vests, shirts, and shorts you’ll love to wear.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-none px-8 text-sm font-semibold uppercase tracking-[0.12em]">
                <Link to="/shop">Shop now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-none border-gray-300 px-8 text-sm font-semibold uppercase tracking-[0.12em]">
                <Link to="/shop?sort=new">New in</Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Good quality</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Easy to order</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Fair prices</span>
            </div>
          </div>

          <div className="order-1 relative lg:order-2">
            <div className="overflow-hidden bg-gray-100">
              <img src={heroImage} alt="SB streetwear clothing" className="block h-auto w-full object-contain" loading="eager" fetchPriority="high" />
            </div>
            <div className="absolute bottom-3 left-3 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:bottom-6 sm:left-6 sm:px-4 sm:py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">SB Everyday</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Made for real life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual lifestyle / short value prop */}
      <section className="border-b border-gray-200">
        <div className="container grid gap-6 py-12 sm:py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="overflow-hidden bg-gray-100">
            <img src={lifestyleImage} alt="People wearing SB streetwear" className="block h-auto w-full object-contain" loading="lazy" />
          </div>
          <div className="max-w-xl lg:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Why SB</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
              Clothes for your real day.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Look good without stress. SB brings you comfy tees, vests, shirts, and shorts at fair prices.
            </p>
            <Button asChild variant="outline" className="mt-6 h-11 rounded-none border-gray-300 px-6 text-sm font-semibold uppercase tracking-[0.1em]">
              <Link to="/about">About SB <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories - visual grid first */}
      <section className="container py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Shop by category</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Pick your style.</h2>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:text-primary">
            View all <ArrowRight className="h-4 w-4" />
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

      {/* Plan - short */}
      <section className="bg-gray-950 py-12 text-white sm:py-16">
        <div className="container">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-200">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Easy in 3 steps.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {planSteps.map((step, i) => (
              <div key={step.title} className="border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-blue-200">0{i + 1}</p>
                <h3 className="mt-3 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products - visual first */}
      <section className="container py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Featured</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Popular now.</h2>
          </div>
          <Link to="/shop?sort=new" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:text-primary">
            New arrivals <ArrowRight className="h-4 w-4" />
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

      {/* Real people / trust */}
      <section className="border-y border-gray-200 bg-[#f5f7fa]">
        <div className="container py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Real SB style</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">See it. Trust it. Wear it.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {proofPoints.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-950">{title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["PayChangu", "Airtel Money", "TNM Mpamba", "Visa/Mastercard"].map((p) => (
                  <span key={p} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700">{p}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Need help? <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> WhatsApp +265 982 972 977</a>
              </p>
            </div>
            <div className="order-1 grid grid-cols-2 gap-3 lg:order-2">
              <img src={detailImage} alt="Person wearing SB streetwear" className="h-full w-full rounded-xl object-cover" loading="lazy" decoding="async" />
              <img src="/images/sb/blue-streetwear-squad.jpg" alt="People wearing SB clothing" className="h-full w-full rounded-xl object-cover" loading="lazy" decoding="async" />
            </div>
          </div>

          {testimonials.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Real reviews</p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">What customers say.</h3>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex gap-0.5 text-amber-400">{Array.from({ length: Math.max(1, Math.min(5, Math.round(t.rating))) }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-700">"{t.message}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      {t.image ? <img src={t.image} alt={t.name} className="h-9 w-9 rounded-full object-cover" loading="lazy" decoding="async" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{t.name.slice(0, 1)}</div>}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.role || "SB customer"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-12 sm:py-16">
        <div className="overflow-hidden bg-primary px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100">SB Streetwear</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to look good?</h2>
          <p className="mt-3 max-w-lg text-base text-blue-50">Find your next tee, vest, shirt, or shorts today.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-none bg-white px-8 text-sm font-semibold uppercase tracking-[0.12em] text-primary hover:bg-blue-50">
              <Link to="/shop">Shop now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-none border-white/40 bg-transparent px-8 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 hover:text-white">
              <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer">WhatsApp us</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
