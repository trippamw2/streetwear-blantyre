import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatMWK, culturePillars } from "@/data/products";
import { useCombos } from "@/hooks/useCombos";
import { useProducts } from "@/hooks/useProducts";
import { KitCard } from "@/components/KitCard";
import { KitCardSkeleton } from "@/components/Skeletons";
import { SEO, defaultSEO } from "@/components/SEO";
import { Star } from "lucide-react";
import hero from "@/assets/hero-lifestyle.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: "easeOut" },
};

const Home = () => {
  const { products, loading } = useProducts();
  const combos = useCombos();

  const featuredProducts = products.filter(p => p.is_featured || p.is_best_seller).slice(0, 6);

  return (
    <div>
      <SEO {...defaultSEO.home} />

      {/* ─── HERO ─── */}
      <section className="bg-gray-950">
        <div className="container grid lg:grid-cols-2 gap-8 sm:gap-12 items-center py-16 sm:py-20 lg:py-28">
          <div className="space-y-6 sm:space-y-8">
            <span className="inline-flex px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-gray-400">
              Premium African Streetwear
            </span>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl text-white leading-[0.95] tracking-tight">
              Wear Your
              <br />
              Story.
            </h1>

            <p className="text-gray-400 text-base sm:text-lg max-w-md leading-relaxed">
              We celebrate people who create culture instead of chasing it.
              Every piece tells a story. Every garment builds identity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold text-sm sm:text-base">
                <Link to="/shop">Shop the Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 font-semibold text-sm sm:text-base">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-gray-500">
              <span>Made in Malawi</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>Free Delivery 50K+</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>2,500+ Creators</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden">
              <img
                src={hero}
                alt="Streetwear Blantyre — premium African streetwear from Blantyre, Malawi"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-gray-100">
        <div className="container py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            "Free Delivery over MK 50,000",
            "WhatsApp Orders — Quick & Easy",
            "30-Day Guarantee on Everything",
            "2,500+ Happy Creators",
          ].map((item) => (
            <p key={item} className="text-xs font-medium text-gray-500 uppercase tracking-wider">{item}</p>
          ))}
        </div>
      </section>

      {/* ─── CULTURE PILLARS ─── */}
      <section className="container py-24 sm:py-28">
        <div {...fadeUp}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Four Pillars. One Movement.</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-10 sm:mb-12">What Moves You?</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {culturePillars.map((pillar) => (
            <Link
              key={pillar.id}
              to={`/shop?culture=${pillar.id}`}
              className="group block p-6 bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
            >
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{pillar.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{pillar.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── WHY BUNDLES ─── */}
      <section className="bg-gray-50 py-24 sm:py-28">
        <div className="container">
          <div {...fadeUp}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Why Bundles</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-10 sm:mb-12">Better Than Buying Separate</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { title: "No Guesswork", desc: "We matched the right pieces for your vibe. No research needed." },
              { title: "Save 15–25%", desc: "Bundles cost less than buying separate. Better deal. Always." },
              { title: "30-Day Guarantee", desc: "Not happy? Send it back. No questions asked." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      {featuredProducts.length > 0 && (
        <section className="container py-24 sm:py-28">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Featured</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Top Picks</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block bg-white overflow-hidden hover:opacity-95 transition-opacity duration-300">
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                  {p.is_best_seller && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-gray-900 text-white uppercase tracking-wider">Best Seller</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{p.brand || "Streetwear Blantyre"}</p>
                  <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                  <p className="font-bold text-base text-gray-900">{formatMWK(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── FEATURED BUNDLES ─── */}
      <section className="bg-gray-50 py-24 sm:py-28">
        <div className="container">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Bundles</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Culture Kits</h2>
            </div>
            <Link to="/combos" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">View All</Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <KitCardSkeleton />
                <KitCardSkeleton />
                <KitCardSkeleton />
              </>
            ) : (
              combos.slice(0, 3).map((kit, i) => (
                <KitCard key={kit.id} kit={kit} index={i} compact />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="container py-24 sm:py-28">
        <div {...fadeUp}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-10 sm:mb-12">Three Steps</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-10 max-w-3xl mx-auto">
          {[
            { step: "01", title: "Pick Your Bundle", desc: "Student, work, travel, or casual. Pick the one that fits your vibe." },
            { step: "02", title: "Order", desc: "Checkout online or order in 30 seconds on WhatsApp." },
            { step: "03", title: "Wear It", desc: "Fast delivery across Malawi. Love it or send it back within 30 days." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <span className="text-sm font-semibold text-gray-300 tracking-wider">{item.step}</span>
              <h3 className="font-display font-bold text-lg text-gray-900 mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-gray-950 py-24 sm:py-28">
        <div className="container">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">From Our Community</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Stories Worth Wearing</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Tendai M.", text: "Every time I wear SB, I feel like I belong to something bigger. The quality speaks for itself.", stars: 5 },
              { name: "Chimwemwe K.", text: "I built my business wearing these fits. Street culture meets hustle — that's SB.", stars: 5 },
              { name: "Fatsani P.", text: "Wear Your Story isn't just a slogan. I feel like myself in these clothes. Authentic.", stars: 5 },
            ].map((t) => (
              <div key={t.name} className="p-6 bg-white/5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-white font-medium text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="container py-24 sm:py-28">
        <div className="bg-gray-950 p-10 sm:p-14 md:p-20 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
            Wear Your Story.<br />Build Your Legacy.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mt-4 max-w-lg mx-auto">
            Join 2,500+ creators who express who they are through what they wear.
            Every piece tells a story. Yours starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold">
              <Link to="/shop">Shop the Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 font-semibold">
              <Link to="/about">Our Story</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
