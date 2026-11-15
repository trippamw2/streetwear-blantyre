import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatMWK } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-lifestyle.jpg";

const Home = () => {
  const { products, loading } = useProducts();

  const newArrivals = products.filter(p => p.is_new_arrival).slice(0, 6);
  const featuredProducts = products.filter(p => p.is_featured || p.is_best_seller).slice(0, 6);

  return (
    <div className="bg-white">
      <SEO {...defaultSEO.home} />

      {/* ─── HERO ─── */}
      <section className="relative bg-white">
        <div className="absolute inset-0">
          <img
            src={hero}
            alt="SB Streetwear everyday outdoor lifestyle"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        </div>
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6 sm:space-y-8">
            <span className="inline-flex px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-gray-500">
              SB Streetwear — Blantyre, Malawi
            </span>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl text-gray-900 leading-[0.95] tracking-tight">
              Wear Your
              <br />
              Identity.
            </h1>

            <p className="text-gray-600 text-base sm:text-lg max-w-md leading-relaxed">
              SB is where young people shop clothing that fits their everyday life: T shirts, football jerseys and short sleeve shirts for the streets, the pitch and everywhere in between.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold text-sm sm:text-base rounded-full">
                <Link to="/shop">Shop Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-gray-900 hover:bg-gray-200 px-8 py-3.5 font-semibold text-sm sm:text-base rounded-full">
                <Link to="/about">Explore SB</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SHOP BY CATEGORY ─── */}
      <section className="bg-gray-100 py-16 sm:py-20">
        <div className="container">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">Find Your Style</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-2">Explore clothing for every mood, moment and everyday adventure.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: "T Shirts", desc: "Everyday essentials.", to: "/shop?category=t-shirts", img: "https://placehold.co/600x400/102C54/ffffff?text=T Shirts" },
              { label: "Football Jerseys", desc: "Sport meets style.", to: "/shop?category=jerseys", img: "https://placehold.co/600x400/102C54/ffffff?text=Jerseys" },
              { label: "Short Sleeve Shirts", desc: "Relaxed everyday looks.", to: "/shop?category=short-sleeve-shirts", img: "https://placehold.co/600x400/102C54/ffffff?text=Short+Sleeve+Shirts" },
            ].map((c) => (
              <Link key={c.label} to={c.to} className="group relative block overflow-hidden bg-gray-800">
                <img src={c.img} alt={c.label} className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-display font-bold text-xl text-gray-900">{c.label}</h3>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      {newArrivals.length > 0 && (
        <section className="bg-white container py-24 sm:py-28">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">New Arrivals</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Fresh Drops</h2>
              <p className="text-gray-500 text-sm mt-1">The latest styles added to SB.</p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {newArrivals.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block bg-gray-100 overflow-hidden hover:opacity-95 transition-opacity duration-300">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-white text-gray-900 uppercase tracking-wider">New</span>
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{p.brand || "Streetwear Blantyre"}</p>
                  <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                  <p className="font-bold text-base text-gray-900">{formatMWK(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── FEATURED PRODUCTS ─── */}
      {featuredProducts.length > 0 && (
        <section className="bg-white container py-24 sm:py-28">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">Featured</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Shop the Collection</h2>
              <p className="text-gray-500 text-sm mt-1">Styles worth adding to your wardrobe.</p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block bg-gray-100 overflow-hidden hover:opacity-95 transition-opacity duration-300">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{p.brand || "Streetwear Blantyre"}</p>
                  <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                  <p className="font-bold text-base text-gray-900">{formatMWK(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── LIFESTYLE BRAND STORY ─── */}
      <section className="bg-gray-100 py-20 sm:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">A Way of Life</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">
              More Than Clothing. It's a Way of Life.
            </h2>
            <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
              Life happens outdoors, in the city, on the pitch and everywhere in between. SB brings together fashion for the moments that make life yours.
            </p>
            <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
              Find your fit. Express your style. Live your way.
            </p>
            <Button asChild variant="outline" className="border-white/20 text-gray-900 hover:bg-gray-200 px-8 rounded-full">
              <Link to="/about">Discover Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── WHY SHOP SB ─── */}
      <section className="bg-white container py-20 sm:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">Why Shop SB?</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Built for Everyday Style</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Curated Fashion", desc: "Different styles and brands brought together in one place." },
            { title: "Everyday Versatility", desc: "Clothing for casual wear and outdoor lifestyles." },
            { title: "Convenient Shopping", desc: "Shop online or visit our physical store." },
            { title: "Accessible Fashion", desc: "Discover styles at approachable prices." },
          ].map((b) => (
            <div key={b.title} className="p-6 bg-gray-100 space-y-2">
              <h3 className="font-display font-bold text-lg text-gray-900">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOCIAL / FACEBOOK ─── */}
      <section className="bg-gray-100 py-20 sm:py-24">
        <div className="container text-center space-y-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">Stay Connected</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Stay Connected with SB</h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Discover new arrivals, fresh styles and what's happening at SB.
          </p>
          <Button asChild size="lg" className="bg-white text-navy hover:bg-white/90 px-8 py-3.5 font-semibold rounded-full">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Follow Us on Facebook</a>
          </Button>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="container py-24 sm:py-28">
        <div className="bg-white p-10 sm:p-14 md:p-20 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-gray-900 leading-tight">
            Wear Your Identity.
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mt-4 max-w-lg mx-auto">
            SB Streetwear — clothing for everyday life, sport and outdoor experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 font-semibold rounded-full">
              <Link to="/shop">Shop Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-gray-900 hover:bg-gray-200 px-8 py-3.5 font-semibold rounded-full">
              <Link to="/about">Read Our Story</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;