import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatMWK, culturePillars } from "@/data/products";
import { useCombos } from "@/hooks/useCombos";
import { useProducts } from "@/hooks/useProducts";
import { KitCard } from "@/components/KitCard";
import { KitCardSkeleton } from "@/components/Skeletons";
import { SEO, defaultSEO } from "@/components/SEO";
import {
  Truck, MessageCircle, ShieldCheck, Heart,
  ArrowRight, CheckCircle, BadgePercent,
  Music, Trophy, Zap, Star,
} from "lucide-react";
import hero from "@/assets/hero-lifestyle.jpg";

const Home = () => {
  const { products, loading } = useProducts();
  const combos = useCombos();

  const featuredProducts = products.filter(p => p.is_featured || p.is_best_seller).slice(0, 6);

  return (
    <div>
      <SEO {...defaultSEO.home} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/8 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-400/5 blur-[100px]" />
        </div>
        <div className="container relative grid lg:grid-cols-2 gap-8 sm:gap-12 items-center py-16 sm:py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6 sm:space-y-8"
          >
            <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase">
              Malawi's Streetwear Brand
            </span>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl text-white leading-[0.95] tracking-tight">
              WEAR THE
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">CULTURE.</span>
            </h1>

            <p className="text-gray-400 text-base sm:text-lg max-w-md leading-relaxed">
              Your wardrobe should speak for your music, faith, sports, hustle.
              We curate fits that say what you mean.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-lg shadow-blue-600/25">
                <Link to="/combos">Shop Bundles <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base">
                <Link to="/shop">Individual Items</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <ShieldCheck className="h-4 w-4 text-blue-500" /> 30-Day Guarantee
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Truck className="h-4 w-4 text-blue-500" /> Free Delivery 50K+
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 2,500+ Happy
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-8 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={hero}
                alt="Streetwear Blantyre — wear the culture"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-gray-100">
        <div className="container py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: "Free Delivery", sub: "Over MK 50,000" },
            { icon: MessageCircle, title: "WhatsApp Orders", sub: "Quick & easy" },
            { icon: ShieldCheck, title: "30-Day Guarantee", sub: "On everything" },
            { icon: Heart, title: "2,500+ Happy", sub: "Customers in Malawi" },
          ].map((v) => (
            <div key={v.title} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <v.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{v.title}</p>
                <p className="text-xs text-gray-500">{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CULTURE PILLARS ─── */}
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-3">Four Cultures. One Brand.</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">What Moves You?</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {culturePillars.map((pillar, i) => {
            const iconMap: Record<string, any> = { Music, Trophy, Heart, Zap };
            const PillarIcon = iconMap[pillar.icon] || Zap;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/shop?culture=${pillar.id}`}
                  className="group block rounded-2xl p-6 bg-white border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 h-full"
                >
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ backgroundColor: pillar.color + "15" }}>
                    <PillarIcon className="h-7 w-7" style={{ color: pillar.color }} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{pillar.label}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{pillar.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Shop Now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── WHY BUNDLES ─── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-3">Why Bundles</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Better Than Buying Separate</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: CheckCircle, title: "No Guesswork", desc: "We matched the right pieces for your vibe. No research needed." },
              { icon: BadgePercent, title: "Save 15–25%", desc: "Bundles cost less than buying separate. Better deal. Always." },
              { icon: ShieldCheck, title: "30-Day Guarantee", desc: "Not happy? Send it back. No questions asked." },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center p-8"
              >
                <div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      {featuredProducts.length > 0 && (
        <section className="container py-16 sm:py-20">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-2">Featured</p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900">Top Picks</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/shop">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/product/${p.id}`} className="group block rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    {p.is_best_seller && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-gray-900 text-white rounded-full uppercase tracking-wider">Best Seller</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{p.brand || "Streetwear Blantyre"}</p>
                    <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                    <p className="font-bold text-base text-gray-900">{formatMWK(p.price)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FEATURED BUNDLES ─── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-2">Bundles</p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900">Culture Kits</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/combos">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Three Steps</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-10 max-w-3xl mx-auto">
          {[
            { step: "01", title: "Pick Your Bundle", desc: "Student, work, travel, or casual. Pick the one that fits your vibe." },
            { step: "02", title: "Order", desc: "Checkout online or order in 30 seconds on WhatsApp." },
            { step: "03", title: "Wear It", desc: "Fast delivery across Malawi. Love it or send it back within 30 days." },
          ].map((item) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-5">
                <span className="text-white font-display font-bold text-xl">{item.step}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-gray-950 py-16 sm:py-20">
        <div className="container">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-[0.2em] mb-3">Testimonials</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">What People Say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: "Tendai M.", text: "Best bundles in Malawi. Saved money and got a full outfit delivered to my door.", stars: 5 },
              { name: "Chimwemwe K.", text: "The quality is unmatched. Every piece feels premium. I keep coming back.", stars: 5 },
              { name: "Fatsani P.", text: "Wear the Culture isn't just a slogan — it's real. I feel like myself in these fits.", stars: 5 },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl p-6 bg-white/5 border border-white/10">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-white font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="container py-16 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-10 sm:p-14 md:p-20 text-center">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5" />

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white relative leading-tight">
            Wear the Culture.<br />Make a Statement.
          </h2>
          <p className="text-white/75 text-base sm:text-lg mt-3 max-w-lg mx-auto relative">
            Join 2,500+ Malawians expressing who they are through what they wear.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 relative">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 px-8 py-3.5 rounded-full font-semibold">
              <Link to="/combos">Get Your Bundle Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold">
              <Link to="/shop">Shop Individual Items</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
