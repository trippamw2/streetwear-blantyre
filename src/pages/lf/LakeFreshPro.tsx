import { useState } from "react";
import { LFLink } from "@/components/lf/lfRouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
  Send,
  Truck,
  Users,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const benefits = [
  {
    title: "Good value for bulk orders",
    copy: "Tell us what you need and we give you a clear price per kilogram.",
    icon: FileText,
    accent: "#39B54A",
    tint: "#F2FBEE",
  },
  {
    title: "Fish when you need it",
    copy: "We plan each catch with your kitchen in mind.",
    icon: Truck,
    accent: "#08A9E8",
    tint: "#EAF6FB",
  },
  {
    title: "Cleaned and packed",
    copy: "We clean, weigh and pack your fish before it leaves us.",
    icon: PackageCheck,
    accent: "#073B78",
    tint: "#EAF6FB",
  },
  {
    title: "One friendly contact",
    copy: "Talk to one person about quotes, orders and delivery.",
    icon: Users,
    accent: "#7ED321",
    tint: "#F7FCEB",
  },
];

const fieldClass =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#073B78] outline-none transition-colors placeholder:text-[#073B78]/50 focus:border-[#08A9E8] focus:ring-2 focus:ring-[#08A9E8]/20";
const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60";

const LakeFreshPro = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"register" | "quote">("register");
  const [submitting, setSubmitting] = useState(false);

  const [reg, setReg] = useState({
    company_name: "",
    business_type: "",
    tax_id: "",
    contact_name: "",
    phone: "",
    location: "",
    notes: "",
  });

  const [quote, setQuote] = useState({
    requester_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
    requester_email: user?.email || "",
    requester_phone: "",
    notes: "",
    items: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg.company_name.trim() || !reg.phone.trim()) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_accounts").insert({
        brand_id: LF_BRAND_ID,
        user_id: user?.id || null,
        company_name: reg.company_name.trim(),
        business_type: reg.business_type.trim() || null,
        tax_id: reg.tax_id.trim() || null,
        contact_name: reg.contact_name.trim() || null,
        phone: reg.phone.trim(),
        location: reg.location.trim() || null,
        notes: reg.notes.trim() || null,
        is_active: true,
        approval_status: "pending",
      });
      if (error) throw error;
      toast({ title: "Registration submitted", description: "We will review your business account." });
      setReg({ company_name: "", business_type: "", tax_id: "", contact_name: "", phone: "", location: "", notes: "" });
    } catch (err) {
      toast({ title: "Registration failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.requester_name.trim() || !quote.items.trim()) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("lf_quotes")
        .insert({
          brand_id: LF_BRAND_ID,
          requester_name: quote.requester_name.trim(),
          requester_email: quote.requester_email.trim() || null,
          requester_phone: quote.requester_phone.trim() || null,
          notes: quote.notes.trim() || null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const lines = quote.items.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && data) {
        const rows = lines.map((line) => {
          const [name, qty, unit] = line.split("|").map((s) => s.trim());
          return {
            quote_id: data.id,
            product_type: "other",
            product_name: name,
            quantity: Number(qty || 1),
            unit: unit || null,
          };
        });
        await supabase.from("lf_quote_items").insert(rows);
      }

      toast({ title: "Quote requested", description: "We will get back to you shortly." });
      setQuote({ ...quote, notes: "", items: "" });
    } catch (err) {
      toast({ title: "Quote request failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="LakeFresh PRO | Fish for Business" description="Fresh fish supply for restaurants, hotels and food businesses. Clear prices, cold packing and delivery in Blantyre." />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#EAF6FB] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 88% 10%, #39B54A 0, transparent 38%), radial-gradient(circle at 8% 92%, #08A9E8 0, transparent 40%)",
          }}
        />
        <div className="container relative max-w-5xl py-12 sm:py-16">
          <LFLink
            to="/lf"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 transition-colors hover:text-[#073B78]"
          >
            <Building2 className="h-3.5 w-3.5" /> Lake Fresh
          </LFLink>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> For business
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">
            LAKEFRESH <span className="bg-gradient-to-r from-[#39B54A] to-[#08A9E8] bg-clip-text text-transparent">PRO</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#073B78]/70 sm:text-base">
            Your kitchen needs fresh fish you can count on. We know lake fish, and we clean, weigh and pack every order
            with care. Register your business or ask for a price, and we will guide you from there.
          </p>
          <p className="mt-3 max-w-2xl text-xs font-bold text-[#073B78]/70">
            We supply restaurants, hotels, lodges, caterers and food shops in Blantyre.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39B54A]/30 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#2c6e12]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#39B54A]" /> Clear prices
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#08A9E8]/30 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#073B78]">
              <Truck className="h-3.5 w-3.5 text-[#08A9E8]" /> Delivery on your day
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7ED321]/40 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#2c6e12]">
              <PackageCheck className="h-3.5 w-3.5 text-[#7ED321]" /> Cleaned and packed
            </span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="container max-w-5xl py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-gray-200 bg-white p-5">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: benefit.tint, color: benefit.accent }}
              >
                <benefit.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-wide text-[#073B78]">
                {benefit.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#073B78]/60">{benefit.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM CARD */}
      <section className="container max-w-3xl pb-14 sm:pb-16">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex gap-2 border-b border-gray-200 bg-[#F7FBFC] px-4 pt-3 sm:px-6">
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${
                tab === "register"
                  ? "border-[#39B54A] text-[#073B78]"
                  : "border-transparent text-[#073B78]/60 hover:text-[#073B78]"
              }`}
            >
              <Building2 className={`h-3.5 w-3.5 ${tab === "register" ? "text-[#39B54A]" : ""}`} />
              Business registration
            </button>
            <button
              type="button"
              onClick={() => setTab("quote")}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${
                tab === "quote"
                  ? "border-[#08A9E8] text-[#073B78]"
                  : "border-transparent text-[#073B78]/60 hover:text-[#073B78]"
              }`}
            >
              <FileText className={`h-3.5 w-3.5 ${tab === "quote" ? "text-[#08A9E8]" : ""}`} />
              Request a quote
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {tab === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelClass}>Company name *</label>
                  <input
                    className={fieldClass}
                    value={reg.company_name}
                    onChange={(e) => setReg({ ...reg, company_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Business type</label>
                    <input
                      className={fieldClass}
                      value={reg.business_type}
                      onChange={(e) => setReg({ ...reg, business_type: e.target.value })}
                      placeholder="Restaurant, hotel, caterer…"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tax ID</label>
                    <input
                      className={fieldClass}
                      value={reg.tax_id}
                      onChange={(e) => setReg({ ...reg, tax_id: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Contact name</label>
                    <input
                      className={fieldClass}
                      value={reg.contact_name}
                      onChange={(e) => setReg({ ...reg, contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone *</label>
                    <input
                      className={fieldClass}
                      value={reg.phone}
                      onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    className={fieldClass}
                    value={reg.location}
                    onChange={(e) => setReg({ ...reg, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    className={fieldClass}
                    rows={3}
                    value={reg.notes}
                    onChange={(e) => setReg({ ...reg, notes: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#39B54A] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  Submit registration
                </button>
              </form>
            ) : (
              <form onSubmit={handleQuote} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Name *</label>
                    <input
                      className={fieldClass}
                      value={quote.requester_name}
                      onChange={(e) => setQuote({ ...quote, requester_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      className={fieldClass}
                      value={quote.requester_email}
                      onChange={(e) => setQuote({ ...quote, requester_email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    className={fieldClass}
                    value={quote.requester_phone}
                    onChange={(e) => setQuote({ ...quote, requester_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Items (one per line: Name | qty | unit)</label>
                  <textarea
                    className={fieldClass}
                    rows={5}
                    value={quote.items}
                    onChange={(e) => setQuote({ ...quote, items: e.target.value })}
                    placeholder="Fresh Chambo | 20 | kg"
                  />
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    className={fieldClass}
                    rows={3}
                    value={quote.notes}
                    onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#08A9E8] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Request quote
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl bg-[#073B78] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-extrabold text-white">Not a business? Shop the catch.</p>
            <p className="mt-1 text-xs text-white/60">Choose your fish, add a spice blend and get one free recipe.</p>
          </div>
          <LFLink
            to="/lf/fish"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7ED321] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
          >
            Shop the catch <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>
      </section>
    </div>
  );
};

export default LakeFreshPro;
