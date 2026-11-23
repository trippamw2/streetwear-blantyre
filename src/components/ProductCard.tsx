import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Product, formatMWK, getBrandName, getCategoryLabel } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { useWishlist } from "@/hooks/useWishlist";
import { Heart, Star, GitCompare, Plus, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { add } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { isWishlisted, toggle } = useWishlist(product.id);
  const [selectedType, setSelectedType] = useState(product.types?.[0]?.id || "");
  const [justAdded, setJustAdded] = useState(false);

  // Keep the selected size valid when product variants load or change.
  useEffect(() => {
    if (!product.types?.length) {
      setSelectedType("");
      return;
    }
    if (!product.types.some((type) => type.id === selectedType)) {
      setSelectedType(product.types[0].id);
    }
  }, [product.types, selectedType]);

  const isOnSale = product.is_on_sale || false;
  const discountPercent = product.discount_percent || 0;
  const isBestSeller = product.is_best_seller || false;
  const isNew = product.is_new_arrival || false;
  const isFeatured = product.is_featured || false;
  const rating = product.rating || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const typeName = product.types.find((t) => t.id === selectedType)?.name || product.types[0]?.name || "";
    const fullName = typeName ? `${product.name} (${typeName})` : product.name;
    const finalPrice = isOnSale && discountPercent > 0 ? product.price * (1 - discountPercent / 100) : product.price;
    add({ productKey: `${product.id}-${selectedType}`, productId: product.id, name: fullName, price: finalPrice, image: product.image });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
    toast({ title: "Added to bag", description: fullName });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = toggle(product.id);
    toast({
      title: saved ? "Saved to wishlist" : "Removed from wishlist",
      description: product.name,
    });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
    toast({
      title: isInCompare(product.id) ? "Already in compare" : "Added to compare",
      description: product.name,
    });
  };

  const visibleTypes = (product.types || []).slice(0, 3);
  const hiddenTypes = (product.types || []).length > 3 ? (product.types || []).length - 3 : 0;
  const displayPrice = isOnSale && discountPercent > 0 ? product.price * (1 - discountPercent / 100) : product.price;
  const stockQty = product.stock ?? 0;
  const isInStock = stockQty > 0;

  const badges: { key: string; label: string; className: string }[] = [];
  if (isOnSale && discountPercent > 0) {
    badges.push({ key: "sale", label: `${discountPercent}% off`, className: "bg-red-600 text-white" });
  }
  if (isNew) {
    badges.push({ key: "new", label: "NEW", className: "bg-primary text-white" });
  }
  if (isBestSeller) {
    badges.push({ key: "best", label: "BEST SELLER", className: "bg-gray-900 text-white" });
  } else if (isFeatured && !isNew) {
    badges.push({ key: "hot", label: "FEATURED", className: "bg-amber-400 text-gray-900" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="h-full"
    >
      <Link
        to={`/product/${product.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-gray-900/5"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 px-4 text-center">
              <span className="font-display text-2xl font-extrabold uppercase tracking-[0.24em] text-primary/25">
                WARDROBE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                {getCategoryLabel(product.category)}
              </span>
            </div>
          )}

          {badges.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-col gap-1">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleCompare}
              aria-label="Add to compare"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <GitCompare
                className={`h-4 w-4 transition-colors ${
                  isInCompare(product.id) ? "text-primary" : "text-gray-600"
                }`}
              />
            </button>
          </div>

          {isInStock && stockQty <= 5 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm">
              Only {stockQty} left
            </span>
          )}

          {!isInStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
              <span className="rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
                Sold out
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center justify-center gap-1.5 rounded-full bg-white/95 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-900">
              View piece <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              {getBrandName(product.brand)}
            </span>
            {rating > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-gray-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-[15px]">
            {product.name}
          </h3>

          {visibleTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedType(type.id);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    selectedType === type.id
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {type.name}
                </button>
              ))}
              {hiddenTypes > 0 && (
                <span className="flex items-center gap-0.5 rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                  <Plus className="h-3 w-3" /> {hiddenTypes}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-end gap-2 pt-1">
            <span className="text-base font-bold text-gray-900 sm:text-lg">{formatMWK(displayPrice)}</span>
            {isOnSale && discountPercent > 0 && (
              <span className="pb-0.5 text-[11px] text-gray-500 line-through">{formatMWK(product.price)}</span>
            )}
          </div>

          <Button
            onClick={handleAdd}
            variant="hero"
            size="sm"
            className="h-9 w-full"
            disabled={!isInStock}
          >
            {justAdded ? "Added to bag" : isInStock ? "Add to bag" : "Sold Out"}
          </Button>
        </div>
      </Link>
    </motion.div>
  );
};
