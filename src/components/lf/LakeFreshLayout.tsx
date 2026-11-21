import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LFLink, LFNavLink, useLFNavigate } from "@/components/lf/lfRouter";
import { Menu, ShoppingBasket, X, LogOut, User, ShieldCheck, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLakeFreshCart, LakeFreshCartProvider } from "@/contexts/LakeFreshCartContext";
import { supabase } from "@/integrations/supabase/client";
import { BRANDS } from "@/lib/brands";
import { formatMWK } from "@/data/products";
import { LF_PILOT_DELIVERY_PROMISE } from "@/lib/lfPilot";
import { lfWhatsAppLink } from "@/lib/whatsapp";
import { LF_CONTACT, lfEmailHref, lfPhoneHref } from "@/lib/lfContact";
import { useLfDataSaver } from "@/hooks/useLfDataSaver";
import { LfGrowthTracker } from "@/components/lf/LfGrowthTracker";

const brand = BRANDS["lake-fresh"];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
    isActive ? "text-[#08A9E8]" : "text-[#073B78]/70 hover:text-[#073B78]"
  }`;

const LakeFreshHeader = () => {
  const { user } = useAuth();
  const { count, subtotal } = useLakeFreshCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useLFNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/lf", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <div className="border-b border-gray-100 bg-[#F7FBFC]">
        <div className="container flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.25em] text-[#073B78]/70">
          Fresh fish from Lake Malawi, made for your table.
        </div>
      </div>
      <div className="border-b border-[#39B54A]/20 bg-[#F4FBF7]">
        <div className="container flex min-h-8 items-center justify-center px-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#073B78]">
          {LF_PILOT_DELIVERY_PROMISE}.
        </div>
      </div>
      <div className="container flex h-16 items-center justify-between gap-4">
        <LFLink to="/lf" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <img src="/brand/lake-fresh/logo.png" alt="Lake Fresh" className="h-10 w-auto max-w-[200px] object-contain sm:h-12" />
        </LFLink>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Lake Fresh">
          <LFNavLink to="/lf" end className={navLinkClass}>Home</LFNavLink>
          <LFNavLink to="/lf/fish" className={navLinkClass}>The Catch</LFNavLink>
          <LFNavLink to="/lf/spices" className={navLinkClass}>Spices</LFNavLink>
          <LFNavLink to="/lf/recipes" className={navLinkClass}>Recipes</LFNavLink>
          <LFNavLink to="/lf/subscribe" className={navLinkClass}>Subscribe</LFNavLink>
          <LFNavLink to="/lf/loyalty" className={navLinkClass}>Rewards</LFNavLink>
          <LFNavLink to="/lf/pro" className={navLinkClass}>PRO</LFNavLink>
          <LFNavLink to="/lf/support" className={navLinkClass}>Help</LFNavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/80 hover:text-[#073B78] sm:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          ) : (
            <LFLink
              to="/lf/auth"
              className="hidden items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/80 hover:text-[#073B78] sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" /> Sign in
            </LFLink>
          )}

          <LFLink
            to="/lf/cart"
            className="relative inline-flex items-center gap-2 rounded-full bg-[#073B78] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
            aria-label={`Basket, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span className="hidden sm:inline">{subtotal > 0 ? formatMWK(subtotal) : "Basket"}</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#08A9E8] px-1 text-[10px] font-extrabold text-[#073B78]">
                {count}
              </span>
            )}
          </LFLink>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <div className="container flex flex-col gap-4 py-4" onClick={() => setMenuOpen(false)}>
            <LFNavLink to="/lf" end className={navLinkClass}>Home</LFNavLink>
            <LFNavLink to="/lf/fish" className={navLinkClass}>The Catch</LFNavLink>
            <LFNavLink to="/lf/spices" className={navLinkClass}>Spices</LFNavLink>
            <LFNavLink to="/lf/recipes" className={navLinkClass}>Recipes</LFNavLink>
            <LFNavLink to="/lf/cart" className={navLinkClass}>Basket</LFNavLink>
            <LFNavLink to="/lf/orders" className={navLinkClass}>My orders</LFNavLink>
            <LFNavLink to="/lf/track" className={navLinkClass}>Track order</LFNavLink>
            <LFNavLink to="/lf/loyalty" className={navLinkClass}>Rewards</LFNavLink>
            <LFNavLink to="/lf/subscribe" className={navLinkClass}>Subscribe</LFNavLink>
            <LFNavLink to="/lf/pro" className={navLinkClass}>PRO</LFNavLink>
            <LFNavLink to="/lf/support" className={navLinkClass}>Help</LFNavLink>
            <LFNavLink to="/lf/reviews" className={navLinkClass}>Reviews</LFNavLink>
            {!user && <LFNavLink to="/lf/auth" className={navLinkClass}>Sign in</LFNavLink>}
          </div>
        </div>
      )}
    </header>
  );
};

