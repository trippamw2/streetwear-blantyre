import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Fish,
  Loader2,
  MapPin,
  Snowflake,
  ShieldCheck,
  ShoppingBasket,
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
  { title: "Choose your fish", copy: "Pick from today's catch and set the weight you need." },
  { title: "Choose preparation", copy: "Whole, cleaned or portioned — prepared before dispatch." },
  { title: "Pick a delivery day", copy: "Order before the cut-off for next-day delivery." },
  { title: "We deliver fresh", copy: "Cold-chain handled and weighed before it reaches your table." },
];

const LakeFreshHome = () => {
  const { data: products, isLoading: productsLoading } = useLakeFreshCatalog();
  const { data: config } = useLakeFreshDeliveryConfig();
  const { data: zones, isLoading: zonesLoading } = useLakeFreshZones();
  const deliveryConfig = config || DEFAULT_LF_DELIVERY_CONFIG;
  const earliest = getEarliestDeliveryDate(new Date(), deliveryConfig);
  const featured = (products || []).slice(0, 3);

  return (
    <div className="bg-white text-gray-900">
      <SEO
        brand="lake-fresh"
        title="Lake Fresh Fish Mart — Fresh from the Lake. Ready for Your Table."
        description="Fresh fish delivered next-day across Blantyre, Malawi. Chambo, Ncheni/Micheni and Usipa — whole, cleaned or portioned and priced per kilogram."
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#073B78] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #08A9E8 0, transparent 40%), radial-gradient(circle at 10% 90%, #39B54A 0, transparent 35%)",
          }}
        />
        <div className="container relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 border border-white/25 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <img src="/brand/lake-fresh/icon.png" alt="Lake Fresh" className="h-6 w-6 object-contain" /> Lake Fresh Fish Mart
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              FRESH FROM THE
              <br />
              <span className="text-[#08A9E8]">LAKE.</span>
              <br />
              READY FOR YOUR TABLE.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              More than fish. Everything for your fish meal — fresh catch, signature spices, marinades, ready-to-cook
              and complete meal kits, delivered next day across Blantyre.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/lf/fish"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#08A9E8] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#073B78]"
              >
                Shop the catch <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/lf/cart"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
              >
                <ShoppingBasket className="h-4 w-4" /> View basket
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#08A9E8]" /> Next-day delivery</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#08A9E8]" /> Priced per kilogram</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#08A9E8]" /> Cold-chain handled</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / FAILURE */}
      <section className="border-b border-gray-200 bg-[#EAF6FB]/40">
        <div className="container py-12 sm:py-16">
          <div className="max-w-3xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#073B78]/50">The problem</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              TIRED OF UNCERTAIN WEIGHTS, NO DELIVERY AND FISH THAT ISN&apos;T FRESH?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Most fish sellers leave you guessing on weight, offer no delivery, and give you no guidance on how to
              cook what you buy. Lake Fresh fixes that: priced per kilogram, weighed honestly, delivered next day,
              with recipes and meal kits so dinner is sorted.
            </p>
          </div>
        </div>
      </section>

      {/* PROPOSITION */}
      <section className="border-b border-gray-200 bg-[#EAF6FB]/50">
        <div className="container grid gap-8 py-12 sm:py-16 md:grid-cols-3">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073B78] text-[#7ED321]">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">Next-Day Delivery</h3>
              <p className="mt-1 text-sm text-gray-500">Order before the cut-off and we deliver the next eligible day.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073B78] text-[#7ED321]">
              <Snowflake className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">Freshness First</h3>
              <p className="mt-1 text-sm text-gray-500">Short freshness windows and cold-chain handling from lake to door.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073B78] text-[#7ED321]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">Clean &amp; Trusted</h3>
              <p className="mt-1 text-sm text-gray-500">Handled with clean process, clear weights and honest pricing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATCH */}
      <section className="container py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#073B78]/50">Available now</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              TODAY&apos;S CATCH
            </h2>
          </div>
          <Link to="/lf/fish" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">
            View all fish <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {productsLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading today&apos;s catch…
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => {
              const soldOut = product.availabilityStatus !== "available" || product.availableKg <= 0;
              return (
                <Link
                  key={product.id}
                  to={`/lf/fish/${product.id}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#073B78] text-[#08A9E8]">
                      <Fish className="h-5 w-5" />
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        soldOut ? "bg-gray-100 text-gray-500" : "bg-[#39B54A]/10 text-[#39B54A]"
                      }`}
                    >
                      {soldOut ? "Sold out" : "Available"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-extrabold uppercase tracking-wide text-[#073B78]">
                    {product.speciesName || product.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>
                  <p className="mt-4 text-lg font-extrabold text-[#073B78]">
                    {formatMWK(product.pricePerKgMwk)}
                    <span className="ml-1 text-xs font-semibold text-gray-400">/ kg</span>
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">
                    Choose weight <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
            {featured.length === 0 && (
              <p className="text-sm text-gray-500">The catch is being restocked. Please check back shortly.</p>
            )}
          </div>
        )}
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="border-b border-gray-200 bg-white">
        <div className="container py-14 sm:py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#073B78]/50">Shop by category</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            MORE THAN FISH
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { to: "/lf/fish", label: "Fresh Fish", copy: "Chambo, Ncheni, Usipa." },
              { to: "/lf/spices", label: "Spices", copy: "Signature blends." },
              { to: "/lf/marinades", label: "Marinades", copy: "Ready-to-use sauces." },
              { to: "/lf/ready-to-cook", label: "Ready to Cook", copy: "Prepped portions." },
              { to: "/lf/meal-kits", label: "Meal Kits", copy: "Complete meals." },
            ].map((cat) => (
              <Link
                key={cat.to}
                to={cat.to}
                className="rounded-2xl border border-[#39B54A]/30 bg-[#EAF6FB]/40 p-5 transition-shadow hover:shadow-md hover:border-[#39B54A]"
              >
                <p className="font-display text-base font-extrabold text-[#073B78]">{cat.label}</p>
                <p className="mt-1 text-xs text-gray-500">{cat.copy}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/lf/recipes" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]">
              Browse recipes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="container py-14 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            HOW ORDERING WORKS
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#073B78] text-xs font-extrabold text-[#08A9E8]">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{step.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Daily cut-off: {formatCutoff(deliveryConfig.cutoff)} · Free delivery over{" "}
            {formatMWK(deliveryConfig.freeDeliveryThresholdMwk)}.
          </p>
        </div>
      </section>

      {/* DELIVERY COVERAGE */}
      <section className="container py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#073B78]/50">
              <MapPin className="h-3.5 w-3.5" /> Delivery coverage
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              WE DELIVER ACROSS BLANTYRE
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Choose your neighbourhood at checkout to see the delivery fee and available dates. Delivery fees start
              at {formatMWK(deliveryConfig.deliveryFeeMwk)}, and orders over{" "}
              {formatMWK(deliveryConfig.freeDeliveryThresholdMwk)} deliver free.
            </p>
            <Link
              to="/lf/fish"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
            >
              Start your order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            {zonesLoading ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading areas…
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(zones || []).map((zone) => (
                  <div key={zone.id} className="flex items-center gap-2 rounded-lg bg-[#EAF6FB]/60 px-3 py-2.5 text-sm text-[#073B78]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#073B78]/60" />
                    <span className="font-semibold">{zone.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-gray-400">
              Delivery areas are managed by Lake Fresh. Availability can change by day.
            </p>
          </div>
        </div>
      </section>

      {/* WHY LAKE FRESH */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="container py-14 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
            WHY LAKE FRESH
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Fresh from the lake", copy: "Short freshness windows and cold-chain handling from lake to door." },
              { title: "Honest weights", copy: "Priced per kilogram with clear packed weights. No silent overcharging." },
              { title: "Complete meals", copy: "Spices, marinades and meal kits to finish your fish dish." },
              { title: "Next-day delivery", copy: "Order before the cut-off for next-day delivery across Blantyre." },
              { title: "Business supply", copy: "LakeFresh PRO for restaurants, hotels and caterers." },
              { title: "Rewards", copy: "Earn points on every order and refer friends." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#39B54A]/20 bg-white p-5">
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#073B78] py-16 text-white sm:py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            ORDER FRESH TODAY
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Chambo, Ncheni / Micheni and Usipa — priced per kilogram, prepared for your table, delivered next day.
          </p>
          <Link
            to="/lf/fish"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#08A9E8] px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#073B78]"
          >
            Browse the catch
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshHome;
