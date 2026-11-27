import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SHOP_LINKS = [
  { to: "/shop", label: "Shop All" },
  { to: "/shop?sort=new", label: "New Arrivals" },
  { to: "/collections", label: "Collections" },
  { to: "/shop?category=t-shirts", label: "T Shirts" },
  { to: "/shop?category=shorts", label: "Shorts" },
];

const COMPANY_LINKS = [
  { to: "/about", label: "About SB" },
  { to: "/contact", label: "Contact" },
  { to: "/stories", label: "Stories" },
  { to: "/lookbooks", label: "Lookbooks" },
];

const SUPPORT_LINKS = [
  { to: "/orders", label: "Track Order" },
  { to: "/returns", label: "Returns & Exchanges" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("customer_subscribers").upsert({ email }, { onConflict: "email" });
      if (error && error.code !== "23505") throw error;
      toast({ title: "You're in", description: "Thanks for subscribing to SB updates." });
      setEmail("");
    } catch (err) {
      console.error("Newsletter subscribe error:", err);
      toast({ title: "Couldn't subscribe", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="container py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr] lg:gap-12">
          <div className="max-w-sm">
            <Logo className="h-14 w-auto sm:h-16 md:h-20" />
            <p className="mt-5 text-sm leading-relaxed text-gray-400">
              Everyday streetwear in Malawi. Tees, vests, shirts, and shorts made for real life.
            </p>
            <div className="mt-6 space-y-2.5 text-sm text-gray-400">
              <p className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-gray-500" /> Blantyre, Malawi</p>
              <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-gray-500" /> <a href="tel:+265982972977" className="transition-colors hover:text-white">+265 982 972 977</a></p>
              <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-gray-500" /> <a href="mailto:hello@wearsb.com" className="transition-colors hover:text-white">hello@wearsb.com</a></p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
              <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="border border-white/15 px-3 py-2 font-semibold uppercase tracking-[0.08em] transition-colors hover:border-white/40 hover:text-white">WhatsApp</a>
              <span className="border border-white/10 px-3 py-2 uppercase tracking-[0.08em]">PayChangu</span>
              <span className="border border-white/10 px-3 py-2 uppercase tracking-[0.08em]">14-day exchange</span>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Shop</h3>
            <ul className="mt-5 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-sm text-gray-400 transition-colors hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Company</h3>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 transition-colors hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Support</h3>
            <ul className="mt-5 space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 transition-colors hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Stay in style</h3>
            <p className="mt-5 text-sm leading-relaxed text-gray-400">
              Get first access to new arrivals, drops, and everyday style edits.
            </p>
            <form onSubmit={handleSubscribe} className="mt-5 space-y-3">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full border border-white/15 bg-transparent px-4 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-white/40"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center bg-white px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a] transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-[11px] uppercase tracking-[0.12em] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SB. All rights reserved.</p>
          <p className="text-gray-400">Your Style. Your Everyday.</p>
        </div>
      </div>
    </footer>
  );
};
