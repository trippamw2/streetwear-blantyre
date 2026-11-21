import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
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
import GiftPacks from "./pages/GiftPacks";
import ScheduledGift from "./pages/ScheduledGift";
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
import AdminGifts from "./pages/admin/Gifts";
import AdminCultureStories from "./pages/admin/CultureStories";
import AdminCommunications from "./pages/admin/Communications";
import AdminLakeFresh from "./pages/admin/LakeFresh";
import AdminLakeFreshOperations from "./pages/admin/LakeFreshOperations";
import AdminLookbooks from "./pages/admin/Lookbooks";
import ProtectedRoute from "./components/ProtectedRoute";
import GiftTrack from "./pages/GiftTrack";
import Editorial from "./pages/Editorial";
import EditorialPost from "./pages/EditorialPost";
import Culture from "./pages/Culture";
import Lookbooks from "./pages/Lookbooks";
import LookbookDetail from "./pages/LookbookDetail";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Looks from "./pages/Looks";
import LookDetail from "./pages/LookDetail";
import AdminSbProductTypes from "./pages/admin/SbProductTypes";
import AdminSbCollections from "./pages/admin/SbCollections";
import AdminSbLooks from "./pages/admin/SbLooks";
import AdminSbCampaigns from "./pages/admin/SbCampaigns";
import AdminSbAnalytics from "./pages/admin/SbAnalytics";
import AdminSbReturns from "./pages/admin/SbReturns";
import Scan from "./pages/Scan";
import LakeFreshHome from "./pages/lf/LakeFreshHome";
import LakeFreshCatalog from "./pages/lf/LakeFreshCatalog";
import LakeFreshProduct from "./pages/lf/LakeFreshProduct";
import LakeFreshCart from "./pages/lf/LakeFreshCart";
import LakeFreshCheckout from "./pages/lf/LakeFreshCheckout";
import LakeFreshAuth from "./pages/lf/LakeFreshAuth";
import LakeFreshOrders from "./pages/lf/LakeFreshOrders";
import LakeFreshOrder from "./pages/lf/LakeFreshOrder";
import LakeFreshRecipes from "./pages/lf/LakeFreshRecipes";
import LakeFreshRecipe from "./pages/lf/LakeFreshRecipe";
import LakeFreshSpices from "./pages/lf/LakeFreshSpices";
import LakeFreshSpiceDetail from "./pages/lf/LakeFreshSpiceDetail";
import LakeFreshPro from "./pages/lf/LakeFreshPro";
import LakeFreshLoyalty from "./pages/lf/LakeFreshLoyalty";
import LakeFreshSubscribe from "./pages/lf/LakeFreshSubscribe";
import LakeFreshTrack from "./pages/lf/LakeFreshTrack";
import LakeFreshDriver from "./pages/lf/LakeFreshDriver";
import LakeFreshPrivacy from "./pages/lf/LakeFreshPrivacy";
import LakeFreshTerms from "./pages/lf/LakeFreshTerms";
import LakeFreshRefund from "./pages/lf/LakeFreshRefund";
import LakeFreshSupport from "./pages/lf/LakeFreshSupport";
import LakeFreshReviews from "./pages/lf/LakeFreshReviews";
import { LakeFreshLayout } from "./components/lf/LakeFreshLayout";
import { LakeFreshProtectedRoute } from "./components/lf/LakeFreshProtectedRoute";
import { IS_DUAL_SITE, IS_LF_SITE, SHOWS_LF, SHOWS_SB } from "./lib/brandSite";

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

// On the dedicated Lake Fresh domain the storefront lives at the root. Any
// legacy `/lf/...` link is sent to its root equivalent so old emails and
// bookmarks keep working without exposing the SB storefront.
const LFBaseRedirect = () => {
  const location = useLocation();
  const stripped = location.pathname.replace(/^\/lf(?=\/|$)/, "") || "/";
  return <Navigate to={`${stripped}${location.search}${location.hash}`} replace />;
};

// Shared Lake Fresh storefront tree. Mounted at the root on the LF domain and
// under `/lf` for local QA; never mounted on the SB domain.
const lakeFreshRouteChildren = (
  <>
    <Route index element={<LakeFreshHome />} />
    <Route path="fish" element={<LakeFreshCatalog />} />
    <Route path="fish/:id" element={<LakeFreshProduct />} />
    <Route path="cart" element={<LakeFreshCart />} />
    <Route path="auth" element={<LakeFreshAuth />} />
    <Route path="checkout" element={<LakeFreshCheckout />} />
    <Route
      path="orders"
      element={
        <LakeFreshProtectedRoute>
          <LakeFreshOrders />
        </LakeFreshProtectedRoute>
      }
    />
    <Route path="orders/:id" element={<LakeFreshOrder />} />
    <Route path="recipes" element={<LakeFreshRecipes />} />
    <Route path="recipes/:slug" element={<LakeFreshRecipe />} />
    <Route path="spices" element={<LakeFreshSpices />} />
    <Route path="spices/:id" element={<LakeFreshSpiceDetail />} />
    <Route path="pro" element={<LakeFreshPro />} />
    <Route path="loyalty" element={<LakeFreshLoyalty />} />
    <Route path="subscribe" element={<LakeFreshSubscribe />} />
    <Route path="track" element={<LakeFreshTrack />} />
    <Route path="support" element={<LakeFreshSupport />} />
    <Route path="reviews" element={<LakeFreshReviews />} />
    <Route path="privacy" element={<LakeFreshPrivacy />} />
    <Route path="terms" element={<LakeFreshTerms />} />
    <Route path="refund" element={<LakeFreshRefund />} />
    <Route path="driver" element={<LakeFreshProtectedRoute><LakeFreshDriver /></LakeFreshProtectedRoute>} />
  </>
);

