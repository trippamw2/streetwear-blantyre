import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, ShoppingBasket, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLakeFreshCart, LakeFreshCartProvider } from "@/contexts/LakeFreshCartContext";
import { supabase } from "@/integrations/supabase/client";
import { BRANDS } from "@/lib/brands";
import { formatMWK } from "@/data/products";

const brand = BRANDS["lake-fresh"];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
    isActive ? "text-[#08A9E8]" : "text-[#073B78]/70 hover:text-[#073B78]"
  }`;

const LakeFreshHeader = () => {
  const { user } = useAuth();
  const { count, subtotal } = useLakeFreshCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (link) link.href = "/brand/lake-fresh/icon.png";
    else {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = "/brand/lake-fresh/icon.png";
      document.head.appendChild(newLink);
    }
    document.title = "Lake Fresh";
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/lf", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <div className="border-b border-gray-100 bg-[#F7FBFC]">
        <div className="container flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.25em] text-[#073B78]/70">
          Fresh from the Lake. Ready for Your Table.
        </div>
      </div>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/lf" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <img src="/brand/lake-fresh/logo.png" alt="Lake Fresh" className="h-8 w-auto max-w-[150px] object-contain sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Lake Fresh">
          <NavLink to="/lf" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/lf/fish" className={navLinkClass}>The Catch</NavLink>
          <NavLink to="/lf/spices" className={navLinkClass}>Spices</NavLink>
          <NavLink to="/lf/marinades" className={navLinkClass}>Marinades</NavLink>
          <NavLink to="/lf/ready-to-cook" className={navLinkClass}>Ready to Cook</NavLink>
          <NavLink to="/lf/meal-kits" className={navLinkClass}>Meal Kits</NavLink>
          <NavLink to="/lf/recipes" className={navLinkClass}>Recipes</NavLink>
          <NavLink to="/lf/loyalty" className={navLinkClass}>Rewards</NavLink>
          <NavLink to="/lf/pro" className={navLinkClass}>PRO</NavLink>
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
            <Link
              to="/lf/auth"
              className="hidden items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/80 hover:text-[#073B78] sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}

          <Link
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
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="container flex flex-col gap-4 py-4" onClick={() => setMenuOpen(false)}>
            <NavLink to="/lf" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/lf/fish" className={navLinkClass}>The Catch</NavLink>
            <NavLink to="/lf/spices" className={navLinkClass}>Spices</NavLink>
            <NavLink to="/lf/marinades" className={navLinkClass}>Marinades</NavLink>
            <NavLink to="/lf/ready-to-cook" className={navLinkClass}>Ready to Cook</NavLink>
            <NavLink to="/lf/meal-kits" className={navLinkClass}>Meal Kits</NavLink>
            <NavLink to="/lf/recipes" className={navLinkClass}>Recipes</NavLink>
            <NavLink to="/lf/cart" className={navLinkClass}>Basket</NavLink>
            <NavLink to="/lf/orders" className={navLinkClass}>My orders</NavLink>
            <NavLink to="/lf/loyalty" className={navLinkClass}>Rewards</NavLink>
            <NavLink to="/lf/subscribe" className={navLinkClass}>Subscribe</NavLink>
            <NavLink to="/lf/pro" className={navLinkClass}>PRO</NavLink>
            {!user && <NavLink to="/lf/auth" className={navLinkClass}>Sign in</NavLink>}
          </div>
        </div>
      )}
    </header>
  );
};

const LakeFreshFooter = () => (
  <footer className="border-t border-gray-100 bg-[#F7FBFC] text-[#073B78]">
    <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <img src="/brand/lake-fresh/logo.png" alt="Lake Fresh" className="h-8 w-auto max-w-[150px] object-contain" />
        <p className="mt-3 max-w-xs text-sm text-[#073B78]/70">{brand.tagline}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Shop</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <Link to="/lf/fish" className="hover:text-[#073B78]">The Catch</Link>
          <Link to="/lf/spices" className="hover:text-[#073B78]">Spices</Link>
          <Link to="/lf/marinades" className="hover:text-[#073B78]">Marinades</Link>
          <Link to="/lf/ready-to-cook" className="hover:text-[#073B78]">Ready to Cook</Link>
          <Link to="/lf/meal-kits" className="hover:text-[#073B78]">Meal Kits</Link>
          <Link to="/lf/recipes" className="hover:text-[#073B78]">Recipes</Link>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Account</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <Link to="/lf/cart" className="hover:text-[#073B78]">Basket</Link>
          <Link to="/lf/orders" className="hover:text-[#073B78]">My Orders</Link>
          <Link to="/lf/loyalty" className="hover:text-[#073B78]">Rewards</Link>
          <Link to="/lf/subscribe" className="hover:text-[#073B78]">Subscribe</Link>
          <Link to="/lf/pro" className="hover:text-[#073B78]">LakeFresh PRO</Link>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/50">Delivery</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-[#073B78]/75">
          <span>Next-day delivery</span>
          <span>Blantyre, Malawi</span>
          <span>Cold-chain handled</span>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100">
      <div className="container flex flex-col gap-2 py-5 text-xs text-[#073B78]/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lake Fresh Fish Mart. All rights reserved.</p>
        <p>Fresh from the Lake. Ready for Your Table.</p>
      </div>
    </div>
  </footer>
);

export const LakeFreshLayout = () => (
  <LakeFreshCartProvider>
    <div className="lf-brand flex min-h-screen flex-col bg-white">
      <LakeFreshHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LakeFreshFooter />
    </div>
  </LakeFreshCartProvider>
);
