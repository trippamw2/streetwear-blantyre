import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SB_BRAND_ID } from "@/data/sbArchitecture";

export interface StorefrontTestimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  image: string;
}

export function useTestimonials(limit = 6) {
  const [testimonials, setTestimonials] = useState<StorefrontTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, role, message, rating, image, is_active, sort_order, brand_id")
          .eq("is_active", true)
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true })
          .limit(limit);
        if (error) throw error;
        if (!cancelled) {
          setTestimonials(
            (data || []).map((t) => ({
              id: t.id,
              name: t.name || "SB Customer",
              role: t.role || "Customer",
              message: t.message || "",
              rating: Number(t.rating || 5),
              image: t.image || "",
            })).filter((t) => t.message.trim().length > 0),
          );
        }
      } catch {
        if (!cancelled) setTestimonials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return { testimonials, loading };
}
