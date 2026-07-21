import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/data/products";

interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  brand: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

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
        .or("is_active.eq.true,is_active.is.null");

      if (fetchError) {
        console.error("Products fetch error:", fetchError);
        setError("Failed to load products");
        setProducts([]);
        setLoading(false);
        return;
      }

      if (!productsArray || productsArray.length === 0) {
        console.warn("⚠️ No products found in database");
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch inventory for stock levels
      const { data: inventory } = await supabase
        .from("inventory")
        .select("product_id, quantity, reserved_quantity");

      // Build inventory map
      const inventoryMap = new Map<string, InventoryRecord>();
      inventory?.forEach((inv) => {
        inventoryMap.set(inv.product_id, inv as InventoryRecord);
      });

      // Map database products to frontend format
      const mappedProducts: Product[] = productsArray.map((p: any) => ({
        id: p.id,
        name: p.name,
        benefit: p.description || p.benefit || "",
        price: p.price,
        category: (p.category || "all") as any,
        image: p.image || "",
        brand: p.brand || "Generic",
        types: [],
        stock: p.stock_quantity || 10,
        is_featured: p.is_featured || false,
        is_best_seller: p.is_best_seller || false,
        is_on_sale: p.is_on_sale || false,
        discount_percent: p.discount_percent || 0,
        gallery_images: p.gallery_images || [],
        specs: p.specs || {},
        reward_points: p.reward_points || Math.round(p.price / 100),
        rating: p.rating || 0,
      }));

      console.log("✅ Products loaded from DB:", mappedProducts.length);
      setProducts(mappedProducts);
    } catch (err) {
      console.error("❌ Products fetch error:", err);
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get single product by ID
  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  // Get products by category
  const getProductsByCategory = useCallback((category: string) => {
    if (category === "all") return products;
    return products.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
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
    getProductsByCategory,
    checkAndReserveStock,
    reserveStock,
    releaseStock,
    confirmStockDeduction,
  };
}