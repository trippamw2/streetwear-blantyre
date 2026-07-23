import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X, Building2, Warehouse, ChevronLeft, Zap, MessageCircle, Truck, Users, Tag, LayoutGrid, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { to: "/admin/combos", label: "Combos", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/promotions", label: "Promotions", icon: Zap },
  { to: "/admin/promos", label: "Promo Codes", icon: Tag },
  { to: "/admin/crm", label: "CRM", icon: Users },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageCircle },
  { to: "/admin/business", label: "Business", icon: Building2 },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/authentication", label: "Authentication", icon: Shield },
  { to: "/admin/delivery", label: "Delivery", icon: Zap },
  { to: "/admin/loyalty", label: "Loyalty", icon: Zap },
  { to: "/admin/referrals", label: "Referrals", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Check if user has admin role in user_roles table
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then(({ data }) => {
          setIsAdmin(!!data);
          setCheckingRole(false);
        })
        .catch(() => {
          setIsAdmin(false);
          setCheckingRole(false);
        });
    } else {
      setCheckingRole(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/admin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect non-admins
  useEffect(() => {
    if (!checkingRole && user && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [checkingRole, user, isAdmin, navigate]);

  if (authLoading || checkingRole || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-navy border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-navy">
            <Logo className="h-8" />
            <p className="text-xs text-white/60 mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {adminLinks.map((link) => {
              const isActive = location.pathname === link.to ||
                (link.to !== "/admin" && location.pathname.startsWith(link.to));

              return (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.to);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-navy text-white"
                        : "text-gray-600 hover:bg-gray-100"
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
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Store
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-navy border-b border-white/10">
          <Logo className="h-8" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};