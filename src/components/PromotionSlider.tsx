import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SliderData {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  link_text?: string;
  background_color?: string;
  text_color?: string;
  pages?: string[];
}

interface PromotionSliderProps {
  page: "home" | "shop" | "combos";
  className?: string;
}

export const PromotionSlider = ({ page, className }: PromotionSliderProps) => {
  const [promotions, setPromotions] = useState<SliderData[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("id,title,subtitle,image,link,link_text,background_color,text_color,pages")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(10);

        if (!error && data) {
          const filtered = data.filter(p => p.pages && p.pages.includes(page));
          setPromotions(filtered);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    };

    fetchPromotions();
  }, [page]);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (loading) return null;
  if (promotions.length === 0) return null;

  const promo = promotions[current];
  const bgColor = promo.background_color || "from-orange-500 to-orange-600";
  const textColor = promo.text_color || "text-white";

  return (
    <div className={cn("relative rounded-xl overflow-hidden w-full h-24 sm:h-32 md:h-40 lg:h-48", className)}>
      <Link to={promo.link || "/shop"} className="block relative w-full h-full">
        {promo.image ? (
          <div className="absolute inset-0">
            <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-r", bgColor)} />
        )}
        <div className="absolute inset-0 flex items-center px-4 sm:px-8">
          <div className="max-w-xs sm:max-w-lg">
            <p className={cn("text-xs sm:text-sm font-medium opacity-90", textColor)}>{promo.subtitle}</p>
            <h2 className={cn("font-display font-bold text-sm sm:text-xl md:text-2xl mt-0.5", textColor)}>{promo.title}</h2>
            <span className={cn("inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium mt-1", textColor, "bg-white/20")}>
              {promo.link_text || "Shop Now"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};