import { Suspense, lazy, useEffect } from "react";
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
import ProtectedRoute from "./components/ProtectedRoute";
import { LakeFreshLayout } from "./components/lf/LakeFreshLayout";
import { LakeFreshProtectedRoute } from "./components/lf/LakeFreshProtectedRoute";
import { IS_DUAL_SITE, IS_LF_SITE, SHOWS_LF, SHOWS_SB } from "./lib/brandSite";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Combos = lazy(() => import("./pages/Combos"));
const KitDetail = lazy(() => import("./pages/KitDetail"));
const Compare = lazy(() => import("./pages/Compare"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const DeliveryTracking = lazy(() => import("./pages/DeliveryTracking"));
const GiftPacks = lazy(() => import("./pages/GiftPacks"));
const ScheduledGift = lazy(() => import("./pages/ScheduledGift"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminBusiness = lazy(() => import("./pages/admin/Business"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions"));
const AdminCombos = lazy(() => import("./pages/admin/Combos"));
const AdminDelivery = lazy(() => import("./pages/admin/Delivery"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminSuppliers = lazy(() => import("./pages/admin/Suppliers"));
const AdminPromos = lazy(() => import("./pages/admin/Promos"));
const AdminCRM = lazy(() => import("./pages/admin/CRM"));
const AdminLoyalty = lazy(() => import("./pages/admin/Loyalty"));
const AdminReferrals = lazy(() => import("./pages/admin/Referrals"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const Terms = lazy(() => import("./pages/policy/Terms"));
const Privacy = lazy(() => import("./pages/policy/Privacy"));
const FAQ = lazy(() => import("./pages/policy/FAQ"));
const Returns = lazy(() => import("./pages/policy/Returns"));
const Warranty = lazy(() => import("./pages/policy/Warranty"));
const Loyalty = lazy(() => import("./pages/Loyalty"));
const Verify = lazy(() => import("./pages/Verify"));
const Passport = lazy(() => import("./pages/Passport"));
const AdminAuthentication = lazy(() => import("./pages/admin/Authentication"));
const AdminGifts = lazy(() => import("./pages/admin/Gifts"));
const AdminCultureStories = lazy(() => import("./pages/admin/CultureStories"));
const AdminCommunications = lazy(() => import("./pages/admin/Communications"));
const AdminLakeFresh = lazy(() => import("./pages/admin/LakeFresh"));
const AdminLakeFreshOperations = lazy(() => import("./pages/admin/LakeFreshOperations"));
const AdminLookbooks = lazy(() => import("./pages/admin/Lookbooks"));
const GiftTrack = lazy(() => import("./pages/GiftTrack"));
const Editorial = lazy(() => import("./pages/Editorial"));
const EditorialPost = lazy(() => import("./pages/EditorialPost"));
const Culture = lazy(() => import("./pages/Culture"));
const Lookbooks = lazy(() => import("./pages/Lookbooks"));
const LookbookDetail = lazy(() => import("./pages/LookbookDetail"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const Looks = lazy(() => import("./pages/Looks"));
const LookDetail = lazy(() => import("./pages/LookDetail"));
const AdminSbProductTypes = lazy(() => import("./pages/admin/SbProductTypes"));
const AdminSbCollections = lazy(() => import("./pages/admin/SbCollections"));
const AdminSbLooks = lazy(() => import("./pages/admin/SbLooks"));
const AdminSbCampaigns = lazy(() => import("./pages/admin/SbCampaigns"));
const AdminSbAnalytics = lazy(() => import("./pages/admin/SbAnalytics"));
const AdminSbReturns = lazy(() => import("./pages/admin/SbReturns"));
const Scan = lazy(() => import("./pages/Scan"));
const LakeFreshHome = lazy(() => import("./pages/lf/LakeFreshHome"));
const LakeFreshCatalog = lazy(() => import("./pages/lf/LakeFreshCatalog"));
const LakeFreshProduct = lazy(() => import("./pages/lf/LakeFreshProduct"));
const LakeFreshCart = lazy(() => import("./pages/lf/LakeFreshCart"));
const LakeFreshCheckout = lazy(() => import("./pages/lf/LakeFreshCheckout"));
const LakeFreshAuth = lazy(() => import("./pages/lf/LakeFreshAuth"));
const LakeFreshOrders = lazy(() => import("./pages/lf/LakeFreshOrders"));
const LakeFreshOrder = lazy(() => import("./pages/lf/LakeFreshOrder"));
const LakeFreshRecipes = lazy(() => import("./pages/lf/LakeFreshRecipes"));
const LakeFreshRecipe = lazy(() => import("./pages/lf/LakeFreshRecipe"));
const LakeFreshSpices = lazy(() => import("./pages/lf/LakeFreshSpices"));
const LakeFreshSpiceDetail = lazy(() => import("./pages/lf/LakeFreshSpiceDetail"));
const LakeFreshPro = lazy(() => import("./pages/lf/LakeFreshPro"));
const LakeFreshLoyalty = lazy(() => import("./pages/lf/LakeFreshLoyalty"));
const LakeFreshSubscribe = lazy(() => import("./pages/lf/LakeFreshSubscribe"));
const LakeFreshTrack = lazy(() => import("./pages/lf/LakeFreshTrack"));
const LakeFreshDriver = lazy(() => import("./pages/lf/LakeFreshDriver"));
const LakeFreshPrivacy = lazy(() => import("./pages/lf/LakeFreshPrivacy"));
const LakeFreshTerms = lazy(() => import("./pages/lf/LakeFreshTerms"));
const LakeFreshRefund = lazy(() => import("./pages/lf/LakeFreshRefund"));
const LakeFreshSupport = lazy(() => import("./pages/lf/LakeFreshSupport"));
const LakeFreshReviews = lazy(() => import("./pages/lf/LakeFreshReviews"));

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
                  <Suspense fallback={<div className="min-h-[40vh]" aria-hidden="true" />}>
                  <Routes>
                    {/* SB storefront, never mounted on the LF domain */}
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

                    {/* SB admin. Lake Fresh data is never shown here. */}
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
                  </Suspense>
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
