import { Link } from "react-router-dom";
import { ArrowRight, Compass, Heart, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";

const values = [
  { icon: Sparkles, title: "Easy to choose", copy: "Only clothes that fit real life." },
  { icon: Layers, title: "Everyday essentials", copy: "Tees, vests, shirts, and shorts." },
  { icon: Compass, title: "Urban style", copy: "Made for Malawi city life." },
  { icon: Heart, title: "For you", copy: "For school, work, and weekends." },
];

const About = () => (
  <div className="bg-white">
    <SEO {...defaultSEO.about} path="/about" />

    <section className="border-b border-gray-200 bg-[#f7f8fb]">
      <div className="container grid gap-6 py-10 sm:py-14 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="order-2 max-w-xl lg:order-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">About SB</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Your style, every day.</h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            SB makes streetwear simple. We sell tees, vests, shirts, and shorts that feel good and look good.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/shop">Shop now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300"><Link to="/contact">Chat with us</Link></Button>
          </div>
        </div>
        <div className="order-1 overflow-hidden rounded-[2rem] border border-gray-200 bg-white lg:order-2">
          <img src="/images/sb/urban-blue-style-duo.jpg" alt="SB urban lifestyle style" className="h-auto w-full object-contain" loading="eager" fetchPriority="high" decoding="async" />
        </div>
      </div>
    </section>

    <section className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">What we stand for</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">Style made simple.</h2>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-gray-950">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{copy}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="border-t border-gray-200 bg-gray-950 py-12 text-white sm:py-16">
      <div className="container grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">SB Promise</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Good style. Easy shopping.</h2>
          <p className="mt-3 text-sm text-gray-300 sm:text-base">We make it easy to find clothes you love and get them delivered.</p>
        </div>
        <Button asChild size="lg" className="bg-white text-gray-950 hover:bg-gray-100"><Link to="/shop">Shop now</Link></Button>
      </div>
    </section>
  </div>
);

export default About;
