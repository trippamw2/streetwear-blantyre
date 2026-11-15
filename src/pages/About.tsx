import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";

const About = () => (
  <div className="bg-gray-950">
    <SEO {...defaultSEO.about} />

    {/* ─── HERO ─── */}
    <section className="bg-gray-950 text-white">
      <div className="container py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl space-y-6">
          <span className="inline-block px-4 py-1.5 border border-gray-700 text-gray-400 text-xs font-semibold tracking-[0.15em] uppercase">
            Our Story
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl tracking-tight leading-[0.95] text-white">
            Rooted in Blantyre.
            <br />
            <span className="text-gray-400">Inspired by Everyday Life.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Style is not just about what you wear. It is about how you live, where you go and how you express yourself.
          </p>
        </div>
      </div>
    </section>

    {/* ─── BRAND STORY ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Story</p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          Born in Blantyre, Malawi, SB is a retail clothing brand inspired by everyday life, urban culture, sport and the freedom of personal style.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          We believe clothing should move with you. From relaxed days outdoors and spontaneous adventures to football moments, city hangouts and everyday experiences, what you wear should reflect who you are.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          That's why we bring together a curated selection of T-shirts, football jerseys and short-sleeve shirts designed for everyday comfort, casual expression and outdoor living.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          We bring different styles, brands and influences together in one place, making it easier to find clothing that fits your personality and lifestyle.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          We are inspired by culture, driven by individuality and connected by a love for style.
        </p>
        <p className="text-gray-500 text-sm italic">SB. Wear Your Identity.</p>
      </div>
    </section>

    {/* ─── MORE THAN CLOTHING ─── */}
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

    {/* ─── CTA ─── */}
    <section className="container pb-20 sm:pb-24">
      <div className="bg-gray-900 p-10 sm:p-16 text-center text-white space-y-6">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl">Discover Our Story</h2>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          SB Streetwear — Wear Your Identity.
        </p>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-3.5 font-semibold rounded-full">
          <Link to="/shop">Shop Collection <ArrowRight className="h-5 w-5 ml-2" /></Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;