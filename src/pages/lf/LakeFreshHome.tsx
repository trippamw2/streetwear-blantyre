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
  PackageCheck,
  Scale,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Truck,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCatalog, useLakeFreshDeliveryConfig, useLakeFreshZones } from "@/hooks/useLakeFresh";
import {
  DEFAULT_LF_DELIVERY_CONFIG,
  formatDeliveryDate,
  getEarliestDeliveryDate,
} from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";
import { lfDisplayCopy } from "@/lib/lfCopy";
import {
  LF_PILOT_DELIVERY_PROMISE,
  LF_PILOT_FISH_NAMES,
  LF_PILOT_OFFER,
  LF_PILOT_ZONE_NAMES,
} from "@/lib/lfPilot";

const steps = [
  { title: "Pick your fish", copy: `Choose from three fish: ${LF_PILOT_FISH_NAMES}.`, accent: "#08A9E8" },
  { title: "Choose your cut", copy: "Whole, cleaned, cleaned and cut, or seasoned with your spice.", accent: "#39B54A" },
  { title: "Add one free recipe", copy: "Pick one free recipe. We pack it with your fish.", accent: "#7ED321" },
];

const categories = [
  {
    to: "/lf/fish",
    label: "The Catch",
    copy: `Three fish options: ${LF_PILOT_FISH_NAMES}.`,
    icon: Fish,
    accent: "#073B78",
    tint: "#EAF6FB",
  },
  {
    to: "/lf/spices",
    label: "Seasonings",
    copy: "Five seasonings made for lake fish.",
    icon: Leaf,
    accent: "#39B54A",
    tint: "#F2FBEE",
  },
  {
    to: "/lf/recipes",
    label: "Free Recipes",
    copy: "One free recipe comes with every order.",
    icon: BookOpen,
    accent: "#7ED321",
    tint: "#F7FCEB",
  },
  {
    to: "/lf/pro",
    label: "For Business",
    copy: "Fresh fish for shops, hotels and caterers.",
    icon: Building2,
    accent: "#08A9E8",
    tint: "#EAF6FB",
  },
];

const trustPoints = [
  { title: "At your door tomorrow", copy: `${LF_PILOT_DELIVERY_PROMISE} in our three areas.`, icon: Truck, accent: "#08A9E8" },
  { title: "Cleaned and cut", copy: "We clean your fish and cut it the way you like.", icon: PackageCheck, accent: "#39B54A" },
  { title: "You choose the weight", copy: "You see the price for each kilogram before you pay.", icon: Scale, accent: "#7ED321" },
];

const whyPoints = [
  { title: "We know fresh fish", copy: "We clean, weigh and pack every fish ourselves.", icon: Fish, accent: "#073B78" },
  { title: "An honest price", copy: "You pay for each kilogram. No hidden charges.", icon: Scale, accent: "#39B54A" },
  { title: "The right seasoning", copy: "Five seasonings made for our fish.", icon: Leaf, accent: "#7ED321" },
  { title: "A free recipe", copy: "One free recipe comes with every order.", icon: BookOpen, accent: "#08A9E8" },
  { title: "For your business", copy: "Fresh fish for shops, hotels and caterers.", icon: Building2, accent: "#073B78" },
  { title: "Reward for you", copy: "Earn points on every order. Share with friends.", icon: Sparkles, accent: "#39B54A" },
];

