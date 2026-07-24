import { Link } from "react-router-dom";
import { useCompare } from "@/contexts/CompareContext";
import { formatMWK, getKitPrice } from "@/data/products";
import { SEO, defaultSEO } from "@/components/SEO";
import { useCombos } from "@/hooks/useCombos";
import { useProducts } from "@/hooks/useProducts";
import { X, ArrowLeft, Star, ShoppingBag, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { add } = useCart();
  const combos = useCombos();
  const { products } = useProducts();

  const handleAddToCart = (product: typeof compareList[0]) => {
    add({
      productKey: `${product.id}-${product.types[0]?.id || "default"}`,
      name: product.name,
      price: product.is_on_sale
        ? Math.round(product.price * (1 - product.discount_percent / 100))
        : product.price,
      image: product.image,
    });
    toast({ title: "Added to your experience", description: product.name });
  };

  if (compareList.length === 0) {
    return (
      <div className="container py-12 text-center space-y-6">
        <h1 className="font-display font-bold text-2xl mb-4">Compare Products</h1>
        <p className="text-gray-500 mb-6">Nothing to compare yet.</p>
        
        {/* Kit upsell */}
        <div className="max-w-md mx-auto bg-gradient-to-r from-gray-50 to-amber-50 rounded-2xl border border-gray-200 p-6">
          <Package className="h-10 w-10 text-gray-900 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-2">Compare Kits Instead</h3>
          <p className="text-sm text-gray-500 mb-4">Curated kits. Better value. One delivery.</p>
          <Link to="/combos">
            <Button className="bg-gray-900 hover:bg-gray-800 rounded-full">
              View Kits <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="text-sm text-gray-400 mt-4">
          <Link to="/shop" className="text-gray-900 hover:underline">Browse individual items &rarr;</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <SEO {...defaultSEO.compare} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/shop" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-display font-bold text-2xl">Compare Components</h1>
        </div>
        <Button variant="outline" onClick={clearCompare} className="text-red-500">
          Clear All
        </Button>
      </div>

      {/* Kit upsell banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Package className="h-6 w-6" />
          <div>
            <p className="font-semibold text-sm">A Kit Costs Less</p>
            <p className="text-white/70 text-xs">Kits from {formatMWK(combos[0] ? getKitPrice(combos[0], products) : 0)}. One box, better price.</p>
          </div>
        </div>
        <Link to="/combos">
          <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-full text-sm px-4 py-2 h-auto">
            See Kits <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-4">
        {compareList.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 relative">
            <button
              onClick={() => removeFromCompare(p.id)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Remove from compare"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-4 mb-4">
              <div className="h-24 w-24 rounded-lg overflow-hidden shrink-0 bg-gray-50">
                <img src={p.image} alt={p.name} className="h-full w-full object-contain p-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2 mb-1">{p.name}</p>
                {p.is_on_sale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">{formatMWK(Math.round(p.price * (1 - p.discount_percent / 100)))}</span>
                    <span className="text-gray-400 line-through text-xs">{formatMWK(p.price)}</span>
                  </div>
                ) : (
                  <p className="font-bold">{formatMWK(p.price)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Brand</p>
                <p className="font-medium">{p.brand || "Generic"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{p.rating || "N/A"}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Stock</p>
                <span className={p.stock && p.stock > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {p.stock && p.stock > 0 ? `${p.stock} available` : "Out of stock"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Benefit</p>
                <p className="font-medium text-xs line-clamp-2">{p.benefit}</p>
              </div>
            </div>

            <Button
              onClick={() => handleAddToCart(p)}
              disabled={!p.stock || p.stock <= 0}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Wear the Culture
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-gray-50 w-32"></th>
              {compareList.map((p) => (
                <th key={p.id} className="p-3 bg-gray-50 relative">
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-32 h-32 object-contain mx-auto mb-2"
                  />
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                </th>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <th key={`empty-${i}`} className="p-3 bg-gray-50 border-dashed border-2 border-gray-200">
                  <Link to="/shop" className="text-gray-900 text-sm hover:underline">
                    + Add Product
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3 font-medium text-gray-500">Price</td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  {p.is_on_sale ? (
                    <>
                      <span className="text-red-500 font-bold">
                        {formatMWK(Math.round(p.price * (1 - p.discount_percent / 100)))}
                      </span>
                      <span className="text-gray-400 line-through ml-2 text-sm">
                        {formatMWK(p.price)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold">{formatMWK(p.price)}</span>
                  )}
                </td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3 font-medium text-gray-500">Brand</td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-center">{p.brand || "Generic"}</td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3 font-medium text-gray-500">Rating</td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{p.rating || "N/A"}</span>
                  </div>
                </td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3 font-medium text-gray-500">Stock</td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  <span className={p.stock && p.stock > 0 ? "text-green-600" : "text-red-500"}>
                    {p.stock && p.stock > 0 ? `${p.stock} available` : "Out of stock"}
                  </span>
                </td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3 font-medium text-gray-500">Benefit</td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-sm text-gray-600">
                  {p.benefit}
                </td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3"></td>
              {compareList.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(p)}
                    disabled={!p.stock || p.stock <= 0}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Wear the Culture
                  </Button>
                </td>
              ))}
              {[...Array(4 - compareList.length)].map((_, i) => (
                <td key={`empty-${i}`} className="p-3"></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Compare;