const LakeFreshFooter = () => {
  const { enabled: dataSaver, toggle: toggleDataSaver } = useLfDataSaver();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);

  const handleNewsletter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsletterEmail || !newsletterConsent) return;
    setNewsletterBusy(true);
    try {
      const { subscribeToLfNewsletter } = await import("@/lib/brevo");
      const ok = await subscribeToLfNewsletter(newsletterEmail);
      if (ok) {
        setNewsletterDone(true);
        setNewsletterEmail("");
      }
    } catch {
      // The form stays open so the customer can try again.
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
  <footer className="border-t border-gray-100 bg-[#F7FBFC] text-[#073B78]">
    <div className="border-b border-[#39B54A]/20 bg-white">
      <div className="container py-8">
        {newsletterDone ? (
          <p className="text-sm font-bold text-[#2c6e12]">Thank you. We will send Lake Fresh news to your inbox.</p>
        ) : (
          <form onSubmit={handleNewsletter} className="max-w-xl space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Fresh news</p>
            <p className="text-sm text-[#073B78]/70">
              Get notes about fresh stock and simple recipes. We only use this for Lake Fresh messages.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Your email address"
                className="h-10 flex-1 rounded-md border border-input bg-white px-3 text-sm"
                disabled={newsletterBusy}
              />
              <button
                type="submit"
                disabled={newsletterBusy || !newsletterEmail || !newsletterConsent}
                className="h-10 rounded-md bg-[#08A9E8] px-5 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
              >
                {newsletterBusy ? "Saving" : "Join"}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-[#073B78]/70">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(event) => setNewsletterConsent(event.target.checked)}
                className="mt-0.5"
              />
              Yes, send me occasional Lake Fresh offers. We do not share this with other brands.
            </label>
          </form>
        )}
      </div>
    </div>
    <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <img src="/brand/lake-fresh/logo.png" alt="Lake Fresh" className="h-10 w-auto max-w-[200px] object-contain" />
        <p className="mt-3 max-w-xs text-sm text-[#073B78]/70">{brand.tagline}</p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#073B78]/60">
          We help families cook fresh lake fish with clear weights, clean packing and simple recipes.
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Shop</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <LFLink to="/lf/fish" className="hover:text-[#073B78]">The Catch</LFLink>
          <LFLink to="/lf/spices" className="hover:text-[#073B78]">Spices</LFLink>
          <LFLink to="/lf/recipes" className="hover:text-[#073B78]">Recipes</LFLink>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Account</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <LFLink to="/lf/cart" className="hover:text-[#073B78]">Basket</LFLink>
          <LFLink to="/lf/orders" className="hover:text-[#073B78]">My Orders</LFLink>
          <LFLink to="/lf/track" className="hover:text-[#073B78]">Track Order</LFLink>
          <LFLink to="/lf/loyalty" className="hover:text-[#073B78]">Rewards</LFLink>
          <LFLink to="/lf/subscribe" className="hover:text-[#073B78]">Subscribe</LFLink>
          <LFLink to="/lf/pro" className="hover:text-[#073B78]">LakeFresh PRO</LFLink>
          <LFLink to="/lf/support" className="hover:text-[#073B78]">Get Help</LFLink>
          <LFLink to="/lf/reviews" className="hover:text-[#073B78]">Reviews</LFLink>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Delivery</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <span>{LF_PILOT_DELIVERY_PROMISE}</span>
          <span>Three fish options</span>
          <button
            type="button"
            onClick={toggleDataSaver}
            aria-pressed={dataSaver}
            className="mt-1 w-fit rounded-lg border border-[#08A9E8]/30 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
          >
            {dataSaver ? "Using less data" : "Use less data"}
          </button>
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Policies</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <LFLink to="/lf/privacy" className="hover:text-[#073B78]">Privacy Policy</LFLink>
          <LFLink to="/lf/terms" className="hover:text-[#073B78]">Terms and Conditions</LFLink>
          <LFLink to="/lf/refund" className="hover:text-[#073B78]">Refund Policy</LFLink>
        </div>
      </div>
    </div>

    <div className="border-t border-[#39B54A]/20 bg-[#F4FBF7]">
      <div className="container grid gap-6 py-8 sm:grid-cols-3">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#39B54A]" />
          <div>
            <p className="text-xs font-extrabold text-[#073B78]">Where we pack your fish</p>
            <p className="mt-1 text-xs leading-relaxed text-[#073B78]/70">
              Lake Fresh Fish Mart, Blantyre, Malawi. We clean, weigh and pack your fish with ice here, then send it to
              your door.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#08A9E8]" />
          <div>
            <p className="text-xs font-extrabold text-[#073B78]">Clean and careful</p>
            <p className="mt-1 text-xs leading-relaxed text-[#073B78]/70">
              We use clean boxes and clear labels. Every order is weighed again before it leaves us.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#25D366]" />
            <div>
              <p className="text-xs font-extrabold text-[#073B78]">Need help?</p>
              <p className="mt-1 text-xs leading-relaxed text-[#073B78]/70">
                Contact our team during delivery hours. We are here to help with your order.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lfWhatsAppLink("Hi Lake Fresh, I need help with my fish order.") && (
              <a
                href={lfWhatsAppLink("Hi Lake Fresh, I need help with my fish order.") as string}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Chat on WhatsApp
              </a>
            )}
            {lfPhoneHref() && (
              <a
                href={lfPhoneHref() as string}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#073B78] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
              >
                <Phone className="h-3.5 w-3.5" /> Call us
              </a>
            )}
            {lfEmailHref() && (
              <a
                href={lfEmailHref() as string}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#073B78]/20 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
              >
                <Mail className="h-3.5 w-3.5" /> Email us
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100">
      <div className="container flex flex-col gap-2 py-5 text-xs text-[#073B78]/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lake Fresh Fish Mart. All rights reserved.</p>
        <p>
          {LF_CONTACT.registration
            ? `Registered business in Malawi. Registration ${LF_CONTACT.registration}.`
            : "Fresh fish from Lake Malawi, made for your table."}
        </p>
      </div>
    </div>
  </footer>
  );
};

export const LakeFreshLayout = () => (
  <LakeFreshCartProvider>
    <div className="lf-brand flex min-h-screen flex-col bg-white">
      <LfGrowthTracker />
      <LakeFreshHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LakeFreshFooter />
    </div>
  </LakeFreshCartProvider>
);
