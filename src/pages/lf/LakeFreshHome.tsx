import { LFLink } from "@/components/lf/lfRouter";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Fish,
  Leaf,
  Loader2,
  MapPin,
  Scale,
  ShieldCheck,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Truck,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCatalog, useLakeFreshDeliveryConfig, useLakeFreshZones } from "@/hooks/useLakeFresh";
import {
  DEFAULT_LF_DELIVERY_CONFIG,
  formatCutoff,
  formatDeliveryDate,
  getEarliestDeliveryDate,
} from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";

const steps = [
  { title: "Choose your fish", copy: "Pick from today's catch and set the weight you need.", accent: "#08A9E8" },
  { title: "Choose preparation", copy: "Whole, cleaned or portioned — prepared before dispatch.", accent: "#39B54A" },
  { title: "Add a seasoning", copy: "Five signature spice blends, paired to your fish.", accent: "#7ED321" },
  { title: "Pick delivery day", copy: "Order before cutoff for next day delivery across Blantyre.", accent: "#08A9E8" },
];

const categories = [
  {
    to: "/lf/fish",
    label: "The Catch",
    copy: "Chambo, Ncheni and Usipa — priced per kilogram.",
    icon: Fish,
    accent: "#073B78",
    tint: "#EAF6FB",
  },
  {
    to: "/lf/spices",
    label: "Signature Spices",
    copy: "Five blends made for lake fish.",
    icon: Leaf,
    accent: "#39B54A",
    tint: "#F2FBEE",
  },
  {
    to: "/lf/recipes",
    label: "Free Recipes",
    copy: "Simple recipes that travel with your order.",
    icon: BookOpen,
    accent: "#7ED321",
    tint: "#F7FCEB",
  },
  {
    to: "/lf/pro",
    label: "LakeFresh PRO",
    copy: "Wholesale supply for kitchens and caterers.",
    icon: Building2,
    accent: "#08A9E8",
    tint: "#EAF6FB",
  },
];

const trustPoints = [
  { title: "Next day delivery", copy: "Order before cutoff, delivered the next eligible day.", icon: Truck, accent: "#08A9E8" },
  { title: "Freshness first", copy: "Short windows and cold chain handling from lake to door.", icon: Snowflake, accent: "#39B54A" },
  { title: "Honest weights", copy: "Priced per kilogram with clear packed weights.", icon: Scale, accent: "#7ED321" },
];

const whyPoints = [
  { title: "Fresh from the lake", copy: "Short freshness windows and cold chain handling from lake to door.", icon: Fish, accent: "#073B78" },
  { title: "Honest weights", copy: "Priced per kilogram with clear packed weights. No silent overcharging.", icon: Scale, accent: "#39B54A" },
  { title: "Season it right", copy: "Signature spice blends matched to each fish on the catch list.", icon: Leaf, accent: "#7ED321" },
  { title: "Free recipes", copy: "Choose a recipe with your fish — it arrives free with your order.", icon: BookOpen, accent: "#08A9E8" },
  { title: "Business supply", copy: "LakeFresh PRO for restaurants, hotels and caterers.", icon: Building2, accent: "#073B78" },
  { title: "Rewards that add up", copy: "Earn points on every order and refer friends for more.", icon: Sparkles, accent: "#39B54A" },
];

