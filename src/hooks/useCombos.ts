import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Kit, kits as fallbackKits } from "@/data/products";

interface SupabaseCombo {
  id: string;
  name: string;
  hook: string;
  lifestyle: string;
  tagline: string;
  description: string;
  discount_percent: number;
  vibe: string;
  badge: string;
  stock: number;
  image: string;
  combo_items: { product_id: string }[];
}

export function useCombos(): Kit[] {
  const [combos, setCombos] = useState<Kit[]>(fallbackKits);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const { data, error } = await supabase
          .from("combos")
          .select("*, combo_items(product_id)")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) {
          console.warn("useCombos fetch error, using fallback:", error.message);
          return;
        }

        if (!data || data.length === 0) {
          return;
        }

        const mapped: Kit[] = (data as SupabaseCombo[]).map((c) => ({
          id: c.id,
          name: c.name,
          hook: c.hook || "",
          lifestyle: (["student", "work", "travel", "audio", "premium"].includes(c.lifestyle)
            ? c.lifestyle
            : "student") as Kit["lifestyle"],
          tagline: c.tagline || "",
          description: c.description || "",
          discountPercent: c.discount_percent || 15,
          productIds: (c.combo_items || [])
            .map((i) => i.product_id)
            .filter(Boolean),
          image: c.image || "",
          vibe: c.vibe || "",
          badge: c.badge || "",
          stock: c.stock ?? 0,
        }));

        setCombos(mapped);
      } catch (err) {
        console.warn("useCombos error, using fallback:", err);
      }
    };

    fetchCombos();
  }, []);

  return combos;
}
