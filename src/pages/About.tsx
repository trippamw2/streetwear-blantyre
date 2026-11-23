import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { ArrowRight, Mic2, Shirt, Zap } from "lucide-react";

const pillars = [
  { icon: Mic2, title: "Hip Hop Roots", copy: "Built from the rhythm, bars and bold energy that move the culture." },
  { icon: Zap, title: "Street Energy", copy: "Made for the block, the hustle and every moment you show up." },
  { icon: Shirt, title: "Everyday Fit", copy: "Comfortable pieces that look sharp without trying too hard." },
];

const reasons = [
  { title: "One Clear Style", desc: "Streetwear designed around Hip Hop and street lifestyle culture." },
  { title: "Built to Wear", desc: "Pieces you can move in, layer up and wear every day." },
  { title: "Easy to Shop", desc: "Order online or pick up in Blantyre, with support on WhatsApp." },
  { title: "Made for You", desc: "Quality fits at approachable prices, in Malawi Kwacha." },
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
            Your Style.
            <br />
            <span className="text-primary">Your Voice.</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            You know who you are. We make streetwear for the Hip Hop and street lifestyle so your clothes can speak as loud as you do.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Wear What Speaks.
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
        <div className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          <p>
            Street culture is more than what you wear. It is the music in your ears, the confidence in your walk and the story you tell without saying a word.
          </p>
          <p>
            We built this brand for people who live the Hip Hop lifestyle. Every tee, vest, shirt and short is made to help you look good, feel ready and own your moment.
          </p>
          <p className="font-semibold text-gray-900">
            You bring the voice. We bring the fit.
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
            One culture. One voice.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Hip Hop is not just music. It is a lifestyle. We design for people who carry that energy everywhere they go.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{pillar.copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* WHY SHOP WITH US */}
    <section className="container py-16 sm:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <p className="eyebrow mb-3 text-primary">Why Shop With Us</p>
        <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Streetwear that gets you.
        </h2>
      </div>
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => (
          <div key={reason.title} className="rounded-2xl border border-gray-200 p-6">
            <h3 className="font-display text-base font-bold text-gray-900">{reason.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{reason.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="container pb-16 sm:pb-24">
      <div className="rounded-2xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
        <p className="eyebrow mb-3 text-white/70">Wear What Speaks</p>
        <h2 className="font-display text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl md:text-5xl">
          Find Your Fit.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          Find the pieces that match your energy. Streetwear built for the Hip Hop lifestyle, ready when you are.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
            <Link to="/shop">
              Shop all <ArrowRight className="h-4 w-4" />
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
