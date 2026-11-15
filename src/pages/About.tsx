import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight, MapPin, Music, Shirt, Trophy } from "lucide-react";

const pillars = [
  { icon: MapPin, title: "Street", copy: "Where you come from and how you carry it." },
  { icon: Trophy, title: "Sport", copy: "Match day energy, discipline and the love of the game." },
  { icon: Music, title: "Entertainment", copy: "The rhythm, sound and culture of the city." },
  { icon: Shirt, title: "Everyday", copy: "Fits that work for real life, not just the photo." },
];

const reasons = [
  { title: "Curated Fashion", desc: "Different styles and brands brought together in one place." },
  { title: "Everyday Versatility", desc: "Clothing for casual wear, outdoor days and city life." },
  { title: "Convenient Shopping", desc: "Shop online or visit our physical store in Blantyre." },
  { title: "Accessible Fashion", desc: "Discover styles at approachable prices, in Malawi Kwacha." },
];

const About = () => (
  <div className="bg-white">
    <SEO {...defaultSEO.about} />

    {/* HERO */}
    <section className="border-b border-gray-200 bg-gray-50">
      <div className="container py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl space-y-5">
          <span className="eyebrow inline-block rounded-full border border-gray-300 px-4 py-1.5 text-gray-600">
            Our Story
          </span>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-gray-900 sm:text-5xl lg:text-7xl">
            Rooted in Blantyre.
            <br />
            <span className="text-primary">Built for everyday style.</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Style is not just about what you wear. It is about how you live, where you go and how you
            express yourself.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            SB Streetwear. Wear Your Identity.
          </p>
        </div>
      </div>
    </section>

    {/* STORY */}
    <section className="container py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-3 text-primary">Who We Are</p>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Clothing that moves with you.
          </h2>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-gray-500 sm:text-base">
          <p>
            Born in Blantyre, Malawi, SB is a retail clothing brand inspired by everyday life, urban
            culture, sport and the freedom of personal style.
          </p>
          <p>
            We believe clothing should move with you. From relaxed days outdoors and spontaneous
            adventures to football moments, city hangouts and everyday experiences, what you wear
            should reflect who you are.
          </p>
          <p>
            That is why we bring together a curated selection of T shirts, football jerseys and short
            sleeve shirts designed for everyday comfort, casual expression and outdoor living.
          </p>
          <p>
            We bring different styles, brands and influences together in one place, making it easier
            to find clothing that fits your personality and lifestyle.
          </p>
          <p className="font-semibold text-gray-900">
            Inspired by culture. Driven by individuality. Connected by a love for style.
          </p>
        </div>
      </div>
    </section>

    {/* PILLARS */}
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="eyebrow mb-3 text-primary">A Way of Life</p>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            More Than Clothing
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Life happens outdoors, in the city, on the pitch and everywhere in between.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-primary/30"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-bold text-gray-900">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{pillar.copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* WHY SHOP SB */}
    <section className="container py-16 sm:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <p className="eyebrow mb-3 text-primary">Why Shop SB?</p>
        <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Built for Everyday Style
        </h2>
      </div>
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => (
          <div key={reason.title} className="rounded-2xl border border-gray-200 p-6">
            <h3 className="font-display text-base font-bold text-gray-900">{reason.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{reason.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="container pb-16 sm:pb-24">
      <div className="rounded-2xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
        <p className="eyebrow mb-3 text-white/55">Wear Your Identity</p>
        <h2 className="font-display text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl md:text-5xl">
          Find Your Fit.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          Explore T shirts, football jerseys and short sleeve shirts made for the way you live.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
            <Link to="/shop">
              Shop the Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:border-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/contact">Talk to Us</Link>
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default About;
