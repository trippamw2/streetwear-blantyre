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
            Built in Blantyre. Loved across Africa.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Streetwear Blantyre exists to celebrate people who create culture instead of chasing it.
            We build communities where African creators express themselves through premium streetwear
            that represents their stories, their resilience, and their dreams.
          </p>
        </div>
      </div>
    </section>

    {/* ─── LIFESTYLE IMAGE ─── */}
    <section className="container -mt-6 relative z-10">
      <div className="relative overflow-hidden border border-gray-100">
        <img
          src={lifestyleMusic}
          alt="Streetwear Blantyre lifestyle — creators from Blantyre, Malawi"
          loading="lazy"
          width={1280}
          height={960}
          className="w-full h-[320px] sm:h-[420px] lg:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
      </div>
    </section>

    {/* ─── ORIGIN STORY ─── */}
    <section className="container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">How It Started</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">
          From a laundromat to a movement.
        </h2>
        <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
          Streetwear Blantyre started when three friends sitting in a Blantyre laundromat
          realized their community needed clothing that represented who they were — not generic
          imports from abroad. What began as weekend projects in a shared dorm room has grown
          into a brand that employs Malawians and serves creators across Africa.
        </p>
        <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
          Our journey reflects the very values we believe in: create rather than imitate,
          community over commerce, authenticity over hype. Every SB item carries the story
          of its inspiration — whether it's a melody from a local DJ, a neighborhood
          celebration, or an entrepreneurial success story.
        </p>
      </div>
    </section>

    {/* ─── MISSION ─── */}
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Mission</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900 mb-6">
            Identity. Belonging. Legacy.
          </h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            We believe people don't buy fashion. They buy identity. They buy belonging.
            They buy confidence. They buy stories. They buy meaning.
            Streetwear Blantyre exists to celebrate people who create culture — the builders,
            the dreamers, the hustlers, the faithful — through premium streetwear that
            represents who they are and where they come from.
          </p>
        </div>
      </div>
    </section>

    {/* ─── FOUR PILLARS ─── */}
    <section className="container py-20 sm:py-24">
      <div className="text-center mb-10 sm:mb-12">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">The Four Pillars</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Wear What Moves You</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Street Culture", desc: "Proud of where you come from. Your neighborhood, your city, your story." },
          { title: "Music Culture", desc: "Feel the rhythm of Malawi in every stitch. Beats, lyrics, style." },
          { title: "Hustle Culture", desc: "Build what matters. Wear what you earned. Discipline, vision, legacy." },
          { title: "Faith Culture", desc: "Faithfully crafted. Walk by purpose, not by sight." },
        ].map((v) => (
          <div key={v.title} className="p-8 bg-gray-50 space-y-3">
            <h3 className="font-display font-bold text-xl text-gray-900">{v.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
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
    <section className="container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Community</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">
          More than a brand. A movement.
        </h2>
        <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
          From the artist whose murals inspire our designs, to the entrepreneur who uses our
          clothing to represent her business, to the student who buys her first hoodie with
          her scholarship money — every customer is part of our story. We host Creator Circles
          in community centers, Style Exchange events, and quarterly Cultural Nights celebrating
          different aspects of African heritage.
        </p>
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="container pb-20 sm:pb-24">
      <div className="bg-gray-900 p-10 sm:p-16 text-center text-white space-y-6">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl">Join the Movement</h2>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          Your story deserves clothing that reflects who you are. Wear your truth.
        </p>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-3.5 font-semibold">
          <Link to="/shop">Shop the Collection <ArrowRight className="h-5 w-5 ml-2" /></Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;
