import { Link } from "react-router-dom";
import { Truck, ShieldCheck, Snowflake, Fish, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const LakeFreshHome = () => {
  return (
    <div className="bg-white text-gray-900">
      <SEO
        title="Lake Fresh Fish Mart — Fresh from the Lake. Ready for Your Table."
        description="Fresh fish delivered next-day across Blantyre, Malawi. Whole, cleaned and portioned fish. Order before the cut-off and we deliver fresh."
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a2540] text-white">
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/25 text-white/80 text-xs font-semibold tracking-[0.15em] uppercase mb-6">
              <Fish className="h-3.5 w-3.5" /> Lake Fresh Fish Mart
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
              FRESH FROM THE
              <br />
              <span className="text-[#22d3ee]">LAKE.</span>
              <br />
              READY FOR YOUR TABLE.
            </h1>
            <p className="text-white/70 text-base sm:text-lg mt-4 max-w-lg leading-relaxed">
              Order fresh fish before the cut-off and we deliver it the next day —
              whole, cleaned or portioned to your table.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/lf/fish">
                <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-[#0a2540] font-bold uppercase tracking-widest text-xs px-6 py-3">
                  Shop Fresh Fish <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEXT-DAY DELIVERY PROPOSITION */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container py-12 sm:py-16 grid gap-8 md:grid-cols-3">
          <div className="flex gap-4 items-start">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a2540] text-[#22d3ee]">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-extrabold uppercase text-sm tracking-wide">Next-Day Delivery</h3>
              <p className="text-sm text-gray-500 mt-1">Orders before the cut-off go out the next day.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a2540] text-[#22d3ee]">
              <Snowflake className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-extrabold uppercase text-sm tracking-wide">Freshness First</h3>
              <p className="text-sm text-gray-500 mt-1">Cold-chain handling and short freshness windows.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a2540] text-[#22d3ee]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-extrabold uppercase text-sm tracking-wide">Clean &amp; Trusted</h3>
              <p className="text-sm text-gray-500 mt-1">Handled with clean process and quality checks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container text-center">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            ORDER FRESH TODAY
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Chambo, Ncheni / Micheni and Usipa — priced per kilogram, prepared to your table.
          </p>
          <Link to="/lf/fish" className="mt-8">
            <span className="inline-flex items-center justify-center rounded-lg bg-[#0a2540] text-white font-bold uppercase tracking-widest text-xs px-8 py-3">
              Browse the Catch
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshHome;
