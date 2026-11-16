import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Fish, Menu, ShoppingBasket, Waves, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLakeFreshCart, LakeFreshCartProvider } from "@/contexts/LakeFreshCartContext";
import { supabase } from "@/integrations/supabase/client";
import { BRANDS } from "@/lib/brands";
import { formatMWK } from "@/data/products";

const brand = BRANDS["lake-fresh"];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
    isActive ? "text-[#22d3ee]" : "text-white/70 hover:text-white"
  }`;

const LakeFreshHeader = () => {
  const { user } = useAuth();
  const { count, subtotal } = useLakeFreshCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/lf", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a2540] text-white">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/lf" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#22d3ee]/40 bg-white/5">
            <Fish className="h-5 w-5 text-[#22d3ee]" />
            <Waves className="absolute -bottom-0.5 h-3 w-6 text-[#22d3ee]/70" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-extrabold uppercase tracking-[0.14em]">
              Lake Fresh
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#22d3ee]">
              Fish Mart
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Lake Fresh">
          <NavLink to="/lf" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/lf/fish" className={navLinkClass}>
            The Catch
          </NavLink>
          <NavLink to="/lf/spices" className={navLinkClass}>
            Spices
          </NavLink>
          <NavLink to="/lf/marinades" className={navLinkClass}>
            Marinades
          </NavLink>
          <NavLink to="/lf/ready-to-cook" className={navLinkClass}>
            Ready to Cook
          </NavLink>
          <NavLink to="/lf/meal-kits" className={navLinkClass}>
            Meal Kits
          </NavLink>
          <NavLink to="/lf/recipes" className={navLinkClass}>
            Recipes
          </NavLink>
          <NavLink to="/lf/loyalty" className={navLinkClass}>
            Rewards
          </NavLink>
          <NavLink to="/lf/pro" className={navLinkClass}>
            PRO
          </NavLink>
          <NavLink to="/lf/orders" className={navLinkClass}>
            Orders
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white sm:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          ) : (
            <Link
              to="/lf/auth"
              className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}

          <Link
            to="/lf/cart"
            className="relative inline-flex items-center gap-2 rounded-full bg-[#22d3ee] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#0a2540]"
            aria-label={`Basket, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span className="hidden sm:inline">{subtotal > 0 ? formatMWK(subtotal) : "Basket"}</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-[#0a2540]">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0a2540] md:hidden">
          <div className="container flex flex-col gap-4 py-4" onClick={() => setMenuOpen(false)}>
            <NavLink to="/lf" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/lf/fish" className={navLinkClass}>
              The Catch
            </NavLink>
            <NavLink to="/lf/cart" className={navLinkClass}>
              Basket
            </NavLink>
            <NavLink to="/lf/orders" className={navLinkClass}>
              My orders
            </NavLink>
            {!user && (
              <NavLink to="/lf/auth" className={navLinkClass}>
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const LakeFreshFooter = () => (
  <footer className="border-t border-white/10 bg-[#0a2540] text-white">
    <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <p className="font-display text-lg font-extrabold uppercase tracking-[0.14em]">Lake Fresh</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#22d3ee]">Fish Mart</p>
        <p className="mt-3 max-w-xs text-sm text-white/60">{brand.tagline}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Shop</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
          <Link to="/lf/fish" className="hover:text-white">The Catch</Link>
          <Link to="/lf/spices" className="hover:text-white">Spices</Link>
          <Link to="/lf/marinades" className="hover:text-white">Marinades</Link>
          <Link to="/lf/ready-to-cook" className="hover:text-white">Ready to Cook</Link>
          <Link to="/lf/meal-kits" className="hover:text-white">Meal Kits</Link>
          <Link to="/lf/recipes" className="hover:text-white">Recipes</Link>
          <Link to="/lf/loyalty" className="hover:text-white">Rewards</Link>
          <Link to="/lf/subscribe" className="hover:text-white">Subscribe</Link>
          <Link to="/lf/pro" className="hover:text-white">LakeFresh PRO</Link>
          <Link to="/lf/cart" className="hover:text-white">Basket</Link>
          <Link to="/lf/orders" className="hover:text-white">My Orders</Link>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Delivery</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
          <span>Next-day delivery</span>
          <span>Blantyre, Malawi</span>
          <span>Cold-chain handled</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Payment</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
          <span>PayChangu</span>
          <span>Airtel Money · TNM Mpamba</span>
          <span>Visa · Mastercard</span>
        </div>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lake Fresh Fish Mart. All rights reserved.</p>
        <p>Fresh from the Lake. Ready for Your Table.</p>
      </div>
    </div>
  </footer>
);

export const LakeFreshLayout = () => (
  <LakeFreshCartProvider>
    <div className="flex min-h-screen flex-col bg-white">
      <LakeFreshHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LakeFreshFooter />
    </div>
  </LakeFreshCartProvider>
);
