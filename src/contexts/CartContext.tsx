import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";

export interface CartItem {
  productKey: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productKey: string) => void;
  setQuantity: (productKey: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const CartContext = createContext<CartState | undefined>(undefined);
const STORAGE_KEY = "sb-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useDeliverySettings();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartState["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.productKey === item.productKey);
      if (found) {
        return prev.map((p) =>
          p.productKey === item.productKey ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const remove: CartState["remove"] = (key) => setItems((p) => p.filter((i) => i.productKey !== key));
  const setQuantity: CartState["setQuantity"] = (key, qty) =>
    setItems((p) => (qty <= 0 ? p.filter((i) => i.productKey !== key) : p.map((i) => (i.productKey === key ? { ...i, quantity: qty } : i))));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const deliveryFee = subtotal >= settings.freeDeliveryThreshold ? 0 : subtotal > 0 ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider value={{ items, add, remove, setQuantity, clear, count, subtotal, deliveryFee, total }}>
      {children}
    </CartContext.Provider>
  );
};

const noop = () => {};
const fallback: CartState = {
  items: [],
  add: noop,
  remove: noop,
  setQuantity: noop,
  clear: noop,
  count: 0,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  return ctx ?? fallback;
};

export const FREE_DELIVERY_THRESHOLD_MWK = 50000;
export const DELIVERY_FEE_MWK = 5000;