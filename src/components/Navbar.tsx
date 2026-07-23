import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartDrawer } from "./CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/combos", label: "Fashion Bundles" },
  { to: "/shop", label: "Shop" },
  { to: "/rewards", label: "Rewards" },
  { to: "/contact", label: "Contact" },
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

  return (
    <header className="sticky top-0 z-40 bg-navy border-b border-white/10">
      <nav className="container flex h-16 sm:h-20 lg:h-24 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        <Logo className="h-12 sm:h-14 md:h-16 lg:h-20" />

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-white font-semibold" : "text-white/60 hover:text-white"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <div ref={searchRef} className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
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

          {/* Cart */}
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

          {/* User Menu */}
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
            <Link to="/auth" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium hover:bg-white/10 text-white/80 transition-colors">Sign in</Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 hover:bg-white/10 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-navy">
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-3 text-base font-medium transition-colors",
                    isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white"
                  )
                }
              >
                {l.label}
              </NavLink>
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
  );
};
