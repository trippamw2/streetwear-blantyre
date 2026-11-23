import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, culturePillars } from "@/data/products";
import { SB_BRAND_ID } from "@/data/sbArchitecture";
import { displayCopy, displayCopyList } from "@/lib/storefrontCopy";

interface InventoryRecord {
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  cost_price_mwk: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active products from database
      const { data: productsArray, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .or("is_active.eq.true,is_active.is.null");

      if (fetchError) {
        console.error("Products fetch error:", fetchError);
        setError("Failed to load products");
        setProducts([]);
        setLoading(false);
        return;
      }

      if (!productsArray || productsArray.length === 0) {
        console.warn("No products found in database");
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = productsArray.map((product) => product.id);

      // Fetch inventory for stock levels
      const { data: inventory } = await supabase
        .from("inventory")
        .select("product_id, quantity, reserved_quantity")
        .in("product_id", productIds);

      // Fetch product variants (sizes). Legacy product_types remain as a
      // fallback until every product has a proper sb_product_variants row.
      const { data: productTypes } = await supabase
        .from("product_types")
        .select("id, product_id, name, sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true });

      const { data: structuredVariants } = await supabase
        .from("sb_product_variants")
        .select("id, product_id, size_label, price_mwk, stock_qty, reserved_qty, availability")
        .eq("brand_id", SB_BRAND_ID)
        .eq("is_active", true)
        .order("size_label", { ascending: true });

      const { data: tagRows } = await supabase
        .from("sb_product_tags")
        .select("product_id, tag, sort_order")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true });

      // Build inventory map
      const inventoryMap = new Map<string, InventoryRecord>();
      inventory?.forEach((inv) => {
        inventoryMap.set(inv.product_id, inv as InventoryRecord);
      });

      const tagMap = new Map<string, string[]>();
      tagRows?.forEach((row) => {
        const tags = tagMap.get(row.product_id) || [];
        tags.push(row.tag);
        tagMap.set(row.product_id, tags);
      });

      // Build variants map from structured variants, falling back to legacy labels.
      const typesMap = new Map<string, { id: string; name: string }[]>();
      const variantStockMap = new Map<string, number>();
      structuredVariants?.forEach((variant) => {
        if (!variant?.product_id) return;
        const list = typesMap.get(variant.product_id) || [];
        if (!list.some((item) => item.name === variant.size_label)) {
          list.push({ id: variant.id, name: variant.size_label });
          typesMap.set(variant.product_id, list);
        }
        if (variant.availability !== "disabled") {
          variantStockMap.set(
            variant.product_id,
            (variantStockMap.get(variant.product_id) || 0) +
              Math.max(0, (variant.stock_qty || 0) - (variant.reserved_qty || 0)),
          );
        }
      });
      productTypes?.forEach((t: any) => {
        if (!t?.product_id || !t?.name || typesMap.has(t.product_id)) return;
        typesMap.set(t.product_id, [{ id: t.id, name: t.name }]);
      });

      // Map database products to frontend format
      const mappedProducts: Product[] = productsArray.map((p: any) => {
        const inventoryRecord = inventoryMap.get(p.id);
        const availableStock = variantStockMap.has(p.id)
          ? variantStockMap.get(p.id)!
          : inventoryRecord
            ? Math.max(0, (inventoryRecord.quantity || 0) - (inventoryRecord.reserved_quantity || 0))
            : Math.max(0, p.stock_quantity || 0);
        const isFeatured = p.featured ?? p.is_featured ?? false;
        const isBestSeller = p.bestseller ?? p.is_best_seller ?? false;
        const isNewArrival = p.new_arrival ?? p.is_new_arrival ?? false;

        return {
          id: p.id,
          name: displayCopy(p.name),
          slug: p.slug || undefined,
          sku: p.sku || undefined,
          benefit: displayCopy(p.description || p.benefit || ""),
          description: displayCopy(p.description || p.benefit || ""),
          price: p.price,
          compare_at_price: p.compare_at_price ?? null,
          cost_price: p.cost_price ?? null,
          category: (p.category || "all") as any,
          subcategory: displayCopy(p.subcategory) || undefined,
          collection_name: displayCopy(p.collection_name) || undefined,
          product_type_code: p.product_type_code || undefined,
          fit: displayCopy(p.fit) || undefined,
          material: displayCopy(p.material) || undefined,
          gender_classification: p.gender_classification || "unisex",
          status: p.status || "active",
          featured: isFeatured,
          bestseller: isBestSeller,
          new_arrival: isNewArrival,
          limited_drop: p.limited_drop || false,
          release_date: p.release_date || null,
          care_instructions: displayCopy(p.care_instructions) || undefined,
          model_fit_note: displayCopy(p.model_fit_note) || undefined,
          tags: displayCopyList(tagMap.get(p.id) || []),
          image: p.image || "",
          brand: displayCopy(p.brand) || "Streetwear Blantyre",
          types: typesMap.get(p.id) || [],
          stock: availableStock,
          is_featured: isFeatured,
          is_best_seller: isBestSeller,
          is_new_arrival: isNewArrival,
          is_on_sale: p.is_on_sale || false,
          discount_percent: p.discount_percent || 0,
          gallery_images: p.gallery_images || [],
          specs: Object.fromEntries(
            Object.entries((p.specs || {}) as Record<string, unknown>).map(([key, value]) => [
              displayCopy(key),
              displayCopy(typeof value === "string" ? value : String(value ?? "")),
            ]),
          ),
          reward_points: p.reward_points || Math.round(p.price / 100),
          rating: p.rating || 0,
          culture_pillar: p.culture_pillar || "",
          culture_pillar_color: culturePillars.find((cp) => cp.id === p.culture_pillar)?.color || "#102C54",
          culture_story: displayCopy(p.culture_story) || "",
          culture_context: displayCopy(p.culture_context) || "",
        };
      });

      setProducts(mappedProducts);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get single product by ID or SEO slug
  const getProduct = useCallback(
    (idOrSlug: string) => {
      return (
        products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ||
        products.find((p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === idOrSlug)
      );
    },
    [products],
  );

  // Get single product by slug or id
  const getProductBySlug = useCallback(
    (slugOrId: string) =>
      products.find((p) => p.slug === slugOrId || p.id === slugOrId) ||
      products.find((p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slugOrId),
    [products],
  );

  // Get products by category
  const getProductsByCategory = useCallback((category: string) => {
    if (category === "all") return products;
    return products.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }, [products]);

  // Get products by culture pillar
  const getProductsByCulture = useCallback((culture: string) => {
    if (culture === "all") return products;
    return products.filter((p) => p.culture_pillar === culture);
  }, [products]);

  // Check and reserve stock (for checkout)
  const checkAndReserveStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      // Get current inventory
      const { data: inventory, error } = await supabase
        .from("inventory")
        .select("quantity, reserved_quantity")
        .eq("product_id", productId)
        .single();

      if (error || !inventory) {
        return false; // No inventory record
      }

      const available = inventory.quantity - inventory.reserved_quantity;
      return available >= quantity;
    } catch {
      return false;
    }
  }, []);

