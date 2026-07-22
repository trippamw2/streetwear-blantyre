import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import lifestyleMusic from "@/assets/lifestyle-music.jpg";

const About = () => (
  <div>
    <SEO {...defaultSEO.about} />

    {/* ─── HERO ─── */}
    <section className="bg-gray-950 text-white">
      <div className="container py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl space-y-6">
          <span className="inline-block px-4 py-1.5 border border-gray-700 text-gray-400 text-xs font-semibold tracking-[0.15em] uppercase">
            Our Story
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl tracking-tight leading-[0.95]">
            Built for people who wear the culture.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Streetwear Blantyre brings you premium fits for the streets of Malawi.
            We believe your style should say what you mean — whether that's music, faith, sports, or hustle.
          </p>
        </div>
      </div>
    </section>

    {/* ─── LIFESTYLE IMAGE ─── */}
    <section className="container -mt-6 relative z-10">
      <div className="relative overflow-hidden border border-gray-100">
        <img
          src={lifestyleMusic}
          alt="Streetwear Blantyre lifestyle"
          loading="lazy"
          width={1280}
          height={960}
          className="w-full h-[320px] sm:h-[420px] lg:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
      </div>
    </section>

    {/* ─── MISSION ─── */}
    <section className="container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Mission</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900 mb-6">
          Youth Identity. Through Fashion.
        </h2>
        <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
          Blantyre has a culture that deserves to be worn. We started Streetwear Blantyre because
          young Malawians shouldn't have to choose between quality and identity. Every piece we make
          is designed to let you rep what you believe in — your sound, your hustle, your faith, your game.
        </p>
      </div>
    </section>

    {/* ─── FOUR CULTURES ─── */}
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">The Four Pillars</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Wear What Moves You</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "Music Culture", desc: "Beats. Lyrics. Style. Wear your sound." },
            { title: "Sports Culture", desc: "Game day to every day. Athletic street." },
            { title: "Faith Culture", desc: "Purpose-driven. Wear what you believe." },
            { title: "Hustle Culture", desc: "Work hard. Look good. Make moves." },
          ].map((v) => (
            <div key={v.title} className="p-8 bg-white space-y-3 hover:opacity-95 transition-opacity duration-200">
              <h3 className="font-display font-bold text-xl text-gray-900">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── VALUES ─── */}
    <section className="container py-20 sm:py-24">
      <div className="grid sm:grid-cols-3 gap-8">
        {[
          { num: "01", title: "Quality Over Quantity", desc: "Every piece is tested. No filler. No shortcuts." },
          { num: "02", title: "Culture First", desc: "Designed for Malawi. Inspired by the streets." },
          { num: "03", title: "Community Driven", desc: "2,500+ customers. We build for them." },
        ].map((v) => (
          <div key={v.num} className="text-center sm:text-left">
            <span className="font-display font-extrabold text-5xl text-gray-100">{v.num}</span>
            <h3 className="font-display font-bold text-lg text-gray-900 mt-3 mb-2">{v.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="container pb-20 sm:pb-24">
      <div className="bg-gray-900 p-10 sm:p-16 text-center text-white space-y-6">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl">This is Streetwear Blantyre.</h2>
        <p className="text-white/60 max-w-xl mx-auto text-lg">Wear the Culture. Express Who You Are.</p>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-3.5 font-semibold">
          <Link to="/shop">Shop Now <ArrowRight className="h-5 w-5 ml-2" /></Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;
