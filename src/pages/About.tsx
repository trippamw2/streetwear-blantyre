import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight, Music, Dumbbell, Cross, Briefcase } from "lucide-react";
import lifestyleMusic from "@/assets/lifestyle-music.jpg";

const values = [
  { num: "01", title: "Identity", desc: "We believe who you are matters. Every piece helps you express it." },
  { num: "02", title: "Culture", desc: "We celebrate where you come from. Roots are power." },
  { num: "03", title: "Craftsmanship", desc: "Every stitch intentional. Built to last. Made for creators." },
  { num: "04", title: "Community", desc: "We build movements, not customer bases. People before profit." },
];

const pillars = [
  { icon: Music, title: "Music Culture", desc: "Feel the rhythm of Malawi in every stitch. Beats, lyrics, style.", color: "text-purple-300" },
  { icon: Dumbbell, title: "Sports Culture", desc: "Game day energy. The grind that builds champions.", color: "text-green-300" },
  { icon: Cross, title: "Faith Culture", desc: "Rooted in purpose. Faith is the foundation.", color: "text-amber-300" },
  { icon: Briefcase, title: "Hustle Culture", desc: "Built from nothing. Every piece tells the come-up story.", color: "text-red-300" },
];

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
            We Are Not a Clothing Brand.
            <br />
            <span className="text-gray-400">We Are a Movement.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            This is not a story about fabric. It is a story about identity.
            About a group of young Malawians who refused to wear someone else's story.
          </p>
        </div>
      </div>
    </section>

    {/* ─── LIFESTYLE IMAGE ─── */}
    <section className="container -mt-6 relative z-10">
      <div className="relative overflow-hidden border border-white/10">
        <img
          src={lifestyleMusic}
          alt="Streetwear Blantyre — creators from Blantyre, Malawi"
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
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-6">
          Three friends. One laundromat. A question that changed everything.
        </h2>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          It started in a Blantyre laundromat. Three young creators waiting for their laundry,
          talking about the clothes they wished existed. Everything they could find was imported.
          Generic. Empty. Logos that meant nothing. Designs that said nothing about who they were.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          "Why does nothing represent us?"
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          That question became Streetwear Blantyre. Because we believe what you wear says something
          before you speak. And if no one was making clothes that represented young Africans,
          we would build it ourselves.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          What started as weekend projects in a dorm room is now a movement worn by musicians,
          athletes, entrepreneurs, students, and dreamers across Africa. We employ Malawians.
          We source responsibly. We build for the culture.
        </p>
        <p className="text-gray-500 text-sm italic">
          We don't follow culture. We create it. We don't wear clothes. We wear our story.
        </p>
      </div>
    </section>

    {/* ─── MISSION ─── */}
    <section className="bg-gray-900 py-20 sm:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Purpose</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-6">
            Help Ambitious Young Africans Express Who They Are.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            We are not in the clothing business. We are in the Identity Expression Business.
            Streetwear is simply our medium. Every garment is a symbol. Every collection
            represents a belief. Every purchase is an expression of identity.
          </p>
          <p className="text-gray-500 text-sm italic mt-4">
            Fashion fades. Identity lasts. Don't chase trends. Wear purpose.
          </p>
        </div>
      </div>
    </section>

    {/* ─── WHAT WE BELIEVE ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">What We Believe</p>
        <div className="space-y-6">
          {[
            "We believe clothing speaks before people do.",
            "We believe fashion is a language.",
            "We believe identity matters.",
            "We believe culture matters.",
            "We believe ambition deserves to be seen.",
            "We believe where you come from is part of your power.",
            "We believe everyone has a story worth wearing.",
          ].map((belief) => (
            <p key={belief} className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight">
              {belief}
            </p>
          ))}
        </div>
      </div>
    </section>

    {/* ─── VALUES ─── */}
    <section className="bg-gray-900 py-20 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Values</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Built on Purpose</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {values.map((v) => (
            <div key={v.num} className="text-center">
              <span className="font-display font-extrabold text-5xl text-gray-700">{v.num}</span>
              <h3 className="font-display font-bold text-lg text-white mt-3 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── FOUR PILLARS ─── */}
    <section className="bg-gray-950 container py-20 sm:py-24">
      <div className="text-center mb-10 sm:mb-12">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">The Four Pillars</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Wear What Moves You</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
          You are not just one thing. Neither are we. Four pillars. One movement.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {pillars.map((p) => (
          <div key={p.title} className="p-8 bg-white/5 space-y-4">
            <p.icon className={`h-6 w-6 ${p.color}`} />
            <h3 className="font-display font-bold text-xl text-white">{p.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ─── COMMUNITY ─── */}
    <section className="bg-gray-900 container py-20 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Our Community</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          More Than Customers. A Tribe.
        </h2>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          We don't sell to demographics. We build for a tribe. Creators. Musicians. Athletes.
          Entrepreneurs. Students. Dreamers. Believers. Artists. Builders. Young Africans
          creating a better future.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          Every person who wears SB is part of something bigger than themselves. A movement
          that says: we are proud of where we come from, excited about where we are going,
          and we will wear our story every step of the way.
        </p>
        <p className="text-gray-500 text-sm italic">
          When creators wear their truth, culture grows. When they don't, it fades.
        </p>
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="container pb-20 sm:pb-24">
      <div className="bg-gray-900 p-10 sm:p-16 text-center text-white space-y-6">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl">Become Part of the Culture</h2>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          You don't need to change who you are. You need to express who you already are.
          We help you do that. One piece at a time.
        </p>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-3.5 font-semibold rounded-full">
          <Link to="/shop">Shop Collection <ArrowRight className="h-5 w-5 ml-2" /></Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;
