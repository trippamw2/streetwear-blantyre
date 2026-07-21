import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatMWK, getItemImage, Kit, getKitPrice, getKitRealSaving, getKitProducts } from "@/data/products";
import { SEO } from "@/components/SEO";
import { ProductDetailSkeleton } from "@/components/Skeletons";
import { useCombos } from "@/hooks/useCombos";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { useCompare } from "@/contexts/CompareContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, Truck, ShieldCheck, Star, Heart, Share2, ChevronDown, ChevronUp, Loader2, MessageCircle, Facebook, Instagram, Link2, Zap, GitCompare, Eye, ArrowRight, Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading, getProduct } = useProducts();
  const product = getProduct(id || "");
  const { add } = useCart();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const [qty, setQty] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sb_wishlist");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [reviews, setReviews] = useState<{rating: number; review_text: string; customer_name: string; created_at: string}[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const combos = useCombos();
  const [userRating, setUserRating] = useState(0);
  const [userRatingHover, setUserRatingHover] = useState(0);
  const [userName, setUserName] = useState("");
  const [userReview, setUserReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ====== ALL HOOKS DEFINED BEFORE EARLY RETURNS ======
  
  // Derived values
  const isWishlisted = wishlistItems.includes(id);
  const galleryImages = product?.gallery_images?.length > 0 
    ? [product?.image, ...product.gallery_images]
    : [product?.image];
  const selectedImageSrc = galleryImages?.[selectedImage] || product?.image || "";

  // useCallback MUST be before returns
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
    } catch (err) {
      console.log("No reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  // useEffect for types
  useEffect(() => {
    if (product?.types?.length > 0) {
      setSelectedType(product.types[0].id);
    }
  }, [product]);

  // useEffect for fetchReviews MUST be before returns
  useEffect(() => {
    fetchReviews();
  }, [id]);

  // ====== EARLY RETURNS AFTER ALL HOOKS ======
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Product not found</p>
          <Link to="/shop" className="text-blue-500 hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  console.log("Rendering ProductDetail, id:", id, "loading:", loading, "product:", product?.name);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const reviewCount = reviews.length;

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
      const { data, error } = await supabase.from("product_reviews").insert({
        product_id: id,
        rating: userRating,
        customer_name: userName.trim(),
        review_text: userReview.trim() || null,
        is_active: true,
      }).select();
      
      if (error) {
        console.error("Review insert error:", error.code, error.message, error.details);
        toast({ title: "Error", description: error.message || "Could not submit review", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      
      console.log("Review submitted:", data);
      toast({ title: "Review submitted!", description: "Thank you for your feedback" });
      setUserRating(0);
      setUserName("");
      setUserReview("");
      fetchReviews();
    } catch (err: any) {
      console.error("Review submit error:", err?.message || err);
      toast({ title: "Error", description: err?.message || "Could not submit review", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h1 className="font-display font-bold text-3xl">Not found</h1>
        <Button asChild variant="hero"><Link to="/shop">Back to shop</Link></Button>
      </div>
    );
  }

  const recommended = products.filter(p => p.category?.toLowerCase() === product.category?.toLowerCase() && p.id !== product.id).slice(0, 4);
  
  const handleAdd = () => {
    const typeName = product.types.find(t => t.id === selectedType)?.name || product.types[0]?.name || "";
    const fullName = `${product.name} (${typeName})`;
    add({ productKey: `${product.id}-${selectedType}`, name: fullName, price: product.price, image: product.image }, qty);
    toast({ title: "Added to cart", description: `${qty} Ã— ${fullName}` });
  };

  const handleWishlist = () => {
    const newWishlist = isWishlisted
      ? wishlistItems.filter(id => id !== product.id)
      : [...wishlistItems, product.id];
    setWishlistItems(newWishlist);
    localStorage.setItem("sb_wishlist", JSON.stringify(newWishlist));
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: product.name,
    });
  };

  const handleShare = (platform: string) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `Check out ${product.name} - ${formatMWK(product.price)}`;
    
    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    } else if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
      setShowShareModal(false);
      return;
    }
    
    if (url) window.open(url, "_blank", "width=600,height=400");
    setShowShareModal(false);
  };

  const specs = [
    { label: "Brand", value: product.brand || "Generic" },
    { label: "Category", value: product.category },
    { label: "Warranty", value: "6 Months" },
    { label: "SKU", value: product.id.toUpperCase() },
    ...(product.specs ? Object.entries(product.specs).map(([key, value]) => ({ label: key, value })) : []),
  ];

  const faqs = [
    { q: "Is this genuine?", a: "Yes. 100% real products from trusted sellers." },
    { q: "What if it breaks?", a: "6-month warranty. We replace it if it stops working." },
    { q: "Delivery time?", a: "Blantyre: 1-3 days. Other areas: 3-5 days." },
  ];

  return (
    <div className="container py-10 sm:py-14 pb-24 sm:pb-14">
      <SEO title={product?.name || "Product"} description={product?.benefit || "Phone accessory"} type="product" path={"/product/" + product?.id} image={product?.image} />
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            className="relative rounded-2xl overflow-hidden bg-gray-100 border border-border/60 w-full"
            style={{ aspectRatio: "1/1", maxHeight: "min(400px, 60vw)" }}
          >
            <img 
              src={selectedImageSrc} 
              alt={product.name} 
              className="w-full h-full object-contain"
            />
            {/* Quick Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleWishlist}
                className="p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </motion.div>

          {/* Share Modal */}
          <AnimatePresence>
            {showShareModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                onClick={() => setShowShareModal(false)}
              >
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-bold text-xl mb-4">Share Product</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <button onClick={() => handleShare("whatsapp")} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors">
                      <MessageCircle className="h-8 w-8 text-green-500" />
                      <span className="text-xs font-medium">WhatsApp</span>
                    </button>
                    <button onClick={() => handleShare("facebook")} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Facebook className="h-8 w-8 text-blue-600" />
                      <span className="text-xs font-medium">Facebook</span>
                    </button>
                    <button onClick={() => handleShare("twitter")} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black text-white hover:bg-gray-800 transition-colors">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span className="text-xs font-medium">X</span>
                    </button>
                    <button onClick={() => handleShare("copy")} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Link2 className="h-8 w-8 text-gray-600" />
                      <span className="text-xs font-medium">Copy</span>
                    </button>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="w-full mt-4 py-3 text-gray-500 font-medium">Cancel</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thumbnails - Use gallery_images if available, else fallback to main image */}
          <div className="flex gap-3">
            {(product.gallery_images && product.gallery_images.length > 0 
              ? [product.image, ...product.gallery_images]
              : [product.image, product.image, product.image]
            ).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === i ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            {product.brand && (
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                {product.brand}
              </span>
            )}
            <p className="text-sm font-semibold text-gradient uppercase tracking-widest">{product.category}</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight">{product.name}</h1>
<p className="text-muted-foreground text-lg">{product.benefit}</p>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
                <span className="ml-1 text-sm text-gray-600">
                  {reviewCount > 0 ? `(${reviewCount} reviews)` : "(No reviews yet)"}
                </span>
              </div>
              <span className={`flex items-center gap-1 text-sm ${(product.stock ?? 10) > 0 ? "text-green-600" : "text-red-600"}`}>
                <Check className="h-4 w-4" /> {(product.stock ?? 10) > 0 ? ((product.stock ?? 10) <= 5 ? `Only ${product.stock ?? 10} left` : "In Stock") : "Out of Stock"}
              </span>
            </div>
          </div>

          <p className="font-display font-bold text-3xl sm:text-4xl text-gradient">{formatMWK(product.price)}</p>

          {/* Reward Points */}
          {(product.reward_points ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">Earn {product.reward_points} points with this purchase</span>
            </div>
          )}

          {/* Kit Upsell: find kits containing this product */}
          {(() => {
            const matchingKits = combos.filter(k =>
              k.productIds.some(pid => pid === product.id)
            ).slice(0, 2);
            
            if (matchingKits.length === 0) return null;
            
            return (
              <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl border border-blue-200 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <p className="font-semibold text-blue-800 text-sm">Also in these Kits</p>
                </div>
                <div className="grid gap-2">
                  {matchingKits.map(kit => (
                    <Link
                      key={kit.id}
                      to="/combos"
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {kit.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{kit.name}</p>
                          <p className="text-xs text-gray-500">Save {formatMWK(getKitRealSaving(kit))} â€¢ {kit.productIds.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-blue-600">{formatMWK(getKitPrice(kit))}</span>
                        <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Better value. One delivery. Everything you need.
                </p>
              </div>
            );
          })()}

          {/* Compare & Wishlist */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isInCompare(product.id)) {
                  removeFromCompare(product.id);
                } else {
                  addToCompare(product);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                isInCompare(product.id)
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "border-border text-gray-500 hover:border-gray-300"
              }`}
            >
              <GitCompare className="h-4 w-4" />
              <span className="text-sm">{isInCompare(product.id) ? "Added to Compare" : "Compare"}</span>
            </button>
            <button
              onClick={handleWishlist}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                isWishlisted
                  ? "bg-red-50 border-red-500 text-red-500"
                  : "border-border text-gray-500 hover:border-gray-300"
              }`}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              <span className="text-sm">{isWishlisted ? "In Wishlist" : "Save"}</span>
            </button>
          </div>

          {product.types.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Type:</p>
              <div className="flex gap-2 flex-wrap">
                {product.types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      selectedType === type.id
                        ? "bg-gradient-brand text-white border-transparent"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-5 w-5 text-green-500" />
              <span>Fast checkout</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-5 w-5 text-green-500" />
              <span>Delivery across Malawi</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>6-month warranty</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-5 w-5 text-green-500" />
              <span>100% genuine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border bg-card">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-primary" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-primary" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <Button onClick={handleAdd} variant="hero" size="lg" className="flex-1">
              <ShoppingBag className="h-5 w-5" /> Add to cart
            </Button>
            <Button 
              onClick={() => {
                const typeName = product.types.find(t => t.id === selectedType)?.name || product.types[0]?.name || "";
                const fullName = `${product.name} (${typeName})`;
                add({ productKey: `${product.id}-${selectedType}`, name: fullName, price: product.price, image: product.image }, qty);
                navigate("/checkout");
              }} 
              size="lg" 
              className="flex-1 bg-gray-900 hover:bg-gray-800"
            >
              <Zap className="h-5 w-5" /> Buy Now
            </Button>
          </div>

          {/* Mobile Sticky CTA */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-2 py-2 sm:px-4 flex items-center gap-2 sm:gap-3 z-50 sm:hidden max-w-full">
            <div className="flex items-center rounded-full border border-border bg-card shrink-0">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1.5 sm:p-2" aria-label="Decrease"><Minus className="h-3.5 sm:h-4 w-3.5 sm:w-4" /></button>
              <span className="w-6 sm:w-8 text-center font-semibold text-xs sm:text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-1.5 sm:p-2" aria-label="Increase"><Plus className="h-3.5 sm:h-4 w-3.5 sm:w-4" /></button>
            </div>
            <Button onClick={handleAdd} variant="hero" className="flex-1 py-2 text-xs sm:text-sm whitespace-nowrap">
              <ShoppingBag className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-16">
        <h2 className="font-display font-bold text-2xl mb-6">Specifications</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <tbody>
              {specs.map((spec, i) => (
                <tr key={spec.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-6 py-4 font-medium text-gray-600">{spec.label}</td>
                  <td className="px-6 py-4">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="font-display font-bold text-2xl mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="font-display font-bold text-2xl mb-6">Customer Reviews</h2>
        
        {reviewsLoading ? (
          <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 p-8 text-center">
            <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to review!</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
                  <div className="flex mt-1 sm:mt-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-3 w-3 sm:h-4 sm:w-4 ${star <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                    const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-8">{stars}â˜…</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm text-gray-400 w-8">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {review.customer_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{review.customer_name || "Customer"}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {review.review_text && <p className="mt-3 text-gray-600">{review.review_text}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Write a Review */}
      <div className="mt-16">
        <h2 className="font-display font-bold text-2xl mb-6">Write a Review</h2>
        <div className="rounded-2xl border border-gray-100 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setUserRatingHover(star)}
                    onMouseLeave={() => setUserRatingHover(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star className={`h-8 w-8 ${star <= (userRatingHover || userRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="max-w-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Review (optional)</label>
              <Textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="How was this product?"
                className="max-w-lg min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={submitReview} 
              disabled={submitting || !userRating || !userName.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display font-bold text-2xl mb-6">Recommended For You</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommended.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
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