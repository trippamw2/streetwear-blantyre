import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import lifestyleMusic from "@/assets/lifestyle-music.jpg";

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
            Built in Blantyre. Loved across Africa.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Most streetwear brands import generic designs that don't know your name.
            We exist because African creators deserve clothing that represents who they are —
            not someone else's idea of style.
          </p>
        </div>
      </div>
    </section>

    {/* ─── LIFESTYLE IMAGE ─── */}
    <section className="container -mt-6 relative z-10">
      <div className="relative overflow-hidden border border-white/10">
        <img
          src={lifestyleMusic}
          alt="Streetwear Blantyre lifestyle — creators from Blantyre, Malawi"
          loading="lazy"
          width={1280}
          height={960}
          className="w-full h-[320px] sm:h-[420px] lg:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/10 to-transparent" />
      </div>
    </section>

    {/* ─── ORIGIN STORY ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">How It Started</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          From a laundromat to a movement.
        </h2>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          Three friends sitting in a Blantyre laundromat, tired of wearing clothes that didn't represent them.
          Generic imports. Foreign logos. Nothing that said "this is who we are."
          So they built what they couldn't find — a brand that speaks the language of African creators.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          What began as weekend projects in a shared dorm room has grown into a brand that employs
          Malawians and serves creators across Africa. Because when you wear SB, you're not just wearing
          clothes — you're wearing your story.
        </p>
        <p className="text-gray-500 text-sm italic">
          Without representation, culture stays silent. We refuse to let that happen.
        </p>
      </div>
    </section>

    {/* ─── MISSION ─── */}
    <section className="bg-gray-900 py-20 sm:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Mission</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-6">
            Identity. Belonging. Legacy.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            People don't buy fashion. They buy identity. They buy belonging.
            They buy the confidence of wearing something that actually means something.
            Generic brands sell you someone else's story. We help you wear your own.
          </p>
          <p className="text-gray-500 text-sm italic mt-4">
            Don't settle for clothes that say nothing. Your identity deserves better.
          </p>
        </div>
      </div>
    </section>

    {/* ─── FOUR PILLARS ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="text-center mb-10 sm:mb-12">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">The Four Pillars</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Wear What Moves You</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
          Most brands have one identity. We have four — because you're not just one thing.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Street Culture", desc: "Proud of where you come from. Your neighborhood, your city, your story." },
          { title: "Music Culture", desc: "Feel the rhythm of Malawi in every stitch. Beats, lyrics, style." },
          { title: "Hustle Culture", desc: "Build what matters. Wear what you earned. Discipline, vision, legacy." },
          { title: "Faith Culture", desc: "Faithfully crafted. Walk by purpose, not by sight." },
        ].map((v) => (
          <div key={v.title} className="p-8 bg-white/5 space-y-3">
            <h3 className="font-display font-bold text-xl text-white">{v.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ─── VALUES ─── */}
    <section className="bg-gray-950 py-20 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">What We Stand For</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Our Values</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { num: "01", title: "Authenticity", desc: "We never sell out cultural integrity. Every piece reflects who we are." },
            { num: "02", title: "Community", desc: "We build communities, not customer bases. People before profit." },
            { num: "03", title: "Quality", desc: "Premium materials, meticulous craftsmanship. Built to last." },
            { num: "04", title: "Creativity", desc: "Always innovate, never imitate. African pride in every stitch." },
          ].map((v) => (
            <div key={v.num} className="text-center">
              <span className="font-display font-extrabold text-5xl text-gray-700">{v.num}</span>
              <h3 className="font-display font-bold text-lg text-white mt-3 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── COMMUNITY ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Community</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          More than a brand. A movement.
        </h2>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          From the artist whose murals inspire our designs, to the entrepreneur who uses our
          clothing to represent her business, to the student who buys her first hoodie with
          her scholarship money — every customer is part of our story. We host Creator Circles
          in community centers, Style Exchange events, and quarterly Cultural Nights celebrating
          different aspects of African heritage.
        </p>
        <p className="text-gray-500 text-sm italic">
          When creators wear their truth, culture grows. When they don't, it fades.
        </p>
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="container pb-20 sm:pb-24">
      <div className="bg-gray-900 p-10 sm:p-16 text-center text-white space-y-6">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl">Join the Movement</h2>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          Your story deserves clothing that reflects who you are. Don't let generic brands
          speak for you. Wear your truth.
        </p>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-3.5 font-semibold">
          <Link to="/shop">Discover Your Culture <ArrowRight className="h-5 w-5 ml-2" /></Link>
        </Button>
      </div>
    </section>
    </div>
  );

export default About;
