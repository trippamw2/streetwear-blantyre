import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KitCard } from "@/components/KitCard";
import { useCombos } from "@/hooks/useCombos";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const Combos = () => {
  const combos = useCombos();

  return (
    <div>
      <SEO {...defaultSEO.combos} />

      {/* ─── HERO ─── */}
      <section className="bg-gray-950 text-white overflow-hidden">
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="relative max-w-2xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 border border-gray-700 text-gray-400 text-xs font-semibold tracking-[0.15em] uppercase mb-6">
              Save 15% vs buying separate
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
              YOUR OUTFIT.
              <br />
              ONE BOX.
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Outfit looking stale? Nothing goes together? We picked the tee, hoodie, cap, and kicks you need.
              Styled. Reliable. Cheaper together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href={buildWhatsAppLink("Hi Streetwear Blantyre! Which bundle should I pick?")}
                target="_blank" rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 w-full sm:w-auto px-8 py-3.5 font-semibold">
                  Need Help? Chat
                </Button>
              </a>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto px-8 py-3.5 font-semibold">
                <Link to="/shop">Browse Culture Pieces</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY BUNDLES ─── */}
      <section className="border-b border-gray-100">
        <div className="container py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: "Save 15–25%", desc: "Less than buying separate. Always." },
              { title: "No Research Needed", desc: "We matched the right pieces for your vibe." },
              { title: "30-Day Guarantee", desc: "Not happy? Send it back. Simple." },
            ].map((item) => (
              <div key={item.title} className="p-4 bg-gray-50">
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KITS GRID ─── */}
      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Pick Your Kit</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Culture Kits</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Each bundle solves a style problem. No filler. Just what your wardrobe needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          {combos.map((kit, i) => (
            <KitCard key={kit.id} kit={kit} index={i} />
          ))}
        </div>
      </section>

      {/* ─── BROWSE BY CATEGORY ─── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Need Just One Thing?</p>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 text-sm mt-2">Every item available individually too</p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { label: "T-Shirts", cat: "t-shirts" },
              { label: "Hoodies", cat: "hoodies" },
              { label: "Caps", cat: "caps" },
              { label: "Hut Caps", cat: "hut-caps" },
              { label: "Bracelets", cat: "bracelets" },
              { label: "Socks", cat: "socks" },
              { label: "Stickers", cat: "stickers" },
              { label: "Earbuds", cat: "earbuds" },
            ].map((item) => (
              <Link
                key={item.cat}
                to={`/shop?cat=${item.cat}`}
                className="px-6 py-3 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Combos;
