import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatMWK, getKitPrice, getKitRealSaving, getKitProducts } from "@/data/products";
import { useCombos } from "@/hooks/useCombos";
import { useProducts } from "@/hooks/useProducts";
import { KitCard } from "@/components/KitCard";
import { KitCardSkeleton } from "@/components/Skeletons";
import { SEO, defaultSEO } from "@/components/SEO";
import {
  Truck, MessageCircle, ShieldCheck, Heart,
  BookOpen, Briefcase, Headphones, Luggage,
  ArrowRight, CheckCircle, Zap, BadgePercent,
} from "lucide-react";
import hero from "@/assets/hero-lifestyle.jpg";

const Home = () => {
  const { loading } = useProducts();
  const combos = useCombos();

  return (
    <div>
      <SEO {...defaultSEO.home} />
      {/* ─── FLASH SALE BAR ─── */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 text-center text-xs sm:text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          Free delivery over MK 50,000 &middot; 30-day guarantee &middot; Selling fast
        </span>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="container relative grid lg:grid-cols-2 gap-6 sm:gap-8 items-center py-8 sm:py-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5 sm:space-y-6"
          >
            <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold tracking-wide">
              Streetwear for Malawi
            </span>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-6xl leading-tight">
              Style That Speaks for You.
              <br />
              <span className="text-gradient">We Curated That.</span>
            </h1>

            <p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-lg">
              Outfit running stale? No idea what fits? We picked the tee, hoodie,
              cap, and kicks you need. One box. Fresh look. Less cash.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="hero" size="lg" className="text-sm sm:text-base">
                <Link to="/combos">Shop Fashion Bundles <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-sm sm:text-base border-gray-300">
                <Link to="/shop">Individual Items</Link>
              </Button>
            </div>

            <p className="text-xs text-gray-400">
              30-day guarantee. Not happy? Send it back. No questions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-brand opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl">
              <img
                src={hero}
                alt="Streetwear Blantyre lifestyle"
                className="w-full aspect-[4/5] sm:aspect-[3/4] object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="container py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: "Free Delivery", sub: "Over MK 50,000" },
            { icon: MessageCircle, title: "WhatsApp Order", sub: "Quick & easy" },
            { icon: ShieldCheck, title: "30-Day Guarantee", sub: "On all bundles" },
            { icon: Heart, title: "2,500+ Happy", sub: "Customers in Malawi" },
          ].map((v) => (
            <div key={v.title} className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
                <v.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{v.title}</p>
                <p className="text-xs text-gray-500">{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SHOP BY LIFESTYLE ─── */}
      <section className="container py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Choose Your Lifestyle</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Shop by Lifestyle</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Kits built for how you live. Style for every vibe.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: BookOpen, title: "Student", tag: "student", desc: "Tee, cap, tote. Fresh on campus.", color: "from-blue-500 to-cyan-500" },
            { icon: Briefcase, title: "Work", tag: "work", desc: "Hoodie, joggers, sneakers. Work to weekend.", color: "from-purple-500 to-indigo-500" },
            { icon: Luggage, title: "Travel", tag: "travel", desc: "Jacket, tee, kicks. Out the door.", color: "from-green-500 to-teal-500" },
            { icon: Headphones, title: "Casual", tag: "casual", desc: "Hoodie, denim, cap. Street-ready.", color: "from-orange-500 to-red-500" },
          ].map((item, i) => (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-xl sm:rounded-2xl p-5 sm:p-6 bg-white border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
              <Link
                to="/combos"
                className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                View Kit <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── WHY KITS ─── */}
      <section className="bg-gradient-to-b from-orange-50/50 to-white py-12 sm:py-16">
        <div className="container">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Why Kits</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Better Than Buying Separate</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: CheckCircle, title: "No Guesswork", desc: "We matched the right pieces for your vibe. No research needed." },
              { icon: BadgePercent, title: "Save 15-25%", desc: "Kits cost less than separate. Better deal. Always." },
              { icon: Heart, title: "30-Day Guarantee", desc: "Not happy? Send it back. No questions asked." },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED KITS ─── */}
      <section className="container py-12 sm:py-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Featured Kits</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl">Top Picks</h2>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/combos">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-gradient-to-b from-white to-orange-50/50 py-12 sm:py-16">
        <div className="container">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-sm font-semibold text-gradient uppercase tracking-widest">How It Works</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Three Steps</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Pick Your Bundle", desc: "Student, work, travel, or casual. Pick the one that fits." },
              { step: "02", title: "Order", desc: "Checkout online or order in 30 seconds on WhatsApp." },
              { step: "03", title: "Delivered", desc: "Fast delivery across Malawi. Love it or send it back within 30 days." },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="container pb-12 sm:pb-16">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 p-8 sm:p-12 md:p-16 text-center text-white">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5" />

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl relative">
            Love Your Kit or Send It Back
          </h2>
          <p className="text-white/80 text-sm sm:text-base mt-2 max-w-lg mx-auto relative">
            30-day guarantee. Join 2,500+ customers in Malawi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 relative">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90">
              <Link to="/combos">Get Your Kit Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/shop">Shop Individual Items</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
