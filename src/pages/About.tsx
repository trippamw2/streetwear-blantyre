import { Link } from "react-router-dom";
import { ArrowRight, Compass, Heart, Layers, Sparkles } from "lucide-react";
import { SEO, defaultSEO } from "@/components/SEO";

const values = [
  { icon: Sparkles, title: "Easy to choose", copy: "Only clothes that fit real life." },
  { icon: Layers, title: "Everyday essentials", copy: "Tees, vests, shirts, and shorts." },
  { icon: Compass, title: "Urban style", copy: "Made for Malawi city life." },
  { icon: Heart, title: "For you", copy: "For school, work, and weekends." },
];

const About = () => (
  <div className="bg-[#fbfbfc] text-[#141414]">
    <SEO {...defaultSEO.about} path="/about" />

    <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#0a0a0a] text-white">
      <div className="absolute inset-0">
        <img src="/images/sb/urban-blue-style-duo.jpg" alt="" aria-hidden="true" className="h-full w-full object-contain object-center opacity-35 sm:object-cover sm:object-top" loading="eager" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
      </div>
      <div className="container relative py-20 sm:py-28 lg:py-32">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">About SB</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl text-balance">
          Your style, <span className="text-white/45">every day.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          SB makes streetwear simple. Tees, vests, shirts, and shorts that feel good and look good.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/shop" className="inline-flex h-13 items-center justify-center gap-2 bg-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0a0a0a] transition-all duration-300 hover:bg-primary hover:text-white">
            Shop now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/contact" className="inline-flex h-13 items-center justify-center gap-2 border border-white/25 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:border-white hover:bg-white/10">
            Chat with us
          </Link>
        </div>
      </div>
    </section>

    <section className="container py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">What we stand for</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-5xl text-balance">Style made simple.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">Good clothes should be easy. Easy to choose, easy to wear, easy to love.</p>
        </div>
        <div className="grid gap-px bg-black/10 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="bg-[#fbfbfc] p-6 sm:p-8">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-[#0a0a0a]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-black/[0.06] bg-white">
      <div className="grid lg:grid-cols-2">
        <div className="bg-[#111]">
          <img src="/images/sb/blue-streetwear-squad.jpg" alt="SB streetwear in everyday life" className="h-full min-h-[320px] w-full object-contain object-center sm:object-cover sm:object-top" loading="lazy" decoding="async" />
        </div>
        <div className="flex items-center px-6 py-14 sm:px-10 lg:px-16">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">SB Promise</p>
            <h2 className="mt-4 font-display text-4xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#0a0a0a] sm:text-5xl">Good style. Easy shopping.</h2>
            <p className="mt-5 text-base leading-relaxed text-gray-600">We make it easy to find clothes you love and get them delivered across Malawi.</p>
            <Link to="/shop" className="mt-8 inline-flex h-12 items-center justify-center gap-2 bg-[#141414] px-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-primary">
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default About;
