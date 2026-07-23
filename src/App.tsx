import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Combos from "./pages/Combos";
import KitDetail from "./pages/KitDetail";
import Compare from "./pages/Compare";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound.tsx";
import DeliveryTracking from "./pages/DeliveryTracking";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminSettings from "./pages/admin/Settings";
import AdminBusiness from "./pages/admin/Business";
import AdminInventory from "./pages/admin/Inventory";
import AdminPromotions from "./pages/admin/Promotions";
import AdminCombos from "./pages/admin/Combos";
import AdminDelivery from "./pages/admin/Delivery";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminSuppliers from "./pages/admin/Suppliers";
import AdminPromos from "./pages/admin/Promos";
import AdminCRM from "./pages/admin/CRM";
import AdminLoyalty from "./pages/admin/Loyalty";
import AdminReferrals from "./pages/admin/Referrals";
import AdminCategories from "./pages/admin/Categories";
import Terms from "./pages/policy/Terms";
import Privacy from "./pages/policy/Privacy";
import FAQ from "./pages/policy/FAQ";
import Returns from "./pages/policy/Returns";
import Warranty from "./pages/policy/Warranty";
import Loyalty from "./pages/Loyalty";
import Verify from "./pages/Verify";
import Passport from "./pages/Passport";
import AdminAuthentication from "./pages/admin/Authentication";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Store referral code from URL for signup use
const ReferralLoader = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && !localStorage.getItem("referredBy")) {
      localStorage.setItem("referredBy", ref);
    }
  }, []);
  return null;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ReferralLoader />
      <AuthProvider>
        <CartProvider>
          <CompareProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <ScrollToTop />
                <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/combos" element={<Combos />} />
                  <Route path="/kits/:id" element={<KitDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/track/:id" element={<DeliveryTracking />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/warranty" element={<Warranty />} />
                  <Route path="/rewards" element={<Loyalty />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                {/* Standalone pages (no header/footer) */}
                <Route path="/verify/:token" element={<Verify />} />
                <Route path="/passport/:token" element={<Passport />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="combos" element={<AdminCombos />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="promos" element={<AdminPromos />} />
                  <Route path="crm" element={<AdminCRM />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="business" element={<AdminBusiness />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="delivery" element={<AdminDelivery />} />
                  <Route path="suppliers" element={<AdminSuppliers />} />
                  <Route path="loyalty" element={<AdminLoyalty />} />
                  <Route path="referrals" element={<AdminReferrals />} />
                  <Route path="authentication" element={<AdminAuthentication />} />
                </Route>
              </Routes>
            </BrowserRouter>
        </CompareProvider>
          </CartProvider>
        </AuthProvider>
    </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );


export default App;