const LakeFreshHome = () => {
  const { data: products, isLoading: productsLoading } = useLakeFreshCatalog();
  const { data: config } = useLakeFreshDeliveryConfig();
  const { data: zones, isLoading: zonesLoading } = useLakeFreshZones();
  const deliveryConfig = config || DEFAULT_LF_DELIVERY_CONFIG;
  const earliest = getEarliestDeliveryDate(new Date(), deliveryConfig);
  const featured = products || [];
  const heroImage =
    "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&fm=webp&w=1200&q=80";

  return (
    <div className="bg-white text-[#073B78]">
      <SEO
        brand="lake-fresh"
        title="Lake Fresh Fish Mart | Fresh Fish for Your Table"
        description="Fresh fish, cleaned and cut, with a choice of seasoning and one free recipe. Chambo, Micheni and Usipa. Order by 8 PM for delivery tomorrow."
      />

      {/* HERO: the customer is the hero, Lake Fresh is the guide */}
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
            <h1 className="mt-6 font-display text-[2.35rem] font-extrabold leading-[0.96] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Lake Fresh Fish
              <br />
              <span className="bg-gradient-to-r from-[#7ED321] to-[#08A9E8] bg-clip-text text-transparent">Delivered to your door</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
              Fresh fish, cleaned and cut, your choice of seasoning, properly packed and delivered home. {LF_PILOT_DELIVERY_PROMISE} in {LF_PILOT_ZONE_NAMES}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LFLink
                to="/lf/fish"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7ED321] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#073B78] transition-transform hover:-translate-y-0.5"
              >
                See the three options <ArrowRight className="h-3.5 w-3.5" />
              </LFLink>
              <LFLink
                to="/lf/spices"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <Leaf className="h-4 w-4 text-[#7ED321]" /> Explore seasonings
              </LFLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7ED321]" /> {LF_PILOT_DELIVERY_PROMISE}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#08A9E8]" /> Three fish options
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#39B54A]" /> One free recipe
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -left-3 -top-3 h-24 w-24 rounded-full bg-[#7ED321]/30 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-[#08A9E8]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/20">
              <img
                src={heroImage}
                alt="An African family enjoying a fish meal"
                decoding="async"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/brand/lake-fresh/fish-chambo.jpg"; }}
                className="h-80 w-full rounded-[1.4rem] object-cover sm:h-96 lg:h-[34rem]"
              />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#073B78]">
                  From the lake
                </span>
                <span className="rounded-full bg-[#39B54A] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  Properly packed
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

      {/* ACTUAL PILOT OFFER */}
      <section className="border-b border-[#39B54A]/20 bg-[#7ED321]/10">
        <div className="container py-10 sm:py-14">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#2c6e12]">Our pilot offer</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              THREE FISH OPTIONS
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#073B78]/70">
              {LF_PILOT_DELIVERY_PROMISE} in {LF_PILOT_ZONE_NAMES}.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LF_PILOT_OFFER.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#39B54A]/25 bg-white p-4">
                <CheckCircle2 className="h-5 w-5 text-[#39B54A]" />
                <p className="mt-2 text-sm font-extrabold text-[#073B78]">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#073B78]/65">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM: name the frustration the shopper feels */}
      <section className="bg-[#F4FBF7]">
        <div className="container grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">The problem</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              BUYING FISH SHOULD NOT BE A GUESS.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#073B78]/70 sm:text-base">
              At the market you never know the real weight. The fish gets warm on the way home. And nobody tells you how
              to cook it. Lake Fresh makes it simple. You see the price, choose your cut and get a recipe with your fish.
            </p>
          </div>
          <div className="rounded-2xl border border-[#39B54A]/25 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#39B54A]/10 text-[#39B54A]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                What we promise you
              </p>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-[#073B78]/70">
              {["A clear weight and a clear price", "Fish cleaned and cut", "One free recipe with every order", "Delivery to your home tomorrow"].map(
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

      {/* GUIDE: authority and empathy, Lake Fresh knows fish */}
      <section className="border-y border-gray-200 bg-white">
        <div className="container grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-2xl border border-[#08A9E8]/25 bg-[#EAF6FB]/60 p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#073B78] text-white">
              <Fish className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-[#073B78] sm:text-3xl">
              WE KNOW LAKE MALAWI FISH.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              Lake Fresh is Blantyre's fresh fish shop. We have served homes, restaurants and caterers. We clean, weigh
              and pack every fish ourselves. When it leaves our shop it is clean and ready for your kitchen.
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#39B54A]">Picture your meal</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              YOU DO THE COOKING. WE DO THE REST.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              Choose a whole fish or cleaned and cut pieces. Add a seasoning. Open the free recipe. In a few short
              steps your kitchen smells like the lake and dinner is on the table.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#39B54A]" />
                <p className="text-xs text-[#073B78]/70">A clean fish, cut the way you like it.</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#39B54A]" />
                <p className="text-xs text-[#073B78]/70">A spice blend picked for your fish.</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#39B54A]" />
                <p className="text-xs text-[#073B78]/70">A free recipe with clear steps.</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#39B54A]" />
                <p className="text-xs text-[#073B78]/70">Delivered to your home tomorrow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATCH */}
      <section className="container py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#08A9E8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39B54A]" /> Pilot options
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              THREE FISH OPTIONS
            </h2>
          </div>
          <LFLink
            to="/lf/fish"
            className="inline-flex items-center gap-2 rounded-full border border-[#073B78]/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78] transition-colors hover:border-[#39B54A] hover:text-[#39B54A]"
          >
            See all three <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>

        {productsLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-[#073B78]/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the three options…
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
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Fish className="h-12 w-12 text-[#08A9E8]" />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        soldOut ? "bg-white/90 text-[#073B78]/60" : "bg-[#39B54A] text-white"
                      }`}
                    >
                      {soldOut ? "Sold out" : "Available"}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-[#073B78]">
                        {product.name}
                      </h3>
                      <Leaf className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[#073B78]/60">{lfDisplayCopy(product.description)}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-lg font-extrabold text-[#073B78]">
                        {formatMWK(product.pricePerKgMwk)}
                        <span className="ml-1 text-xs font-semibold text-[#073B78]/50">per kg</span>
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
              <p className="col-span-full text-sm text-[#073B78]/60">The catch is being restocked. Please check back shortly.</p>
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
                <p className="mt-1 text-xs leading-relaxed text-[#073B78]/60">{cat.copy}</p>
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

      {/* PLAN: three simple steps */}
      <section className="border-y border-gray-200 bg-white">
        <div className="container py-14 sm:py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#08A9E8]">Simple by design</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            HOW IT WORKS
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
                <p className="mt-1 text-sm leading-relaxed text-[#073B78]/60">{step.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#073B78]/60">
            {LF_PILOT_DELIVERY_PROMISE}. Free delivery over {formatMWK(deliveryConfig.freeDeliveryThresholdMwk)}.
            {earliest ? ` Next delivery day: ${formatDeliveryDate(earliest)}.` : ""}
          </p>
          <LFLink
            to="/lf/track"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#073B78]/20 bg-[#EAF6FB] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
          >
            <Truck className="h-3.5 w-3.5" /> Track an order
          </LFLink>
        </div>
      </section>

      {/* SUCCESS AND FAILURE */}
      <section className="bg-[#F4FBF7]">
        <div className="container grid gap-6 py-12 sm:py-16 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#39B54A]/30 bg-white p-6">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A]">
              <Sparkles className="h-3.5 w-3.5" /> What you get
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-[#073B78]">
              FRESH FISH, CLEANED AND CUT, ON YOUR TABLE TOMORROW.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              You know the weight. You know the price. You have a recipe in hand. All you do is cook and enjoy the meal
              with the people you love.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#073B78]/50">
              <ShieldCheck className="h-3.5 w-3.5" /> What you avoid
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-[#073B78]">
              NO GUESSING. NO WARM FISH. NO DINNER STRESS.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              No arguing over weight at the market. No fish that smells wrong. No wondering what to cook. Lake Fresh
              takes care of the hard part for you.
            </p>
          </div>
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
              WE DELIVER TO THREE AREAS
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              Choose Nkolokosa, Soche East or Chitawira at checkout to see the delivery fee and available days. Delivery starts at{" "}
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
              <p className="flex items-center gap-2 text-sm text-[#073B78]/60">
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
            <p className="mt-3 text-[11px] text-[#073B78]/60">
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
                <p className="mt-1 text-sm leading-relaxed text-[#073B78]/60">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS */}
      <section className="border-y border-gray-200 bg-white">
        <div className="container grid gap-6 py-12 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#08A9E8]">
              <Building2 className="h-3.5 w-3.5" /> For shops and kitchens
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              KEEP YOUR KITCHEN STOCKED WITH FRESH FISH.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#073B78]/70">
              Restaurants, hotels and caterers trust Lake Fresh for clean fish at a fair price. Tell us what you need and
              we will plan regular delivery for your business.
            </p>
            <LFLink
              to="/lf/pro"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073B78] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
            >
              See business supply <ArrowRight className="h-3.5 w-3.5 text-[#7ED321]" />
            </LFLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Volume price for each order", "Delivery on your schedule", "One contact for every order", "Fish cleaned and weighed for you"].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-gray-200 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#39B54A]" />
                <p className="text-xs text-[#073B78]/70">{item}</p>
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
            <ShoppingBasket className="h-3.5 w-3.5 text-[#7ED321]" /> Your next meal starts here
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            START YOUR FISH MEAL TODAY.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Choose your fish, add a seasoning and one free recipe. {LF_PILOT_DELIVERY_PROMISE} in {LF_PILOT_ZONE_NAMES}.
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
