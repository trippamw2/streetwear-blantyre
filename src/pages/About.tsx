import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Headphones, Zap, Globe, ArrowRight, Heart } from "lucide-react";
import lifestyleMusic from "@/assets/lifestyle-music.jpg";

const About = () => (
  <div>
    <SEO {...defaultSEO.about} />
    <section className="container py-14 sm:py-20">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Our Story</p>
        <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
          Built for people who <span className="text-gradient">wear the culture.</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 leading-relaxed">
          Streetwear Blantyre brings you the culture. Premium fits for the streets of Malawi.
          We believe your style should say what you mean—whether that's music, faith, sports, or hustle.
        </p>
      </div>
    </section>

    <section className="container">
      <div className="relative rounded-3xl overflow-hidden border border-border/50">
        <img
          src={lifestyleMusic}
          alt="Streetwear Blantyre lifestyle"
          loading="lazy"
          width={1280}
          height={960}
          className="w-full h-[380px] sm:h-[420px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>
    </section>

    <section className="container py-16">
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: Headphones, title: "Music Culture", text: "Beats. Lyrics. Style. Wear your sound." },
          { icon: Heart, title: "Faith Culture", text: "Purpose-driven. Wear what you believe." },
          { icon: Zap, title: "Sports Culture", text: "Game day to every day. Athletic street." },
          { icon: Globe, title: "Hustle Culture", text: "Work hard. Look good. Make moves." },
        ].map((v) => (
          <div key={v.title} className="rounded-3xl p-8 bg-card border border-gray-100 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center">
              <v.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-display font-bold text-2xl">{v.title}</h3>
            <p className="text-gray-500">{v.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="container pb-14">
      <div className="rounded-3xl p-10 sm:p-16 bg-gradient-brand text-white text-center space-y-5">
        <h2 className="font-display font-bold text-3xl sm:text-5xl">This is Streetwear Blantyre.</h2>
        <p className="text-white/85 max-w-xl mx-auto">Wear the Culture. Express Who You Are.</p>
        <Button asChild size="xl" className="bg-background text-foreground hover:bg-background/90">
          <Link to="/shop">Shop Now <ArrowRight className="h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  </div>
);

export default About;
