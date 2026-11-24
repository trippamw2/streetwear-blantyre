import { Link } from "react-router-dom";
import { ArrowRight, Compass, Heart, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";

const values = [
  {
    icon: Sparkles,
    title: "Curated, not cluttered",
    copy: "We select pieces that fit real life and real style, so shopping feels easy and intentional.",
  },
  {
    icon: Layers,
    title: "One store, many styles",
    copy: "From everyday basics to standout pieces, SB brings together essentials for different moods and moments.",
  },
  {
    icon: Compass,
    title: "Rooted in urban life",
    copy: "Inspired by the energy of city life, youth culture, and the everyday creativity of our community.",
  },
  {
    icon: Heart,
    title: "Made for every version of you",
    copy: "Campus, weekend, creative, casual, or dressed up. SB is here for all the ways you show up.",
  },
];

const About = () => (
  <div className="bg-white">
    <SEO {...defaultSEO.about} path="/about" />

    <section className="border-b border-gray-200 bg-[#f7f8fb]">
      <div className="container grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">About SB</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
            Your style, your everyday.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
            SB is a modern urban streetwear and lifestyle store built for people who want style that fits real life. We bring together clothing, footwear, accessories, and everyday essentials in one place, curated for confidence, comfort, and self expression.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            We are not here for one look or one lane. SB is for campus days, city moves, creative moments, weekend plans, and everything in between.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/shop">Shop the Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white">
          <img src="/images/sb/urban-blue-style-duo.png" alt="SB urban lifestyle style" className="h-auto w-full object-contain" loading="eager" />
        </div>
      </div>
    </section>

    <section className="container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">What We Stand For</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
          A style destination built around you
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          Our goal is simple: make it easier to discover pieces that feel current, wearable, and true to your everyday life.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-gray-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="border-t border-gray-200 bg-gray-950 py-14 text-white sm:py-20">
      <div className="container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">SB Promise</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Style should feel accessible, confident, and personal.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">
            We curate with intention, communicate clearly, and keep improving the experience so you can shop with confidence. From discovery to delivery, SB is here to make everyday style simpler.
          </p>
        </div>
        <Button asChild size="lg" className="bg-white text-gray-950 hover:bg-gray-100">
          <Link to="/shop">Explore New Arrivals</Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;
