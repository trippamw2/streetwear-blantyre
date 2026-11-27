import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatMWK, getBrandName, getCategoryLabel, getKitPrice, getKitRealSaving } from "@/data/products";
import { SEO } from "@/components/SEO";
import { useCombos } from "@/hooks/useCombos";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { useCompare } from "@/contexts/CompareContext";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  Star,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Facebook,
  Link2,
  Zap,
  GitCompare,
  ArrowRight,
  Package,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { fetchSbVariants, useSbMerchandising, type SbVariant } from "@/hooks/useSbMerchandising";
import {
  getCompleteLookProducts,
  getProductTypeLabel,
  getRelatedProducts,
  getTypeOptions,
  getVariantColorOptions,
} from "@/data/sbArchitecture";
import { buildWhatsAppLink, productMessage } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const COLOR_SWATCHES: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  blue: "#2563eb",
  navy: "#0a0a0a",
  grey: "#6b7280",
  gray: "#6b7280",
  green: "#16a34a",
  red: "#dc2626",
};

const colorToCss = (color: string) => COLOR_SWATCHES[color.toLowerCase()] || color;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading, getProduct } = useProducts();
  const product = getProduct(id || "");
  const { add } = useCart();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const [qty, setQty] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [variants, setVariants] = useState<SbVariant[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const { isWishlisted, toggle: toggleWishlist } = useWishlist(product?.id);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reviews, setReviews] = useState<
    { rating: number; review_text: string; customer_name: string; created_at: string }[]
  >([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const combos = useCombos();
  const { completeLookRules, relations } = useSbMerchandising();
  const [userRating, setUserRating] = useState(0);
  const [userRatingHover, setUserRatingHover] = useState(0);
  const [userName, setUserName] = useState("");
  const [userReview, setUserReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Derived values
  const galleryImages =
    product?.gallery_images?.length > 0 ? [product?.image, ...product.gallery_images] : [product?.image];
  const selectedImageSrc = galleryImages?.[selectedImage] || product?.image || "";

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("rating, review_text, customer_name, created_at")
        .eq("product_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) {
        console.error("Fetch reviews error:", error);
      }
      setReviews(data || []);
    } catch {
      // No reviews available
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!product?.id) {
      setVariants([]);
      setSelectedSize("");
      setSelectedColor("");
      return;
    }
    let cancelled = false;
    fetchSbVariants(product.id)
      .then((rows) => {
        if (cancelled) return;
        const initial = rows.find((variant) => variant.stockQty > variant.reservedQty) || rows[0];
        setVariants(rows);
        setSelectedSize(initial?.sizeLabel || "");
        setSelectedColor(initial?.color || "");
        setSelectedType(product.types[0]?.id || "");
      })
      .catch(() => {
        if (cancelled) return;
        setVariants([]);
        setSelectedSize("");
        setSelectedColor("");
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (variants.length === 0 && product?.types?.length > 0) {
      setSelectedType(product.types[0].id);
    }
  }, [product, variants.length]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-3 text-center">
          <p className="text-lg text-gray-600">Product not found</p>
          <Link to="/shop" className="font-semibold text-primary hover:underline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const reviewCount = reviews.length;

  const selectedVariant =
    variants.find(
      (variant) => variant.sizeLabel === selectedSize && variant.color === selectedColor,
    ) || variants.find((variant) => variant.sizeLabel === selectedSize);
  const legacyCompareAt = product.compare_at_price || product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? legacyCompareAt;
  const displayPrice = selectedVariant?.price ?? product.price;
  const isOnSale = displayPrice < compareAtPrice || (product.is_on_sale && (product.discount_percent ?? 0) > 0);
  const stock = selectedVariant
    ? Math.max(0, selectedVariant.stockQty - selectedVariant.reservedQty)
    : product.stock ?? 0;
  const inStock = stock > 0;
  const sizeOptions = getTypeOptions(variants, product.types);
  const colorOptions = getVariantColorOptions(variants, selectedSize);
  const galleryLabels = ["Product photo", "Model photo", "Front view", "Back view", "Detail"];

  const submitReview = async () => {
    if (!id) {
      toast({ title: "Error", description: "Product not found", variant: "destructive" });
      return;
    }
    if (!userName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!userRating) {
      toast({ title: "Error", description: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: id,
        rating: userRating,
        customer_name: userName.trim(),
        review_text: userReview.trim() || null,
        is_active: true,
      });

      if (error) {
        console.error("Review insert error:", error.code, error.message, error.details);
        toast({
          title: "Error",
          description: error.message || "Could not submit review",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Review submitted", description: "Thank you for sharing your experience." });
      setUserRating(0);
      setUserName("");
      setUserReview("");
      fetchReviews();
    } catch (err: any) {
      console.error("Review submit error:", err?.message || err);
      toast({
        title: "Error",
        description: err?.message || "Could not submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completeLook = getCompleteLookProducts(product, products, completeLookRules, relations, 4);
  const related = getRelatedProducts(product, products, relations, 4);

  const selectedTypeName = selectedVariant?.sizeLabel ||
    (variants.length === 0
      ? product.types.find((t) => t.id === selectedType)?.name || product.types[0]?.name || ""
      : selectedSize);

  const handleAdd = () => {
    const fullName = selectedTypeName ? `${product.name} (${selectedTypeName})` : product.name;
    add(
      {
        productKey: `${product.id}-${selectedVariant?.id || selectedType}`,
        productId: product.id,
        name: fullName,
        price: displayPrice,
        image: product.image,
      },
      qty,
    );
    toast({ title: "Added to bag", description: `${qty} x ${fullName}` });
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate("/checkout");
  };

  const handleWishlist = () => {
    const saved = toggleWishlist(product.id);
    toast({
      title: saved ? "Saved to wishlist" : "Removed from wishlist",
      description: product.name,
    });
  };

  const handleShare = (platform: string) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `${product.name} at SB. ${formatMWK(displayPrice)}.`;

    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    } else if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", description: "Share link copied to clipboard" });
      setShowShareModal(false);
      return;
    }

    if (url) window.open(url, "_blank", "width=600,height=400");
    setShowShareModal(false);
  };

  const specs = [
    { label: "Brand", value: getBrandName(product.brand) },
    { label: "Category", value: getProductTypeLabel(product) },
    ...(product.subcategory ? [{ label: "Style", value: product.subcategory }] : []),
    { label: "Fit", value: product.fit || "Relaxed fit" },
    { label: "Material", value: product.material || "Cotton blend" },
    { label: "Gender", value: product.gender_classification || "Unisex" },
    { label: "SKU", value: selectedVariant?.sku || product.sku || product.id.toUpperCase() },
    { label: "Quality", value: "Checked before dispatch" },
    ...(product.specs
      ? Object.entries(product.specs).map(([key, value]) => ({ label: key, value }))
      : []),
  ];

  const faqs = [
    {
      q: "Is this genuine?",
      a: "Yes. Every piece is sourced from trusted brands and suppliers. We are a retailer and do not manufacture the items we sell.",
    },
    {
      q: "What if there is a fault?",
      a: "Contact us within 30 days of delivery. If the item has a manufacturing fault, we will repair, replace or refund it.",
    },
    {
      q: "How long does delivery take?",
      a: "Blantyre: same day or 1 to 3 days. Other areas in Malawi: 3 to 5 working days.",
    },
    {
      q: "Can I change the size?",
      a: "Yes, if the size is still in stock. The item must be unworn with its tags attached. Message us on WhatsApp to arrange it.",
    },
  ];

  const pillarLabel = product.culture_pillar ? "Urban Lifestyle" : "";
  const pillarCopy = product.culture_pillar
    ? "Style is personal. This piece is curated for everyday movement, confidence, and the many ways you show up."
    : "";

  return (
    <div className="bg-white pb-24 md:pb-0">
      <div className="container px-4 py-8 sm:px-6 sm:py-14">
        <SEO
          title={`${product.name} | SB`}
          description={
            product.culture_story ||
            product.benefit ||
            "Quality streetwear clothing from SB. Shop tees, vests, shirts, and shorts made for everyday comfort and style."
          }
          type="product"
          path={"/product/" + product.id}
          image={product.image}
        />
        <Link
          to="/shop"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Collection
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:aspect-[3/4] lg:aspect-square">
              {selectedImageSrc ? (
                <img
                  src={selectedImageSrc}
                  alt={product.name}
                  className="h-full w-full object-contain object-center bg-gray-100 sm:object-cover sm:object-top"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-100 to-gray-200 px-4 text-center">
                  <span className="font-display text-4xl font-extrabold tracking-[0.2em] text-primary/20">
                    SB
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {getCategoryLabel(product.category)}
                  </span>
                </div>
              )}

              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  onClick={handleWishlist}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  className="rounded-full bg-white/95 p-3 shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                  />
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share this piece"
                  className="rounded-full bg-white/95 p-3 shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {isOnSale && (
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Save {product.discount_percent}%
                </span>
              )}
            </motion.div>

            <AnimatePresence>
              {showShareModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
                  onClick={() => setShowShareModal(false)}
                >
                  <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="w-full max-w-md rounded-t-3xl border border-gray-200 bg-white p-6 sm:rounded-3xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="mb-4 font-display text-xl font-bold text-gray-900">
                      Share This Piece
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        onClick={() => handleShare("whatsapp")}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-4 transition-colors hover:bg-gray-200"
                      >
                        <MessageCircle className="h-7 w-7 text-green-600" />
                        <span className="text-[11px] font-medium text-gray-700">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare("facebook")}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-4 transition-colors hover:bg-gray-200"
                      >
                        <Facebook className="h-7 w-7 text-blue-700" />
                        <span className="text-[11px] font-medium text-gray-700">Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare("twitter")}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-4 transition-colors hover:bg-gray-200"
                      >
                        <svg
                          className="h-7 w-7 text-gray-900"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-[11px] font-medium text-gray-700">X</span>
                      </button>
                      <button
                        onClick={() => handleShare("copy")}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-4 transition-colors hover:bg-gray-200"
                      >
                        <Link2 className="h-7 w-7 text-gray-600" />
                        <span className="text-[11px] font-medium text-gray-700">Copy</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="mt-4 w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 sm:gap-3">
              {(product.gallery_images && product.gallery_images.length > 0
                ? [product.image, ...product.gallery_images]
                : [product.image]
              ).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  title={galleryLabels[i] || `Photo ${i + 1}`}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={galleryLabels[i] || `Photo ${i + 1}`} className="h-full w-full object-contain object-center bg-gray-100 sm:object-cover sm:object-top" loading="lazy" decoding="async" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gray-950/70 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                    {galleryLabels[i] || `Photo ${i + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              {product.brand && (
                <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  {getBrandName(product.brand)}
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {getProductTypeLabel(product)}
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>
              <p className="text-base leading-relaxed text-gray-600">{product.benefit}</p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">
                    {reviewCount > 0 ? `(${reviewCount} reviews)` : "(No reviews yet)"}
                  </span>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-sm font-medium ${
                    inStock ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {inStock
                    ? stock <= 5
                      ? `Only ${stock} left`
                      : "In stock"
                    : "Out of stock"}
                </span>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <p className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {formatMWK(displayPrice)}
              </p>
              {isOnSale && (
                <p className="pb-1 text-base text-gray-500 line-through">
                  {formatMWK(compareAtPrice)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-gray-900">Quick facts</p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm">
                <p><span className="font-semibold text-gray-900">Fit:</span> {product.fit || "Relaxed fit"}</p>
                <p><span className="font-semibold text-gray-900">Material:</span> {product.material || "Check product details"}</p>
                <p><span className="font-semibold text-gray-900">Delivery:</span> Blantyre 1-3 days, other areas 3-5 days</p>
                <p><span className="font-semibold text-gray-900">Exchange:</span> 14 days on eligible items</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{product.model_fit_note || "Need size help? Check the size guide or WhatsApp us."}</p>
              {product.care_instructions && <p className="mt-2 text-xs leading-relaxed"><span className="font-semibold text-gray-900">Care:</span> {product.care_instructions}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-200 pt-3 text-xs font-semibold">
                <Link to="/faq#size-guide" className="text-primary hover:underline">Size guide</Link>
                <Link to="/returns" className="text-primary hover:underline">Returns & exchange</Link>
                <Link to="/warranty" className="text-primary hover:underline">Quality cover</Link>
                <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WhatsApp help</a>
              </div>
            </div>

            {(product.reward_points ?? 0) > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-800">
                  Earn {product.reward_points} reward points with this purchase
                </span>
              </div>
            )}

            {/* Kit Upsell */}
            {(() => {
              const matchingKits = combos
                .filter((k) => k.productIds.some((pid) => pid === product.id))
                .slice(0, 2);

              if (matchingKits.length === 0) return null;

              return (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-gray-900">
                      Also available in these kits
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {matchingKits.map((kit) => (
                      <Link
                        key={kit.id}
                        to="/combos"
                        className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {kit.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary">
                              {kit.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Save {formatMWK(getKitRealSaving(kit, products))} ·{" "}
                              {kit.productIds.length} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {formatMWK(getKitPrice(kit, products))}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-600">
                    Better value. One delivery. The full look.
                  </p>
                </div>
              );
            })()}

            {/* Compare & Wishlist */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (isInCompare(product.id)) {
                    removeFromCompare(product.id);
                  } else {
                    addToCompare(product);
                  }
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all ${
                  isInCompare(product.id)
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                <GitCompare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isInCompare(product.id) ? "In Compare" : "Compare"}
                </span>
              </button>
              <button
                onClick={handleWishlist}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all ${
                  isWishlisted
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">
                  {isWishlisted ? "In Wishlist" : "Save"}
                </span>
              </button>
            </div>

            {(sizeOptions.length > 0 || colorOptions.length > 0) && (
              <div className="space-y-4">
                {sizeOptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-900">
                        Select Size
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/faq#size-guide"
                          className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          Size guide
                        </Link>
                        {selectedVariant && (
                          <p className="hidden text-[11px] text-gray-600 sm:block">
                            SKU {selectedVariant.sku} · {selectedVariant.color}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedVariant && <p className="text-[11px] text-gray-600 sm:hidden">SKU {selectedVariant.sku} · {selectedVariant.color}</p>}
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((option, optionIndex) => {
                        const isSelected =
                          variants.length > 0 ? option.name === selectedSize : option.id === selectedType;
                        const available =
                          variants.length === 0 ||
                          variants.some(
                            (variant) =>
                              variant.sizeLabel === option.name &&
                              variant.isActive &&
                              variant.stockQty > variant.reservedQty,
                          );
                        return (
                          <button
                            key={`${option.id}-${optionIndex}`}
                            disabled={!available}
                            onClick={() => {
                              if (variants.length > 0) {
                                setSelectedSize(option.name);
                                const colors = getVariantColorOptions(variants, option.name);
                                setSelectedColor(colors.includes(selectedColor) ? selectedColor : colors[0] || "");
                              } else {
                                setSelectedType(option.id);
                              }
                            }}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                            }`}
                          >
                            {option.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {variants.length > 0 && colorOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-900">
                      Color: {selectedColor}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          aria-label={color}
                          className={`h-9 w-9 rounded-full border-2 transition-all ${
                            color === selectedColor
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: colorToCss(color) }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 sm:grid-cols-4 sm:text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><span>Safe PayChangu</span></div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /><span>Malawi delivery</span></div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>14 day exchange</span></div>
              <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /><a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">WhatsApp help</a></div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 text-gray-600 hover:text-primary" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center font-semibold text-gray-900">{qty}</span>
                  <button onClick={() => setQty((q) => Math.max(1, Math.min(q + 1, Math.max(stock, 1))))} className="p-3 text-gray-600 hover:text-primary" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="text-xs text-gray-500">Delivery in 1-5 days in Malawi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleAdd} variant="hero" size="lg" className="w-full" disabled={!inStock}><ShoppingBag className="h-5 w-5" /> {inStock ? "Add to bag" : "Sold Out"}</Button>
                <Button onClick={handleBuyNow} size="lg" variant="outline" className="w-full" disabled={!inStock}>Buy now <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>

            <a
              href={buildWhatsAppLink(productMessage(product.name, displayPrice, `${window.location.origin}/product/${product.id}`))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1faa53] hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              Ask about size or stock on WhatsApp
            </a>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-600">{formatMWK(displayPrice)} · {inStock ? "In stock" : "Sold out"}</p>
            </div>
            <Button onClick={handleAdd} variant="hero" size="sm" className="shrink-0" disabled={!inStock}>{inStock ? "Add to bag" : "Sold out"}</Button>
          </div>
        </div>

        {/* Story / Context */}
        {product.culture_pillar && pillarCopy && (
          <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                {pillarLabel}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Style context
              </span>
            </div>
            <h2 className="mb-3 font-display text-xl font-bold text-gray-900 sm:text-2xl">
              Made for everyday expression
            </h2>
            <p className="max-w-3xl leading-relaxed text-gray-600">{pillarCopy}</p>
          </div>
        )}

        {product.culture_story && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
              The story
            </span>
            <h2 className="mb-3 mt-2 font-display text-xl font-bold text-gray-900 sm:text-2xl">
              Behind this piece
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-600">
              {product.culture_story}
            </p>
            {product.culture_context && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm italic text-gray-600">{product.culture_context}</p>
              </div>
            )}
          </div>
        )}

        {/* Specifications */}
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">Specifications</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="divide-y divide-gray-200 md:hidden">
              {specs.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">{spec.label}</span>
                  <span className="text-right text-sm font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
            <table className="hidden w-full md:table">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={spec.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-6 py-4 font-medium text-gray-600">{spec.label}</td>
                    <td className="px-6 py-4 text-gray-900">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
              <Star className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-900">No reviews yet</p>
              <p className="mt-1 text-sm text-gray-600">Be the first to share your experience.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 sm:text-5xl">
                      {avgRating.toFixed(1)}
                    </div>
                    <div className="mt-1 flex justify-center sm:mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${
                            star <= Math.round(avgRating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                      const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="w-8 text-sm text-gray-600">{stars}★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-sm text-gray-600">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          {review.customer_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.customer_name || "Customer"}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="mt-3 text-gray-600">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Write a Review */}
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">Write a Review</h2>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-900">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setUserRatingHover(star)}
                      onMouseLeave={() => setUserRatingHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (userRatingHover || userRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-900">
                  Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-md border-gray-200 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-900">
                  Review (optional)
                </label>
                <Textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="How does this piece fit into your style?"
                  className="min-h-[100px] max-w-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <Button
                onClick={submitReview}
                disabled={submitting || !userRating || !userName.trim()}
                variant="hero"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit Review
              </Button>
            </div>
          </div>
        </div>

        {/* Automatic complete-the-look recommendations */}
        {completeLook.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 text-primary">Style it with</p>
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Complete the Look
                </h2>
              </div>
              <Link to="/looks" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-600 hover:text-primary">
                All looks <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {completeLook.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
