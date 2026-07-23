import { useState } from "react";
import { Link } from "react-router-dom";
import { Product, formatMWK } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { ShoppingBag, Plus, Heart, Star, Check, Zap, GitCompare, Music, Dumbbell, Cross, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { add } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const [selectedType, setSelectedType] = useState(product.types[0]?.id || "");
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Get sale/discount from product data (admin controlled)
  const isOnSale = product.is_on_sale || false;
  const discountPercent = product.discount_percent || 0;
  const isBestSeller = product.is_best_seller || false;
  const isFeatured = product.is_featured || false;
  const rating = product.rating || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const typeName = product.types.find(t => t.id === selectedType)?.name || product.types[0]?.name || "";
    const fullName = `${product.name} (${typeName})`;
    const finalPrice = isOnSale && discountPercent > 0 ? product.price * (1 - discountPercent / 100) : product.price;
    add({ productKey: `${product.id}-${selectedType}`, name: fullName, price: finalPrice, image: product.image });
    toast({ title: "Added to cart", description: fullName });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: product.name,
    });
  };

  const visibleTypes = product.types.slice(0, 3);
  const hiddenTypes = product.types.length > 3 ? product.types.slice(3) : [];
  const displayPrice = isOnSale && discountPercent > 0 ? product.price * (1 - discountPercent / 100) : product.price;
  const originalPrice = product.price;
  const stockQty = product.stock ?? 10;
  const isInStock = stockQty > 0;

  const badgeConfig = {
    new: { label: "NEW", bg: "bg-green-500", text: "text-white" },
    sale: { label: `-${discountPercent}%`, bg: "bg-red-500", text: "text-white" },
    best: { label: "BEST", bg: "bg-gray-900", text: "text-white" },
    hot: { label: "HOT", bg: "bg-yellow-500", text: "text-gray-900" },
  };
  
  // Determine badges based on admin flags
  const displayBadges: string[] = [];
  if (isOnSale && discountPercent > 0) displayBadges.push("sale");
  if (isBestSeller) displayBadges.push("best");
  if (isFeatured) displayBadges.push("hot");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block rounded-xl sm:rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 max-w-full"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badges */}
          {displayBadges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-0.5">
              {displayBadges.map((badge) => (
                <span key={badge} className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${badgeConfig[badge].bg} ${badgeConfig[badge].text}`}>
                  {badgeConfig[badge].label}
                </span>
              ))}
            </div>
          )}

          {/* Culture Pillar Badge */}
          {product.culture_pillar && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold text-white rounded" style={{ backgroundColor: product.culture_pillar_color || '#8B5CF6' }}>
              {product.culture_pillar.toUpperCase()}
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white hover:scale-105 transition-all duration-150"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
          
          {/* Compare */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInCompare(product.id)) {
                toast({ title: "Removed from compare" });
              } else {
                toast({ title: "Added to compare" });
              }
              addToCompare(product);
            }}
            className="absolute top-8 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white hover:scale-105 transition-all duration-150"
          >
            <GitCompare
              className={`h-3.5 w-3.5 transition-colors ${
                isInCompare(product.id) ? "fill-gray-900 text-gray-900" : "text-gray-400"
              }`}
            />
          </button>

          {/* Low stock warning - prominent */}
          {isInStock && stockQty <= 5 && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[11px] font-bold bg-red-500 text-white rounded">
              Only {stockQty} left
            </span>
          )}

          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
            <Link to={`/product/${product.id}`} className="flex items-center justify-center w-full py-2 px-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors text-xs">
              Quick View
            </Link>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-2">
          {/* Brand + stock indicator */}
          <div className="flex items-center justify-between">
            {(product as any).brand && (
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                {(product as any).brand}
              </span>
            )}
            {!isInStock && (
              <span className="text-[10px] font-semibold text-red-500">Out of stock</span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-2.5 w-2.5 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Type selector */}
          {product.types.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {visibleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedType(type.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedType === type.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.name}
                </button>
              ))}
              {hiddenTypes.length > 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500"
                >
                  <Plus className="h-3 w-3 inline" /> {hiddenTypes.length}
                </button>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <span className="font-bold text-lg sm:text-xl text-gray-900">
              {formatMWK(displayPrice)}
            </span>
            {isOnSale && discountPercent > 0 && originalPrice > displayPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatMWK(originalPrice)}
              </span>
            )}
          </div>

          <Button onClick={handleAdd} variant="hero" size="sm" className="w-full text-xs h-9" disabled={!isInStock}>
            {isInStock ? "Add to Cart" : "Sold Out"}
          </Button>
        </div>
      </Link>
    </motion.div>
  );
};