const LakeFreshHome = () => {
  const { data: products, isLoading: productsLoading } = useLakeFreshCatalog();
  const { data: config } = useLakeFreshDeliveryConfig();
  const { data: zones, isLoading: zonesLoading } = useLakeFreshZones();
  const deliveryConfig = config || DEFAULT_LF_DELIVERY_CONFIG;
  const earliest = getEarliestDeliveryDate(new Date(), deliveryConfig);
  const allProducts = products || [];
  const featured = allProducts.slice(0, 3);
  const heroImage = allProducts.find((product) => product.image)?.image || "/brand/lake-fresh/fish-chambo.jpg";

  return (
    <div className="bg-white text-gray-900">
      <SEO
        brand="lake-fresh"
        title="Lake Fresh Fish Mart — Fresh from the Lake. Ready for Your Table."
        description="Fresh fish delivered next day across Blantyre, Malawi. Chambo, Ncheni/Micheni and Usipa — whole, cleaned or portioned, priced per kilogram, with signature spices and free recipes."
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#073B78] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, #08A9E8 0, transparent 42%), radial-gradient(circle at 5% 95%, #39B54A 0, transparent 38%)",
          }}
        />
        <div className="container relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
              <img src="/brand/lake-fresh/icon.png" alt="" className="h-5 w-5 object-contain" />
              Lake Fresh Fish Mart
            </span>
            <h1 className="mt-6 font-display text-[2.35rem] font-extrabold leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl">
              FRESH FROM THE{" "}
              <br />
              <span className="bg-gradient-to-r from-[#7ED321] to-[#08A9E8] bg-clip-text text-transparent">LAKE.</span>{" "}
              <br />
              READY FOR YOUR TABLE.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
              Real fish, honest weights and next day delivery across Blantyre. Add signature spices and a free recipe —
              everything you need for a proper fish meal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LFLink
                to="/lf/fish"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7ED321] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#073B78] transition-transform hover:-translate-y-0.5"
              >
                Shop the catch <ArrowRight className="h-3.5 w-3.5" />
              </LFLink>
              <LFLink
                to="/lf/spices"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <Leaf className="h-4 w-4 text-[#7ED321]" /> Explore spices
              </LFLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7ED321]" /> Next day delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#08A9E8]" /> Priced per kilogram
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#39B54A]" /> Cold chain handled
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -left-3 -top-3 h-24 w-24 rounded-full bg-[#7ED321]/30 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-[#08A9E8]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/20">
              <img
                src={heroImage}
                alt="Fresh fish from Lake Malawi"
                className="h-64 w-full rounded-[1.4rem] object-cover sm:h-80 lg:h-[26rem]"
              />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#073B78]">
                  Wild caught
                </span>
                <span className="rounded-full bg-[#39B54A] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  Delivered fresh
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/10">
          <div className="container grid gap-4 py-5 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"
                  style={{ color: point.accent }}
                >
                  <point.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-white">{point.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">{point.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / FAILURE */}
      <section className="bg-[#F4FBF7]">
        <div className="container grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">The problem</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              TIRED OF UNCERTAIN WEIGHTS, NO DELIVERY AND FISH THAT ISN&apos;T FRESH?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              Most fish sellers leave you guessing on weight, offer no delivery, and give you no guidance on how to
              cook what you buy. Lake Fresh fixes that: priced per kilogram, weighed honestly, delivered next day, with
              seasonings and free recipes so dinner is sorted.
            </p>
          </div>
          <div className="rounded-2xl border border-[#39B54A]/25 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#39B54A]/10 text-[#39B54A]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                The Lake Fresh promise
              </p>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              {["Clear weight, clear price", "Cold chain handling", "Free recipe with every fish", "Next day delivery"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39B54A]" /> {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURED CATCH */}
      <section className="container py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#08A9E8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39B54A]" /> Available now
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              TODAY&apos;S CATCH
            </h2>
          </div>
          <LFLink
            to="/lf/fish"
            className="inline-flex items-center gap-2 rounded-full border border-[#073B78]/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78] transition-colors hover:border-[#39B54A] hover:text-[#39B54A]"
          >
            View all fish <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>

        {productsLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading today&apos;s catch…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, index) => {
              const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
              const accents = ["#39B54A", "#08A9E8", "#7ED321"];
              const accent = accents[index % accents.length];
              return (
                <LFLink
                  key={product.id}
                  to={`/lf/fish/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-44 overflow-hidden bg-[#EAF6FB]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Fish className="h-12 w-12 text-[#08A9E8]" />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        soldOut ? "bg-white/90 text-gray-500" : "bg-[#39B54A] text-white"
                      }`}
                    >
                      {soldOut ? "Sold out" : "Available"}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-[#073B78]">
                        {product.speciesName || product.name}
                      </h3>
                      <Leaf className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-lg font-extrabold text-[#073B78]">
                        {formatMWK(product.pricePerKgMwk)}
                        <span className="ml-1 text-xs font-semibold text-gray-400">/ kg</span>
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: accent }}
                      >
                        Choose weight <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </LFLink>
              );
            })}
            {featured.length === 0 && (
              <p className="col-span-full text-sm text-gray-500">The catch is being restocked. Please check back shortly.</p>
            )}
          </div>
        )}
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="bg-[#F7FBFC]">
        <div className="container py-14 sm:py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">Shop by category</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            EVERYTHING FOR YOUR FISH MEAL
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <LFLink
                key={cat.to}
                to={cat.to}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderTopColor: cat.accent, borderTopWidth: 3 }}
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: cat.tint, color: cat.accent }}
                >
                  <cat.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-extrabold text-[#073B78]">{cat.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{cat.copy}</p>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80"
                  style={{ color: cat.accent }}
                >
                  Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </LFLink>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-gray-200 bg-white">
        <div className="container py-14 sm:py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#08A9E8]">Simple by design</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            HOW ORDERING WORKS
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-gray-200 bg-[#F7FBFC] p-5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ backgroundColor: step.accent }}
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{step.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Daily cutoff: {formatCutoff(deliveryConfig.cutoff)} · Free delivery over{" "}
            {formatMWK(deliveryConfig.freeDeliveryThresholdMwk)}
            {earliest ? ` · Next available: ${formatDeliveryDate(earliest)}` : ""}.
          </p>
        </div>
      </section>

      {/* DELIVERY COVERAGE */}
      <section className="container py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">
              <MapPin className="h-3.5 w-3.5" /> Delivery coverage
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              WE DELIVER ACROSS BLANTYRE
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Choose your neighbourhood at checkout to see the delivery fee and available dates. Delivery fees start at{" "}
              {formatMWK(deliveryConfig.deliveryFeeMwk)}, and orders over{" "}
              {formatMWK(deliveryConfig.freeDeliveryThresholdMwk)} deliver free.
            </p>
            <LFLink
              to="/lf/fish"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#073B78] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#073B78]/90"
            >
              Start your order <ArrowRight className="h-3.5 w-3.5 text-[#7ED321]" />
            </LFLink>
          </div>
          <div className="rounded-2xl border border-[#08A9E8]/25 bg-[#EAF6FB]/60 p-5">
            {zonesLoading ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading areas…
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(zones || []).map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm text-[#073B78]"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39B54A]" />
                    <span className="font-semibold">{zone.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-gray-500">
              Delivery areas are managed by Lake Fresh. Availability can change by day.
            </p>
          </div>
        </div>
      </section>

      {/* WHY LAKE FRESH */}
      <section className="border-y border-gray-200 bg-[#F4FBF7]">
        <div className="container py-14 sm:py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">The difference</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            WHY LAKE FRESH
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyPoints.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${item.accent}14`, color: item.accent }}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#073B78] via-[#07508f] to-[#0a6f9e] py-16 text-white sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #7ED321 0, transparent 32%), radial-gradient(circle at 85% 80%, #08A9E8 0, transparent 35%)",
          }}
        />
        <div className="container relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
            <ShoppingBasket className="h-3.5 w-3.5 text-[#7ED321]" /> Fresh fish, sorted
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            ORDER FRESH TODAY
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Chambo, Ncheni / Micheni and Usipa — priced per kilogram, prepared for your table, delivered next day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LFLink
              to="/lf/fish"
              className="inline-flex items-center justify-center rounded-xl bg-[#7ED321] px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#073B78] transition-transform hover:-translate-y-0.5"
            >
              Browse the catch
            </LFLink>
            <LFLink
              to="/lf/recipes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4 text-[#08A9E8]" /> Free recipes
            </LFLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshHome;