const App = () => {
  return (
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
                    {/* SB Streetwear storefront, never mounted on the LF domain */}
                    {SHOWS_SB && (
                      <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/combos" element={<Combos />} />
                        <Route path="/kits/:id" element={<KitDetail />} />
                        <Route path="/kits" element={<Navigate to="/combos" replace />} />
                        <Route path="/culture" element={<Culture />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                        <Route path="/track/:id" element={<DeliveryTracking />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/returns" element={<Returns />} />
                        <Route path="/warranty" element={<Warranty />} />
                        <Route path="/gifts" element={<ProtectedRoute><GiftPacks /></ProtectedRoute>} />
                        <Route path="/gift-packs" element={<Navigate to="/gifts" replace />} />
                        <Route path="/gift" element={<ProtectedRoute><ScheduledGift /></ProtectedRoute>} />
                        <Route path="/gift-track/:token" element={<GiftTrack />} />
                        <Route path="/cart" element={<Navigate to="/checkout" replace />} />
                        <Route path="/track-order" element={<Navigate to="/orders" replace />} />
                        <Route path="/loyalty" element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
                        <Route path="/rewards" element={<Navigate to="/loyalty" replace />} />
                        <Route path="/editorial" element={<Editorial />} />
                        <Route path="/editorial/:slug" element={<EditorialPost />} />
                        <Route path="/culture/:pillar" element={<Culture />} />
                        <Route path="/lookbook" element={<Navigate to="/looks" replace />} />
                        <Route path="/lookbook/:slug" element={<LookbookDetail />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/collections/:slug" element={<CollectionDetail />} />
                        <Route path="/looks" element={<Looks />} />
                        <Route path="/looks/:slug" element={<LookDetail />} />
                        <Route path="/stories" element={<Editorial />} />
                        <Route path="/stories/:slug" element={<EditorialPost />} />
                      </Route>
                    )}

                    {/* Dedicated Lake Fresh domain, storefront at the root */}
                    {IS_LF_SITE && (
                      <>
                        <Route element={<LakeFreshLayout />}>
                          {lakeFreshRouteChildren}
                        </Route>
                        <Route path="/lf" element={<LFBaseRedirect />} />
                        <Route path="/lf/*" element={<LFBaseRedirect />} />
                      </>
                    )}

                    {/* Local QA / preview, Lake Fresh remains namespaced under /lf */}
                    {IS_DUAL_SITE && (
                      <Route path="/lf" element={<LakeFreshLayout />}>
                        {lakeFreshRouteChildren}
                      </Route>
                    )}

                    {/* Standalone pages (no header/footer) */}
                    <Route path="/verify/:token" element={<Verify />} />
                    <Route path="/passport/:token" element={<Passport />} />
                    <Route path="/scan/:barcode" element={<Scan />} />

                    {/* SB Streetwear admin. Lake Fresh data is never shown here. */}
                    {SHOWS_SB && (
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
                        <Route path="communications" element={<AdminCommunications />} />
                        <Route path="authentication" element={<AdminAuthentication />} />
                        <Route path="customers" element={<AdminCRM />} />
                        <Route path="analytics" element={<AdminSbAnalytics />} />
                        <Route path="returns" element={<AdminSbReturns />} />
                        <Route path="gifts" element={<AdminGifts />} />
                        <Route path="culture-stories" element={<AdminCultureStories />} />
                        <Route path="lookbooks" element={<AdminLookbooks />} />
                        <Route path="product-types" element={<AdminSbProductTypes />} />
                        <Route path="collections" element={<AdminSbCollections />} />
                        <Route path="looks" element={<AdminSbLooks />} />
                        <Route path="campaigns" element={<AdminSbCampaigns />} />
                      </Route>
                    )}

                    {/* Lake Fresh admin. Its own deployment keeps `/admin`; on a
                        dual host it lives at `/lf/admin`. No SB modules or data. */}
                    {SHOWS_LF && (
                      <Route
                        path={IS_LF_SITE ? "/admin" : "/lf/admin"}
                        element={<AdminLayout />}
                      >
                        <Route index element={<AdminLakeFresh />} />
                        <Route path="operations" element={<AdminLakeFreshOperations />} />
                        <Route path="promos" element={<AdminPromos />} />
                        <Route path="loyalty" element={<AdminLoyalty />} />
                        <Route path="referrals" element={<AdminReferrals />} />
                        <Route path="communications" element={<AdminCommunications />} />
                      </Route>
                    )}

                    {/* 404 catch-all, must be LAST so it doesn't swallow /admin */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
