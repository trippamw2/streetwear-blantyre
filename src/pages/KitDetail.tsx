import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KitCard } from "@/components/KitCard";
import { SEO } from "@/components/SEO";
import {
  formatMWK, getKitPrice, getKitProducts,
  getKitSeparateTotal, getKitRealSaving, getKitDiscountPercent,
} from "@/data/products";
import { useCombos } from "@/hooks/useCombos";
import { useCart } from "@/contexts/CartContext";
import {
  ArrowLeft, ShoppingBag, MessageCircle, Check,
  Truck, ShieldCheck, BadgePercent, Star,
} from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const KitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const combos = useCombos();
  const kit = combos.find((k) => k.id === id);
  const [adding, setAdding] = useState(false);

  if (!kit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Kit not found</p>
          <Link to="/combos" className="text-orange-500 hover:underline">
            Back to Kits
          </Link>
        </div>
      </div>
    );
  }

  const kitProducts = getKitProducts(kit);
  const kitPrice = getKitPrice(kit);
  const separateTotal = getKitSeparateTotal(kit);
  const realSaving = getKitRealSaving(kit);
  const discountPercent = getKitDiscountPercent(kit);
  const otherKits = combos.filter((k) => k.id !== kit.id).slice(0, 3);
  const lowStock = kit.stock !== undefined && kit.stock <= 5;

  const handleAdd = () => {
    setAdding(true);
    add(
      { productKey: kit.id, name: kit.name, price: kitPrice, image: kit.image },
      1,
    );
    setTimeout(() => setAdding(false), 1200);
  };

  return (
    <div>
      <SEO title={kit?.name || "Fashion Bundle"} description={kit?.description || "Curated fashion bundle for your style"} path={"/kits/" + kit?.id} />
      {/* ─── BACK LINK ─── */}
      <div className="container pt-4 sm:pt-6">
        <button
          onClick={() => navigate("/combos")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Kits
        </button>
      </div>

      {/* ─── KIT HERO ─── */}
      <section className="container py-6 sm:py-10">
        <div className="grid lg:grid-cols-5 gap-8 sm:gap-12">
          {/* Left - Kit Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-4 sm:space-y-5"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {kit.badge && (
                <span className="inline-flex px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold">
                  {kit.badge}
                </span>
              )}
              {lowStock && (
                <span className="inline-flex px-3 py-1 rounded-full border border-orange-300 bg-white text-orange-600 text-xs font-medium">
                  Only {kit.stock} left
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <Check className="h-3 w-3" /> {discountPercent}% cheaper
              </span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              {kit.name}
            </h1>
            <p className="text-lg sm:text-xl text-orange-600 font-medium">{kit.hook}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{kit.description}</p>

            {/* ─── Price Block ─── */}
            <div className="bg-gray-50 rounded-xl p-5 sm:p-6 space-y-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-3xl sm:text-4xl text-gray-900">
                    {formatMWK(kitPrice)}
                  </span>
                  <span className="text-sm line-through text-gray-400">
                    {formatMWK(separateTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <BadgePercent className="h-3 w-3" /> Save {formatMWK(realSaving)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                    <Truck className="h-3 w-3" /> Free delivery over MK 50k
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAdd}
                  variant="hero"
                  size="lg"
                  className="text-sm flex-1 shadow-lg shadow-orange-500/20"
                  disabled={adding}
                >
                  {adding ? (
                    "Added!"
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                    </>
                  )}
                </Button>
                <a
                  href={buildWhatsAppLink(
                    `I want to order the ${kit.name}. Total: ${formatMWK(kitPrice)}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm w-full border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Order on WhatsApp
                  </Button>
                </a>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-1">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-500 shrink-0" /> Free delivery over MK 50,000
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-orange-500 shrink-0" /> 30-day guarantee
                </div>
              </div>
            </div>

            {/* ─── Why This Kit ─── */}
            <div className="rounded-xl border border-gray-100 p-4 sm:p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm">Why this kit?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <BadgePercent className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Pay {discountPercent}% less than buying separate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Every component tested and matched for your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>2,500+ happy customers across Malawi</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* ─── Right - What's Inside ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="font-display font-bold text-xl sm:text-2xl mb-6">
                What's Inside
              </h2>
              <div className="space-y-4">
                {kitProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-row-reverse sm:flex-row-reverse items-stretch gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div className="shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 rounded-2xl object-cover border border-gray-200"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-bold text-base sm:text-lg lg:text-xl text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                        {product.benefit}
                      </p>
                      <p className="font-bold text-xl sm:text-2xl text-gray-900 mt-3">
                        {formatMWK(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Price Breakdown ─── */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Separate total</span>
                  <span>{formatMWK(separateTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Kit savings</span>
                  <span>-{formatMWK(realSaving)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span>Kit price</span>
                  <span className="text-orange-600">{formatMWK(kitPrice)}</span>
                </div>
              </div>

              {/* Saving callout */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center">
                <p className="text-sm font-semibold text-green-700">
                  You save {formatMWK(realSaving)} ({discountPercent}% off) with this kit
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Free delivery over MK 50,000 &middot; 30-day guarantee
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── OTHER KITS ─── */}
      {otherKits.length > 0 && (
        <section className="bg-gray-50/50 py-10 sm:py-14">
          <div className="container">
            <h2 className="font-display font-bold text-xl sm:text-2xl mb-6">
              Other Kits You Might Like
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {otherKits.map((other, i) => (
                <KitCard key={other.id} kit={other} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default KitDetail;
