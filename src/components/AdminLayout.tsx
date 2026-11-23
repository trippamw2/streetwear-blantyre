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
  CreditCard,
  RotateCcw,
  PieChart,
  Home,
  Megaphone,
  Percent,
  UserCog,
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

interface AdminLinkGroup {
  heading: string;
  links: AdminLink[];
}

const SB_LINK_GROUPS: AdminLinkGroup[] = [
  {
    heading: "Dashboard",
    links: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    heading: "Catalog",
    links: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/categories", label: "Categories", icon: LayoutGrid },
      { to: "/collections", label: "Collections", icon: Package },
      { to: "/collections?kind=drop", label: "Drops", icon: Tag },
      { to: "/looks", label: "Looks", icon: Camera },
      { to: "/inventory", label: "Inventory", icon: Warehouse },
      { to: "/product-types", label: "Product Types", icon: LayoutGrid },
    ],
  },
  {
    heading: "Orders",
    links: [
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/settings?tab=payments", label: "Payments", icon: CreditCard, tab: "payments" },
      { to: "/delivery", label: "Shipping", icon: Truck },
      { to: "/returns", label: "Returns", icon: RotateCcw },
    ],
  },
  {
    heading: "Customers",
    links: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/crm?view=segments", label: "Segments", icon: Users },
    ],
  },
  {
    heading: "Content",
    links: [
      { to: "/campaigns", label: "Homepage", icon: Home },
      { to: "/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/culture-stories", label: "Stories", icon: BookOpen },
      { to: "/lookbooks", label: "Lookbooks", icon: Camera },
      { to: "/promotions", label: "Banners", icon: Zap },
    ],
  },
  {
    heading: "Analytics",
    links: [
      { to: "/analytics?view=revenue", label: "Revenue", icon: PieChart },
      { to: "/analytics?view=products", label: "Products", icon: Package },
      { to: "/analytics?view=customers", label: "Customers", icon: Users },
      { to: "/analytics?view=campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    heading: "Settings",
    links: [
      { to: "/settings?tab=store", label: "Store", icon: Settings, tab: "store" },
      { to: "/settings?tab=payments", label: "Payments", icon: CreditCard, tab: "payments" },
      { to: "/settings?tab=shipping", label: "Shipping", icon: Truck, tab: "shipping" },
      { to: "/settings?tab=taxes", label: "Taxes", icon: Percent, tab: "taxes" },
      { to: "/settings?tab=users", label: "Users", icon: UserCog, tab: "users" },
      { to: "/settings?tab=permissions", label: "Permissions", icon: Shield, tab: "permissions" },
    ],
  },
  {
    heading: "More",
    links: [
      { to: "/combos", label: "Combos", icon: Gift },
      { to: "/customers", label: "CRM", icon: Users },
      { to: "/testimonials", label: "Testimonials", icon: MessageCircle },
      { to: "/business", label: "Business", icon: Building2 },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
      { to: "/authentication", label: "Authentication", icon: Shield },
      { to: "/loyalty", label: "Rewards", icon: Star },
      { to: "/referrals", label: "Referrals", icon: Users },
      { to: "/communications", label: "Communications", icon: Send },
      { to: "/promos", label: "Promo Codes", icon: Tag },
    ],
  },
];

const SB_LINKS = SB_LINK_GROUPS.flatMap((group) => group.links);

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
  { to: "/operations?tab=reviews", label: "Reviews", icon: MessageCircle, tab: "reviews" },
  { to: "/operations?tab=growth", label: "Growth", icon: Zap, tab: "growth" },
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
  const brandName = isLfAdmin ? "Lake Fresh Admin" : "Streetwear Admin";
  const activeTab = searchParams.get("tab") || "";
  const activeView = searchParams.get("view") || "";

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
    const linkView = new URLSearchParams(link.to.split("?")[1] || "").get("view");
    if (linkView) {
      const linkPath = adminPath(brand, link.to.split("?")[0] || "/");
      return location.pathname === linkPath && activeView === linkView;
    }
    if (link.tab) {
      const linkPath = adminPath(brand, link.to.split("?")[0] || "/");
      return location.pathname === linkPath && activeTab === link.tab;
    }
    if (link.end) return location.pathname === base && !activeTab && !activeView;
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

          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {(isLfAdmin ? [{ heading: "", links }] : SB_LINK_GROUPS).map((group) => (
              <div key={group.heading || "links"} className="space-y-1">
                {group.heading && (
                  <p className="px-4 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {group.heading}
                  </p>
                )}
                {group.links.map((link) => {
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
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
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
              </div>
            ))}
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
