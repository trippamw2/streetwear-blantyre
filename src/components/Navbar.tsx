import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, Search, ShoppingBag, User } from "lucide-react";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const SHOP_LINKS = [
  { to: "/shop?sort=new", label: "New Arrivals" },
  ...SB_PRODUCT_TYPES.map((type) => ({
    to: `/shop?category=${type.slug}`,
    label: type.label,
  })),
  { to: "/collections", label: "Collections" },
  { to: "/shop?sort=best", label: "Best Sellers" },
  { to: "/collections#drops", label: "Limited Drops" },
];

const TOP_LINKS = [
  { to: "/looks", label: "Looks" },
  { to: "/stories", label: "Stories" },
  { to: "/about", label: "About SB" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
      isActive ? "text-white" : "text-white/60 hover:text-white",
    );

  return (
    <>
      <div className="bg-navy text-white text-xs font-semibold tracking-widest uppercase text-center py-2 px-4">
        SB / Malawian Streetwear — Wear What Speaks.
      </div>
      <header className="sticky top-0 z-40 bg-navy border-b border-white/10">
        <nav className="container flex h-16 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
          <Logo className="h-12 sm:h-14 md:h-16 lg:h-20" />

          <div className="hidden lg:flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white">
                  Shop <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {SHOP_LINKS.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {TOP_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={navItemClass({ isActive: false })}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the wardrobe..."
                    className="w-32 sm:w-40 md:w-64 px-3 sm:px-4 py-1.5 sm:py-2 border border-white/20 bg-white/10 focus:outline-none focus:border-white/40 text-sm text-white placeholder:text-white/40"
                    autoFocus
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-3">
                    <X className="h-4 w-4 text-white/40" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 sm:p-2.5 hover:bg-white/10 transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                </button>
              )}
            </div>

            <CartDrawer>
              <button className="relative p-2 sm:p-2.5 hover:bg-white/10 transition-colors" aria-label="Open cart">
                <ShoppingBag className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 sm:h-5 min-w-5 px-1 rounded-full bg-white text-navy text-[10px] sm:text-[11px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            </CartDrawer>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 sm:p-2.5 hover:bg-white/10 transition-colors" aria-label="Account">
                    <User className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden sm:inline-flex px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] hover:bg-white/10 text-white/80 transition-colors">Sign in</Link>
            )}

            <button
              className="lg:hidden p-2 hover:bg-white/10 transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="lg:hidden border-t border-white/10 bg-navy">
            <div className="container py-4 flex flex-col gap-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Shop</p>
              {SHOP_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-base font-medium text-white/70 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Explore</p>
              {TOP_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-base font-medium text-white/70 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link to="/auth" onClick={() => setOpen(false)} className="px-4 py-3 text-base font-medium text-white/60 hover:text-white">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
