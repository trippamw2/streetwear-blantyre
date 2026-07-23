import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  formatMWK, getKitPrice, getKitSeparateTotal,
  getKitRealSaving, getKitDiscountPercent, getKitProducts,
  type Kit,
} from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { BookOpen, Briefcase, Headphones, Luggage, Zap, ArrowRight } from "lucide-react";

/* ─── lifestyle config ─── */
const lifestyleConfig: Record<
  Kit["lifestyle"],
  { icon: typeof BookOpen; label: string; color: string }
> = {
  student: { icon: BookOpen, label: "Student", color: "from-gray-800 to-gray-900" },
  work:    { icon: Briefcase, label: "Work",    color: "from-purple-500 to-indigo-500" },
  travel:  { icon: Luggage,  label: "Travel",   color: "from-green-500 to-teal-500" },
  casual:   { icon: Headphones, label: "Casual",  color: "from-gray-700 to-gray-900" },
  premium: { icon: Zap,      label: "Premium",  color: "from-gray-900 to-black" },
};

interface KitCardProps {
  kit: Kit;
  index?: number;
  /** Compact variant for Home page featured section */
  compact?: boolean;
}

export const KitCard = ({ kit, index = 0, compact = false }: KitCardProps) => {
  const cfg = lifestyleConfig[kit.lifestyle] ?? lifestyleConfig.student;
  const Icon = cfg.icon;
  const { products } = useProducts();
  const kitProducts = getKitProducts(kit, products);
  const kitPrice = getKitPrice(kit, products);
  const separateTotal = getKitSeparateTotal(kit, products);
  const realSaving = getKitRealSaving(kit, products);
  const discount = getKitDiscountPercent(kit);
  const lowStock = kit.stock !== undefined && kit.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        to={`/kits/${kit.id}`}
        className="group relative block rounded-xl sm:rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full"
      >
        {/* â”€â”€â”€ Image â”€â”€â”€ */}
        <div className="relative bg-gray-50 border-b border-gray-100">
          {kit.badge && (
            <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[10px] sm:text-xs font-semibold">
              {kit.badge}
            </span>
          )}
          {lowStock && (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full border border-amber-300 bg-white text-amber-600 text-[10px] font-medium">
              Only {kit.stock} left
            </span>
          )}
          <div className={`w-full flex items-center justify-center p-4 sm:p-5 ${compact ? "aspect-[4/3] max-h-[240px]" : "aspect-[4/3] max-h-[320px]"}`}>
            <img
              src={kit.image}
              alt={kit.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* â”€â”€â”€ Content â”€â”€â”€ */}
        <div className="p-4 sm:p-5">
          {/* lifestyle tag */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
              <Icon className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {cfg.label}
            </span>
          </div>

          <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-tight">{kit.name}</h3>
          <p className="text-sm font-medium text-gray-900 mt-0.5">{kit.hook}</p>

          {!compact && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{kit.description}</p>
          )}

          {/* What's Inside */}
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Includes</p>
            <div className="space-y-1">
              {products.slice(0, compact ? 2 : 4).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-[11px]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover shrink-0 border border-gray-100"
                  />
                  <span className="text-gray-500 truncate">{p.name}</span>
                  {!compact && (
                    <span className="text-gray-400 line-through ml-auto shrink-0 text-[10px]">
                      {formatMWK(p.price)}
                    </span>
                  )}
                </div>
              ))}
              {products.length > (compact ? 2 : 4) && (
                <span className="text-[10px] text-gray-400 font-medium">+{products.length - (compact ? 2 : 4)} more</span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="font-bold text-lg sm:text-xl text-gray-900">{formatMWK(kitPrice)}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-400 line-through">{formatMWK(separateTotal)}</span>
                <span className="text-[11px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  Save {formatMWK(realSaving)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
              View Kit <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Discount badge */}
          <div className="mt-2">
            <span className="text-[10px] font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {discount}% cheaper than separate
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
