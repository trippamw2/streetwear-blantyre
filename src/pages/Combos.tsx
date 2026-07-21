import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KitCard } from "@/components/KitCard";
import { useCombos } from "@/hooks/useCombos";
import { SEO, defaultSEO } from "@/components/SEO";
import { BadgePercent, ShieldCheck, Zap, ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const Combos = () => {
  const combos = useCombos();

  return (
    <div>
      <SEO {...defaultSEO.combos} />
      {/* ─── HERO BANNER ─── */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="container relative py-10 sm:py-14 lg:py-20">
          {/* bg accent */}
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4">
              <BadgePercent className="h-3.5 w-3.5" /> Save 15% vs buying separate
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Your Outfit. <br />
              <span className="text-blue-400">One Box. Less Cash.</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-lg mx-auto leading-relaxed">
              Outfit looking stale? Nothing goes together? We picked the tee, hoodie,
              cap, and kicks you need. Styled. Reliable. Cheaper together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <a
                href={buildWhatsAppLink("Hi Streetwear Blantyre! Which bundle should I pick?")}
                target="_blank" rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto shadow-lg shadow-green-500/25">
                  <MessageCircle className="h-5 w-5 mr-2" /> Need help? Chat
                </Button>
              </a>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                <Link to="/shop">Browse Individual Items</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY KITS BANNER ─── */}
      <section className="border-b border-gray-100 bg-gray-50/50">
        <div className="container py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: BadgePercent, title: "Save 15-25%", desc: "Less than buying separate. Always." },
              { icon: Zap, title: "No Research Needed", desc: "We matched the right pieces for your vibe." },
              { icon: ShieldCheck, title: "30-Day Guarantee", desc: "Not happy? Send it back. Simple." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm">{item.title}</p>
                  <p className="text-[11px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KITS GRID ─── */}
      <section className="container py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Pick Your Kit</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Your Lifestyle, Your Power</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Each bundle solves a style problem. No filler. Just what your wardrobe needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {combos.map((kit, i) => (
            <KitCard key={kit.id} kit={kit} index={i} />
          ))}
        </div>
      </section>

      {/* ─── BROWSE INDIVIDUAL CTA ─── */}
      <section className="bg-gradient-to-b from-white to-gray-50/50 py-10 sm:py-14">
        <div className="container text-center">
          <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Need Just One Thing?</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Shop by Category</h2>
          <p className="text-gray-500 text-sm mt-2">Every item available individually too</p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { label: "T-Shirts", cat: "t-shirts" },
              { label: "Hoodies", cat: "hoodies" },
              { label: "Sneakers", cat: "sneakers" },
              { label: "Caps", cat: "caps" },
              { label: "Pants", cat: "pants" },
              { label: "Accessories", cat: "accessories" },
            ].map((item) => (
              <Link
                key={item.cat}
                to={`/shop?cat=${item.cat}`}
                className="px-5 py-3 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
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
