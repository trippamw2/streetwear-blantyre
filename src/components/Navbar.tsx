import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";
import { CartDrawer } from "./CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/collections", label: "Collections" },
  { to: "/shop?sort=new", label: "New Arrivals" },
  { to: "/about", label: "About" },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useCart();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/92 backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
      <div className="container flex h-16 items-center justify-between gap-3 sm:h-[76px]">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="-ml-2 rounded-md p-2 text-gray-900 transition-colors hover:bg-black/5 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo className="h-10 w-auto sm:h-12 md:h-14" />

        <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            link.label === "Shop" ? (
              <DropdownMenu key={link.to}>
                <DropdownMenuTrigger className="group inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-700 transition-colors hover:text-primary">
                  Shop <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 border-gray-200 bg-white p-2 text-gray-900 shadow-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/shop" className="cursor-pointer font-semibold">Shop All</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {SB_PRODUCT_TYPES.map((type) => (
                    <DropdownMenuItem key={type.slug} asChild>
                      <Link to={`/shop?category=${type.slug}`} className="cursor-pointer">{type.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/collections" className="cursor-pointer">Collections</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={link.to + link.label}
                to={link.to}
                className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-700 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2.5 text-gray-800 transition-colors hover:bg-black/5 hover:text-primary"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full p-2.5 text-gray-800 transition-colors hover:bg-black/5 hover:text-primary" aria-label="Account">
                <User className="h-[18px] w-[18px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-gray-200 bg-white text-gray-900 shadow-xl">
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="cursor-pointer">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/rewards" className="cursor-pointer">Rewards</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="hidden rounded-full p-2.5 text-gray-800 transition-colors hover:bg-black/5 hover:text-primary sm:block" aria-label="Account">
              <User className="h-[18px] w-[18px]" />
            </Link>
          )}

          <CartDrawer>
            <button className="relative rounded-full p-2.5 text-gray-800 transition-colors hover:bg-black/5 hover:text-primary" aria-label={count > 0 ? `Bag, ${count} items` : "Bag"}>
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white" aria-hidden="true">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </CartDrawer>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-200 bg-white">
          <form onSubmit={handleSearch} className="container flex items-center gap-2 py-3">
            <Search className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tees, vests, shirts, shorts..."
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      )}

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-gray-200 bg-white transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0 border-t-0",
        )}
      >
        <nav className="container flex flex-col py-4" aria-label="Mobile" aria-hidden={!mobileOpen}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              onClick={closeMobile}
              className="border-b border-gray-100 py-3 text-sm font-semibold text-gray-900"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-b border-gray-100 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Shop by Category</p>
            <div className="grid grid-cols-2 gap-1">
              {SB_PRODUCT_TYPES.map((type) => (
                <Link key={type.slug} to={`/shop?category=${type.slug}`} onClick={closeMobile} className="py-2 text-sm text-gray-600 hover:text-primary">
                  {type.label}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/contact" onClick={closeMobile} className="border-b border-gray-100 py-3 text-sm font-semibold text-gray-900">Contact</Link>
          {user ? (
            <div className="flex flex-col pt-2">
              <Link to="/admin" onClick={closeMobile} className="py-2 text-sm font-medium text-primary">Dashboard</Link>
              <Link to="/orders" onClick={closeMobile} className="py-2 text-sm text-gray-600">My Orders</Link>
              <Link to="/rewards" onClick={closeMobile} className="py-2 text-sm text-gray-600">Rewards</Link>
              <button onClick={() => { signOut(); closeMobile(); }} className="py-2 text-left text-sm text-gray-600">Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" onClick={closeMobile} className="pt-4 text-sm font-semibold text-primary">Sign In / Create Account</Link>
          )}
        </nav>
      </div>
    </header>
  );
};
