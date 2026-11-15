import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatMWK } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { SEO, defaultSEO } from "@/components/SEO";
import { Star, Music, Dumbbell, Cross, Briefcase, ArrowRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import hero from "@/assets/hero-lifestyle.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: "easeOut" },
};

const pillarIcons: Record<string, React.ElementType> = {
  music: Music,
  sports: Dumbbell,
  faith: Cross,
  hustle: Briefcase,
};

const Home = () => {
  const { products, loading } = useProducts();

  const featuredProducts = products.filter(p => p.is_featured || p.is_best_seller).slice(0, 6);

  return (
    <div className="bg-gray-950">
      <SEO {...defaultSEO.home} />

      {/* ─── HERO — Image-Dominant ─── */}
      <section className="relative bg-gray-950">
        <div className="absolute inset-0">
          <img
            src={hero}
            alt="African streetwear creators in Blantyre, Malawi"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        </div>
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6 sm:space-y-8">
            <span className="inline-flex px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-gray-400">
              SB Streetwear — Blantyre, Malawi · Ages 15–35
            </span>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl text-white leading-[0.95] tracking-tight">
              Wear Your
              <br />
              Identity.
            </h1>

            <p className="text-gray-300 text-base sm:text-lg max-w-md leading-relaxed">
              SB is where young people shop clothing that fits their everyday life: hip-hop energy, football culture, and casual decent streetwear for the streets, the pitch, and everywhere in between.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold text-sm sm:text-base rounded-full">
                <Link to="/shop">Shop Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 font-semibold text-sm sm:text-base rounded-full">
                <Link to="/about">Explore SB</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-gray-500">
              <span>Made in Malawi</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>Free Delivery 50K+</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>2,500+ Creators</span>
            </div>

            <p className="text-xs text-gray-600 italic max-w-md">
              Fashion fades. Identity lasts. Don't chase trends. Wear purpose.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SHOP BY CATEGORY ─── */}
      <section className="bg-gray-900 py-16 sm:py-20">
        <div className="container">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Find Your Style</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Shop by Category</h2>
            <p className="text-gray-400 text-sm mt-2">Explore clothing for every mood, moment and everyday adventure.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: "T-Shirts", desc: "Everyday essentials.", to: "/shop?category=t-shirts", img: "https://placehold.co/600x400/102C54/ffffff?text=T-Shirts" },
              { label: "Football Jerseys", desc: "Sport meets style.", to: "/shop?category=jerseys", img: "https://placehold.co/600x400/102C54/ffffff?text=Jerseys" },
              { label: "Short-Sleeve Shirts", desc: "Relaxed everyday looks.", to: "/shop?category=short-sleeve-shirts", img: "https://placehold.co/600x400/102C54/ffffff?text=Short+Sleeve+Shirts" },
            ].map((c) => (
              <Link key={c.label} to={c.to} className="group relative block overflow-hidden bg-gray-800">
                <img src={c.img} alt={c.label} className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-display font-bold text-xl text-white">{c.label}</h3>
                  <p className="text-sm text-gray-300">{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-white/10 bg-gray-900">
        <div className="container py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            "Free Delivery over MK 50,000",
            "WhatsApp Orders — Quick & Easy",
            "30 Day Guarantee on Everything",
            "2,500+ Happy Creators",
          ].map((item) => (
            <p key={item} className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item}</p>
          ))}
        </div>
      </section>

      {/* ─── MANIFESTO ─── */}
      <section className="bg-gray-950 border-y border-white/10">
        <div className="container py-28 sm:py-36">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <motion.div {...fadeUp}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.3em]">Manifesto</p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight">
                We believe what you wear says something before you speak.
              </p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
              <p className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
                Clothing is more than fabric. It is identity. It is culture. It is belief. It is ambition.
              </p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="grid sm:grid-cols-3 gap-8 max-w-2xl mx-auto mt-6">
                {[
                  { text: "We don't follow culture. We create it.", icon: null },
                  { text: "We don't wear clothes. We wear our story.", icon: null },
                  { text: "Every piece is a symbol. Every collection is a belief.", icon: null },
                ].map((item) => (
                  <p key={item.text} className="text-sm sm:text-base text-gray-400 leading-relaxed italic">
                    {item.text}
                  </p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── THE PLAN ─── */}
      <section className="bg-gray-900 py-24 sm:py-28">
        <div className="container">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">The Plan</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">Four Steps. One Story.</h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mb-10 sm:mb-12">
              We made it simple. You bring the ambition. We bring the culture.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Discover the Culture", desc: "Explore collections built around beliefs that matter to you." },
              { step: "02", title: "Choose Your Story", desc: "Every piece represents something. Find the one that speaks for you." },
              { step: "03", title: "Wear the Culture", desc: "Order online or on WhatsApp. Delivered across Malawi." },
              { step: "04", title: "Live the Movement", desc: "You're not a customer. You're part of a community building something bigger." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="text-sm font-semibold text-gray-500 tracking-wider">{item.step}</span>
                <h3 className="font-display font-bold text-lg text-white mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS — CULTURE PICKS ─── */}
      {featuredProducts.length > 0 && (
        <section className="bg-gray-950 container py-24 sm:py-28">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Culture Picks</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">Pieces That Speak</h2>
              <p className="text-gray-400 text-sm mt-1">Every piece tells a story. Yours starts here.</p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block bg-gray-900 overflow-hidden hover:opacity-95 transition-opacity duration-300">
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.is_best_seller && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-white text-gray-900 uppercase tracking-wider">Most Worn</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{p.brand || "Streetwear Blantyre"}</p>
                  <h3 className="font-medium text-sm text-white mb-2 line-clamp-1">{p.name}</h3>
                  <p className="font-bold text-base text-white">{formatMWK(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── CULTURE JOURNAL PREVIEW ─── */}
      <section className="bg-gray-950 container py-24 sm:py-28">
        <motion.div {...fadeUp}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.3em] mb-3">The Culture Journal</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">Stories Worth Reading</h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mb-10 sm:mb-12">
            Not a blog. A publication. Stories about music, sport, faith, hustle, and the people building African culture.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { title: "Music That Moves Malawi", desc: "From Blantyre beats to global sound — the artists shaping a generation.", pillar: "Music", color: "text-purple-300" },
            { title: "Built From Nothing", desc: "How young entrepreneurs are rewriting the African hustle story, one business at a time.", pillar: "Hustle", color: "text-red-300" },
            { title: "Faith in Every Stitch", desc: "The spiritual thread that runs through African creativity and craftsmanship.", pillar: "Faith", color: "text-amber-300" },
          ].map((article) => (
            <Link
              key={article.title}
              to="/editorial"
              className="group p-8 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${article.color}`}>{article.pillar}</span>
              <h3 className="font-display font-bold text-xl text-white mt-3 mb-2 group-hover:text-gray-200 transition-colors">{article.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{article.desc}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-gray-500 group-hover:text-white transition-colors uppercase tracking-wider">
                Read Story →
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 rounded-full">
            <Link to="/editorial">Explore the Culture Journal</Link>
          </Button>
        </div>
      </section>

      {/* ─── COMMUNITY STORIES ─── */}
      <section className="bg-gray-900 py-24 sm:py-28">
        <div className="container">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">From Our Community</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Real People. Real Stories.</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
              We don't sell to demographics. We build for a tribe of creators, builders, and believers.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Tendai M.", role: "Musician, Lilongwe", text: "Every time I wear SB, I feel like I belong to something bigger. These clothes speak my language.", icon: Music },
              { name: "Chimwemwe K.", role: "Entrepreneur, Blantyre", text: "I built my business in these fits. SB represents the hustle — building something from nothing.", icon: Briefcase },
              { name: "Fatsani P.", role: "Athlete, Mzuzu", text: "Representing my roots wherever I go. SB reminds me where I come from and where I'm going.", icon: Dumbbell },
            ].map((t) => (
              <div key={t.name} className="p-8 bg-white/5 space-y-4">
                <t.icon className="h-6 w-6 text-gray-500" />
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIFESTYLE BRAND STORY ─── */}
      <section className="bg-gray-900 py-20 sm:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">A Way of Life</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              More Than Clothing. It's a Way of Life.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Life happens outdoors, in the city, on the pitch and everywhere in between. SB brings together fashion for the moments that make life yours.
            </p>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Find your fit. Express your style. Live your way.
            </p>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 rounded-full">
              <Link to="/about">Discover Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── WHY SHOP SB ─── */}
      <section className="bg-gray-950 container py-20 sm:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Why Shop SB?</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Built for Everyday Style</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Curated Fashion", desc: "Different styles and brands brought together in one place." },
            { title: "Everyday Versatility", desc: "Clothing for casual wear and outdoor lifestyles." },
            { title: "Convenient Shopping", desc: "Shop online or visit our physical store." },
            { title: "Accessible Fashion", desc: "Discover styles at approachable prices." },
          ].map((b) => (
            <div key={b.title} className="p-6 bg-white/5 space-y-2">
              <h3 className="font-display font-bold text-lg text-white">{b.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOCIAL / FACEBOOK ─── */}
      <section className="bg-gray-900 py-20 sm:py-24">
        <div className="container text-center space-y-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Stay Connected</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Stay Connected with SB</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            Discover new arrivals, fresh styles and what's happening at SB.
          </p>
          <Button asChild size="lg" className="bg-white text-navy hover:bg-white/90 px-8 py-3.5 font-semibold rounded-full">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Follow Us on Facebook</a>
          </Button>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="container py-24 sm:py-28">
        <div className="bg-gray-950 p-10 sm:p-14 md:p-20 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
            Your Identity Deserves<br />to Be Seen.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mt-4 max-w-lg mx-auto">
            You are not buying a T shirt. You are wearing a statement.
            You are telling the world what you stand for.
            Join 2,500+ creators who refused to blend in.
          </p>
          <p className="text-gray-500 text-xs mt-3 italic">
            Don't chase trends. Wear purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold rounded-full">
              <Link to="/shop">Shop Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 font-semibold rounded-full">
              <Link to="/about">Read Our Story</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
