import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KitCard } from "@/components/KitCard";
import { useCombos } from "@/hooks/useCombos";
import { useWearableCategories } from "@/hooks/useWearableCategories";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ArrowRight, MessageCircle } from "lucide-react";

const benefits = [
  { title: "Better value", desc: "Less than buying the pieces separately." },
  { title: "Styled for you", desc: "Pieces chosen to work together, not against each other." },
  { title: "One delivery", desc: "A full look arrives in one order." },
];

const Combos = () => {
  const combos = useCombos();
  const { categories } = useWearableCategories();

  return (
    <div className="min-h-screen bg-white">
      <SEO {...defaultSEO.combos} />

      {/* HERO */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl space-y-5">
            <span className="inline-block rounded-full border border-gray-300 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
              Save up to 25% vs buying separately
            </span>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Your outfit.
              <br />
              One order.
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
              Not sure what goes together? Our kits put a full look in one place, chosen for the
              street, the pitch and everyday life.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" variant="hero">
                <a
                  href={buildWhatsAppLink("Hi Wear What Speaks, which kit should I pick?")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Find my kit
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop">
                  Shop All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-gray-200 bg-white">
        <div className="container grid gap-4 py-8 sm:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KITS */}
      <section className="container py-16 sm:py-20">
        <div className="mb-10 text-center sm:mb-12">
          <p className="eyebrow mb-3 text-primary">Pick Your Kit</p>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Kits & Bundles
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Each kit solves a style problem. No filler, just pieces your wardrobe will use.
          </p>
        </div>

        {combos.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {combos.map((kit, i) => (
              <KitCard key={kit.id} kit={kit} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="font-display text-xl font-bold text-gray-900">New kits are on the way</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              In the meantime, shop individual pieces or ask us on WhatsApp what is available.
            </p>
            <Button asChild className="mt-6" variant="hero">
              <Link to="/shop">Shop all</Link>
            </Button>
          </div>
        )}
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container text-center">
          <p className="eyebrow mb-2 text-primary">Need Just One Thing?</p>
          <h2 className="font-display text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Every piece is also available on its own.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-primary/40 hover:text-primary"
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Combos;
