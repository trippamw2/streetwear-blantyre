import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { calculateFinalPrice, getEffectiveWeightKg } from "@/lib/lfDelivery";

export interface LakeFreshCartItem {
  /** product + preparation combination */
  key: string;
  productId: string;
  name: string;
  speciesName: string;
  weightKg: number;
  preparation: string;
  pricePerKgMwk: number;
  minOrderQtyKg: number;
  preparationOptions: string[];
  image?: string | null;
}

interface LakeFreshCartState {
  items: LakeFreshCartItem[];
  add: (item: Omit<LakeFreshCartItem, "key">) => void;
  remove: (key: string) => void;
  setWeight: (key: string, weightKg: number) => void;
  setPreparation: (key: string, preparation: string) => void;
  clear: () => void;
  count: number;
  totalWeight: number;
  subtotal: number;
}

const LakeFreshCartContext = createContext<LakeFreshCartState | undefined>(undefined);
const STORAGE_KEY = "lf-cart-v1";

const buildKey = (productId: string, preparation: string) => `${productId}::${preparation}`;

const roundWeight = (value: number) => Math.round(value * 1000) / 1000;

const readStored = (): LakeFreshCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is LakeFreshCartItem =>
        !!item &&
        typeof item.productId === "string" &&
        typeof item.preparation === "string" &&
        Number.isFinite(Number(item.weightKg)) &&
        Number.isFinite(Number(item.pricePerKgMwk))
      )
      .map((item) => ({
        ...item,
        key: buildKey(item.productId, item.preparation),
        weightKg: Number(item.weightKg),
        pricePerKgMwk: Number(item.pricePerKgMwk),
        minOrderQtyKg: Number(item.minOrderQtyKg) || 0,
        preparationOptions: Array.isArray(item.preparationOptions)
          ? item.preparationOptions.filter((v: unknown): v is string => typeof v === "string")
          : [item.preparation],
      }));
  } catch {
    return [];
  }
};

export const LakeFreshCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LakeFreshCartItem[]>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // cart persistence is best-effort; checkout still validates server-side
    }
  }, [items]);

  const add: LakeFreshCartState["add"] = (item) => {
    const key = buildKey(item.productId, item.preparation);
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, weightKg: roundWeight(i.weightKg + item.weightKg) } : i
        );
      }
      return [...prev, { ...item, key, weightKg: roundWeight(item.weightKg) }];
    });
  };

  const remove = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const setWeight = (key: string, weightKg: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, weightKg: roundWeight(Math.max(0, weightKg)) } : i))
    );

  const setPreparation = (key: string, preparation: string) =>
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (!target || target.preparation === preparation) return prev;

      const nextKey = buildKey(target.productId, preparation);
      const duplicate = prev.find((i) => i.key === nextKey);

      if (duplicate) {
        return prev
          .filter((i) => i.key !== key)
          .map((i) =>
            i.key === nextKey
              ? { ...i, weightKg: roundWeight(i.weightKg + target.weightKg) }
              : i
          );
      }

      return prev.map((i) => (i.key === key ? { ...i, key: nextKey, preparation } : i));
    });

  const clear = () => setItems([]);

  const { count, totalWeight, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const effective = getEffectiveWeightKg(item.weightKg, item.minOrderQtyKg);
        return {
          count: acc.count + 1,
          totalWeight: acc.totalWeight + effective,
          subtotal: acc.subtotal + calculateFinalPrice(item.pricePerKgMwk, item.weightKg, item.minOrderQtyKg),
        };
      },
      { count: 0, totalWeight: 0, subtotal: 0 }
    );
  }, [items]);

  return (
    <LakeFreshCartContext.Provider
      value={{ items, add, remove, setWeight, setPreparation, clear, count, totalWeight, subtotal }}
    >
      {children}
    </LakeFreshCartContext.Provider>
  );
};

const fallback: LakeFreshCartState = {
  items: [],
  add: () => {},
  remove: () => {},
  setWeight: () => {},
  setPreparation: () => {},
  clear: () => {},
  count: 0,
  totalWeight: 0,
  subtotal: 0,
};

export const useLakeFreshCart = (): LakeFreshCartState => {
  const ctx = useContext(LakeFreshCartContext);
  return ctx ?? fallback;
};
