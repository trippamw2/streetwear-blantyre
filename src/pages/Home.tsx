import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { useProducts } from "@/hooks/useProducts";
import { useTestimonials } from "@/hooks/useTestimonials";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";

const heroImage = "/images/sb/home-menu.jpg";
const lifestyleImage = "/images/sb/blue-streetwear-squad.jpg";
const detailImage = "/images/sb/urban-blue-style-duo.jpg";
const campaignImage = "/images/sb/home-street.jpg";
const editorialImage = "/images/sb/hero-campaign.jpg";

const categoryImages: Record<string, string> = {
  "t-shirts": "/images/sb/home-street.jpg",
  vests: "/images/sb/look-01.jpg",
  "short-sleeve-shirts": "/images/sb/urban-blue-style-duo.jpg",
  shorts: "/images/sb/street-campaign.jpg",
};

const marqueeItems = ["Your Style", "Your Everyday", "Tees", "Vests", "Shirts", "Shorts", "Made For Malawi"];

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease } }),
};

const Home = () => {
  const { products, loading } = useProducts();
  const { testimonials } = useTestimonials(4);
  const featuredProducts = (
    products.filter((p) => p.is_featured || p.is_new_arrival || p.is_best_seller).length > 0
      ? products.filter((p) => p.is_featured || p.is_new_arrival || p.is_best_seller)
      : products
  ).slice(0, 8);

  return (
    <div className="bg-[#fbfbfc] text-[#141414]">
      <SEO
        title="SB | Your Style. Your Everyday."
        description="SB makes everyday streetwear simple. Shop quality tees, vests, shirts, and shorts in Malawi, made for comfort, lifestyle, and convenience."
        path="/"
      />

      {/* HERO - cinematic, full bleed */}
      <section className="relative isolate min-h-[78svh] overflow-hidden bg-[#0a0a0a] sm:min-h-[88svh]">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <img
            src={heroImage}
            alt="SB streetwear clothing"
            className="h-full w-full object-contain object-center sm:object-cover sm:object-[center_20%]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="sb-hero-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(16,44,84,0.35),transparent_55%)]" />

        <div className="container relative flex min-h-[78svh] flex-col justify-end pb-10 pt-28 sm:min-h-[88svh] sm:pb-16 sm:pt-32 lg:pb-20">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="mb-5 inline-flex w-fit items-center gap-2 border border-white/25 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Streetwear in Malawi
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="max-w-4xl font-display text-[clamp(3rem,11vw,8.5rem)] font-extrabold leading-[0.86] tracking-[-0.04em] text-white"
          >
            Your style.
            <span className="block text-white/70">Your everyday.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-white/80 sm:text-lg"
          >
            Quality tees, vests, shirts, and shorts. Made for real life in Malawi.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              to="/shop"
              className="inline-flex h-13 items-center justify-center gap-2 bg-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0a0a0a] transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/collections"
              className="inline-flex h-13 items-center justify-center gap-2 border border-white/35 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10"
            >
              View collections
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-white/65"
          >
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-white/80" /> Quality feel</span>
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-white/80" /> Easy to order</span>
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-white/80" /> Delivered in Malawi</span>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-b border-black/10 bg-[#0a0a0a] py-4 text-white">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="mx-5 inline-flex items-center gap-5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/85 sm:mx-7 sm:text-xs">
              {item} <span className="h-1 w-1 rounded-full bg-primary" />
            </span>
          ))}
        </div>
      </div>

      {/* CATEGORY EDITORIAL GRID */}
      <section className="container py-16 sm:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">The wardrobe</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-6xl text-balance">
              Built for how you live.
            </h2>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]">
            Shop all <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {SB_PRODUCT_TYPES.map((type, index) => (
            <motion.div key={type.slug} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={index}>
              <Link to={`/shop?category=${type.slug}`} className="group relative block overflow-hidden bg-[#111]">
                <div className="aspect-[3/4] overflow-hidden bg-[#111]">
                  <img
                    src={categoryImages[type.slug] || "/images/sb/home-street.jpg"}
                    alt={type.label}
                    className="h-full w-full object-contain object-center p-2 transition-transform duration-[900ms] ease-out group-hover:scale-[1.02] sm:object-cover sm:object-top sm:p-0"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/5 transition-opacity duration-500 group-hover:from-black/80" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">SB Clothing</p>
                  <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">{type.label}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-all group-hover:gap-3 group-hover:text-white">
                    Shop now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EDITORIAL SPLIT - brand story */}
      <section className="border-y border-black/[0.06] bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[340px] overflow-hidden bg-[#111] sm:min-h-[480px] lg:min-h-[720px]">
            <img
              src={lifestyleImage}
              alt="People wearing SB streetwear in Malawi"
              className="absolute inset-0 h-full w-full object-contain object-center sm:object-cover sm:object-top"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-transparent" />
          </div>
          <div className="flex items-center px-6 py-14 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">The SB standard</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-5xl lg:text-6xl text-balance">
                Look sharp. <span className="text-gray-400">Feel easy.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
                SB is everyday streetwear for Malawi. Simple pieces. Good quality. Made for the way you move.
              </p>
              <div className="mt-8 space-y-4 border-t border-black/10 pt-8">
                {[
                  { title: "Quality you can feel", copy: "Clean fits, comfortable fabrics, made to wear often." },
                  { title: "Simple to style", copy: "Tees, vests, shirts, and shorts that work together." },
                  { title: "Easy to get", copy: "Order on your phone and get delivery across Malawi." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <span className="mt-1.5 h-px w-6 shrink-0 bg-primary" />
                    <div>
                      <p className="text-sm font-bold text-[#0a0a0a]">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/about" className="mt-10 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a] underline decoration-black/20 underline-offset-8 transition-colors hover:text-primary hover:decoration-primary/40">
                Our story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container py-16 sm:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Selected for you</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-6xl">
              Popular now.
            </h2>
          </div>
          <Link to="/shop?sort=new" className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]">
            New arrivals <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-gray-900">New pieces are landing soon.</p>
            <p className="mt-2 text-sm text-gray-600">Explore the full collection in the meantime.</p>
            <Link to="/shop" className="mt-6 inline-flex h-12 items-center justify-center bg-primary px-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#0b1f3d]">Browse shop</Link>
          </div>
        )}
      </section>

      {/* CAMPAIGN BANNER */}
      <section className="relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <img src={campaignImage} alt="SB streetwear campaign" className="h-full w-full object-contain object-center opacity-70 sm:object-cover sm:object-center sm:opacity-55" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 sm:from-black/80 sm:via-black/45 sm:to-black/20" />
        </div>
        <div className="container relative py-20 sm:py-28 lg:py-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Everyday streetwear</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl text-balance">
            Dress like you mean it.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            From campus to city streets. One look, ready for the day.
          </p>
          <Link to="/shop" className="mt-8 inline-flex h-13 items-center justify-center gap-2 bg-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0a0a0a] transition-all duration-300 hover:bg-primary hover:text-white">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* TRUST + LIFESTYLE */}
      <section className="border-b border-black/[0.06] bg-[#f6f6f4]">
        <div className="container py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Buy with confidence</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-5xl text-balance">
                Real style. Real support.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">
                Simple shopping, secure payment, and help when you need it.
              </p>

              <div className="mt-8 grid gap-0 border-t border-black/10">
                {[
                  { label: "Secure checkout", value: "Pay safely with PayChangu" },
                  { label: "Delivery", value: "Across Malawi, to your area" },
                  { label: "Easy exchange", value: "14-day size exchange on eligible items" },
                  { label: "Need help?", value: "WhatsApp us anytime" },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-[140px_1fr] gap-4 border-b border-black/10 py-4 sm:grid-cols-[180px_1fr]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.label}</p>
                    <p className="text-sm font-medium text-[#0a0a0a]">{row.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {["PayChangu", "Airtel Money", "TNM Mpamba", "Visa/Mastercard"].map((p) => (
                  <span key={p} className="border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700">{p}</span>
                ))}
              </div>

              <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <MessageCircle className="h-4 w-4" /> WhatsApp +265 982 972 977
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="overflow-hidden bg-[#111]">
                <img src={detailImage} alt="Person wearing SB streetwear" className="h-full min-h-[260px] w-full object-contain object-center sm:min-h-[360px] sm:object-cover sm:object-top" loading="lazy" decoding="async" />
              </div>
              <div className="overflow-hidden bg-[#111]">
                <img src={editorialImage} alt="SB streetwear look" className="h-full min-h-[260px] w-full object-contain object-center sm:min-h-[360px] sm:object-cover sm:object-top" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>

          {testimonials.length > 0 && (
            <div className="mt-16 border-t border-black/10 pt-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Real reviews</p>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-4xl">Worn by real people.</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-white p-5">
                    <div className="flex gap-0.5 text-[#0a0a0a]">{Array.from({ length: Math.max(1, Math.min(5, Math.round(t.rating))) }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                    <p className="mt-4 text-sm leading-relaxed text-gray-700">"{t.message}"</p>
                    <div className="mt-5 flex items-center gap-3 border-t border-black/[0.06] pt-4">
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

      {/* FINAL CTA */}
      <section className="bg-[#0a0a0a] text-white">
        <div className="container grid gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:py-24">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">SB Streetwear</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Your next look <span className="text-white/45">starts here.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:pb-2">
            <Link to="/shop" className="inline-flex h-13 items-center justify-center gap-2 bg-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0a0a0a] transition-all duration-300 hover:bg-primary hover:text-white">
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center justify-center gap-2 border border-white/25 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:border-white hover:bg-white/10">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
