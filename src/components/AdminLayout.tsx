import { Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, type ElementType } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Warehouse,
  ChevronLeft,
  Zap,
  MessageCircle,
  Truck,
  Users,
  Tag,
  LayoutGrid,
  Shield,
  Gift,
  BookOpen,
  Camera,
  Fish,
  Send,
  Star,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { lfPath, storefrontHome } from "@/lib/brandSite";
import { supabase } from "@/integrations/supabase/client";
import { adminBrandId, adminPath, useAdminBrand } from "@/lib/adminBrand";
import { AdminMfaGate } from "@/components/AdminMfaGate";

interface AdminLink {
  to: string;
  label: string;
  icon: ElementType;
  end?: boolean;
  tab?: string;
}

const SB_LINKS: AdminLink[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/combos", label: "Combos", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/gifts", label: "Gifts", icon: Gift },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/promotions", label: "Promotions", icon: Zap },
  { to: "/promos", label: "Promo Codes", icon: Tag },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/testimonials", label: "Testimonials", icon: MessageCircle },
  { to: "/business", label: "Business", icon: Building2 },
  { to: "/inventory", label: "Inventory", icon: Warehouse },
  { to: "/authentication", label: "Authentication", icon: Shield },
  { to: "/culture-stories", label: "Culture Stories", icon: BookOpen },
  { to: "/lookbooks", label: "Lookbooks", icon: Camera },
  { to: "/delivery", label: "Delivery", icon: Truck },
  { to: "/loyalty", label: "Rewards", icon: Star },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/communications", label: "Communications", icon: Send },
  { to: "/settings", label: "Settings", icon: Settings },
];

const LF_LINKS: AdminLink[] = [
  { to: "/", label: "Operations", icon: Fish, end: true },
  { to: "/operations?tab=lots", label: "Traceability", icon: Shield, tab: "lots" },
  { to: "/operations?tab=team", label: "Team", icon: Users, tab: "team" },
  { to: "?tab=orders", label: "Orders", icon: ShoppingCart, tab: "orders" },
  { to: "?tab=catalog", label: "Fish & Prices", icon: Fish, tab: "catalog" },
  { to: "?tab=spices", label: "Spices", icon: Package, tab: "spices" },
  { to: "?tab=recipes", label: "Recipes & PDFs", icon: BookOpen, tab: "recipes" },
  { to: "?tab=media", label: "Media", icon: Camera, tab: "media" },
  { to: "?tab=delivery", label: "Delivery", icon: Truck, tab: "delivery" },
  { to: "?tab=preparation", label: "Preparation", icon: Package, tab: "preparation" },
  { to: "?tab=analytics", label: "Analytics", icon: Zap, tab: "analytics" },
  { to: "/promos", label: "Promo Codes", icon: Tag },
  { to: "/loyalty", label: "Rewards", icon: Star },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/communications", label: "Communications", icon: Send },
];

export const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const brand = useAdminBrand();
  const isLfAdmin = brand === "lf";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  const brandId = adminBrandId(brand);
  const links = isLfAdmin ? LF_LINKS : SB_LINKS;
  const base = adminPath(brand);
  const storeHome = isLfAdmin ? storefrontHome(true) : "/";
  const authPath = isLfAdmin ? lfPath("/auth") : "/auth";
  const brandName = isLfAdmin ? "Lake Fresh Admin" : "SB Admin";
  const activeTab = searchParams.get("tab") || "";

  const PageIcon = isLfAdmin ? Fish : LayoutDashboard;

  // A user may enter an admin panel only when they are a global admin or have
  // an explicit staff permission for this exact brand.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAccess("checking");
      return;
    }

    let cancelled = false;
    setAccess("checking");

    Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle(),
      supabase.rpc("has_brand_permission", {
        p_brand_id: brandId,
        p_permission: "brand.access",
      }),
    ])
      .then(([roleRes, permissionRes]) => {
        if (cancelled) return;
        const allowed = Boolean(roleRes.data) || permissionRes.data === true;
        setAccess(allowed ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setAccess("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, brandId]);

  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`${authPath}?redirect=${redirect}`, { replace: true });
    }
  }, [user, authLoading, navigate, authPath, location.pathname, location.search]);

  useEffect(() => {
    if (access === "denied") {
      navigate(storeHome, { replace: true });
    }
  }, [access, navigate, storeHome]);

  if (authLoading || access === "checking" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div
            className={cn(
              "mx-auto h-10 w-10 animate-spin rounded-full border-4 border-t-transparent",
              isLfAdmin ? "border-[#073B78]" : "border-navy",
            )}
          />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const linkTarget = (link: AdminLink) => adminPath(brand, link.to);
  const isActive = (link: AdminLink) => {
    if (link.tab) {
      const linkPath = adminPath(brand, link.to.split("?")[0] || "/");
      return location.pathname === linkPath && activeTab === link.tab;
    }
    if (link.end) return location.pathname === base && !activeTab;
    return location.pathname === adminPath(brand, link.to) ||
      location.pathname.startsWith(`${adminPath(brand, link.to)}/`);
  };

  return (
    <AdminMfaGate>
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn("p-4 border-b border-gray-100", isLfAdmin ? "bg-[#073B78]" : "bg-navy")}>
            {isLfAdmin ? (
              <img
                src="/brand/lake-fresh/icon.png"
                alt="Lake Fresh Fish Mart"
                className="h-8 w-auto max-w-[170px] object-contain"
              />
            ) : (
              <Logo className="h-8" />
            )}
            <p className="text-xs text-white/60 mt-1">{brandName}</p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white">
              <PageIcon className="h-3.5 w-3.5" />
              {isLfAdmin ? "Fish Mart" : "Streetwear"}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {links.map((link) => {
              const active = isActive(link);
              const target = linkTarget(link);

              return (
                <a
                  key={`${link.to}-${link.label}`}
                  href={target}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(target);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? isLfAdmin
                        ? "bg-[#073B78] text-white"
                        : "bg-navy text-white"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-2">
            <a
              href={storeHome}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = storeHome;
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Store
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate(storeHome);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className={cn("lg:hidden flex items-center justify-between p-4 border-b border-white/10", isLfAdmin ? "bg-[#073B78]" : "bg-navy")}>
          {isLfAdmin ? (
            <img
              src="/brand/lake-fresh/icon.png"
              alt="Lake Fresh Fish Mart"
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <Logo className="h-8" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Admin menu"
          >
            {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    </AdminMfaGate>
  );
};
