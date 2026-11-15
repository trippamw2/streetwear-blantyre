import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories as coreCategories } from "@/data/products";

export interface WearableCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

const FALLBACK_CATEGORIES: WearableCategory[] = coreCategories
  .filter((c) => c.id !== "all")
  .map((c, index) => ({
    id: c.id,
    name: c.label,
    slug: c.id,
    description: null,
    icon: null,
    sort_order: index,
    is_active: true,
  }));

export function useWearableCategories() {
  const [categories, setCategories] = useState<WearableCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("wearable_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Wearable categories fetch error:", error);
        return;
      }
      if (data && data.length > 0) {
        setCategories(data as WearableCategory[]);
      }
    } catch (err) {
      console.error("Wearable categories fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, refresh: fetchCategories };
}