  // Reserve stock (call after order confirmed)
  const reserveStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const { data: inventory, error } = await supabase
        .from("inventory")
        .select("reserved_quantity")
        .eq("product_id", productId)
        .single();

      if (error || !inventory) {
        return false;
      }

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          reserved_quantity: (inventory.reserved_quantity || 0) + quantity,
        })
        .eq("product_id", productId);

      if (updateError) {
        console.error("Reserve stock error:", updateError);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // Release reserved stock (call if order cancelled)
  const releaseStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const { data: inventory, error } = await supabase
        .from("inventory")
        .select("reserved_quantity")
        .eq("product_id", productId)
        .single();

      if (error || !inventory) {
        return false;
      }

      const newReserved = Math.max(0, (inventory.reserved_quantity || 0) - quantity);

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          reserved_quantity: newReserved,
        })
        .eq("product_id", productId);

      if (updateError) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // Deduct from actual quantity (call when payment confirmed)
  const confirmStockDeduction = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const { data: inventory, error } = await supabase
        .from("inventory")
        .select("quantity, reserved_quantity")
        .eq("product_id", productId)
        .single();

      if (error || !inventory) {
        return false;
      }

      const newQuantity = inventory.quantity - quantity;
      const newReserved = Math.max(0, (inventory.reserved_quantity || 0) - quantity);

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity: newQuantity,
          reserved_quantity: newReserved,
        })
        .eq("product_id", productId);

      if (updateError) {
        console.error("Confirm stock error:", updateError);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    products,
    loading,
    error,
    refresh: fetchProducts,
    getProduct,
    getProductBySlug,
    getProductsByCategory,
    getProductsByCulture,
    checkAndReserveStock,
    reserveStock,
    releaseStock,
    confirmStockDeduction,
  };
}