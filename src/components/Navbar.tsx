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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <nav className="container flex h-14 sm:h-16 lg:h-20 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        <Logo className="h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18" />

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
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
                  className="w-32 sm:w-40 md:w-64 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-3">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 sm:p-2.5 hover:bg-gray-50"
                aria-label="Search"
              >
                <Search className="h-5 sm:h-6 w-5 sm:w-6 text-gray-900" />
              </button>
            )}
          </div>

          {/* Cart */}
          <CartDrawer>
            <button className="relative p-2 sm:p-2.5 hover:bg-gray-50" aria-label="Open cart">
              <ShoppingBag className="h-5 sm:h-6 w-5 sm:w-6 text-gray-900" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 sm:h-5 min-w-5 px-1 rounded-full bg-gray-900 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </CartDrawer>

{/* User Menu - icon only on mobile */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 sm:p-2.5 hover:bg-gray-50" aria-label="Account">
                  <User className="h-5 sm:h-6 w-5 sm:w-6 text-gray-900" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium hover:bg-gray-50 text-gray-700">Sign in</Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 hover:bg-gray-50"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
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
                    isActive ? "text-gray-900 bg-gray-100" : "text-gray-500"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-4 py-3 text-base font-medium text-gray-500">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};