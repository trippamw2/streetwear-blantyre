import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SB_BRAND_ID } from "@/data/sbArchitecture";
import { displayCopy } from "@/lib/storefrontCopy";

export interface SbSubcategory {
  id: string;
  productTypeCode: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export function useSbSubcategories() {
  const [subcategories, setSubcategories] = useState<SbSubcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchSubcategories = async () => {
      const { data, error } = await supabase
        .from("sb_product_subcategories")
        .select("id, product_type_code, name, slug, sort_order")
        .eq("brand_id", SB_BRAND_ID)
        .eq("is_active", true)
        .order("product_type_code", { ascending: true })
        .order("sort_order", { ascending: true });

      if (!active) return;
      if (error) {
        console.error("SB subcategory fetch error:", error);
      } else {
        setSubcategories(
          (data || []).map((row) => ({
            id: row.id,
            productTypeCode: row.product_type_code,
            name: displayCopy(row.name),
            slug: row.slug,
            sortOrder: row.sort_order,
          })),
        );
      }
      setLoading(false);
    };

    void fetchSubcategories();
    return () => {
      active = false;
    };
  }, []);

  return { subcategories, loading };
}
