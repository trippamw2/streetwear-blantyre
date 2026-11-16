import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { calculateFinalPrice, getEffectiveWeightKg } from "@/lib/lfDelivery";

export type LFItemKind = "fish" | "unit";

export interface LakeFreshCartItem {
  /** product + preparation combination */
  key: string;
  kind: LFItemKind;
  productId: string;
  name: string;
  speciesName?: string;
  // fish-specific
  weightKg?: number;
  preparation?: string;
  pricePerKgMwk?: number;
  minOrderQtyKg?: number;
  preparationOptions?: string[];
  image?: string | null;
  /** Free recipe chosen for this fish line (never charged). */
  recipeId?: string | null;
  recipeTitle?: string | null;
  // unit-specific
  itemType?: "spice" | "other";
  quantity?: number;
  unitPriceMwk?: number;
  unit?: string | null;
}

interface LakeFreshCartState {
  items: LakeFreshCartItem[];
  add: (item: Omit<LakeFreshCartItem, "key" | "kind"> & { weightKg: number; preparation: string; pricePerKgMwk: number }) => void;
  addUnit: (item: Omit<LakeFreshCartItem, "key" | "kind"> & { quantity: number; unitPriceMwk: number }) => void;
  remove: (key: string) => void;
  setWeight: (key: string, weightKg: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  setPreparation: (key: string, preparation: string) => void;
  setRecipe: (key: string, recipeId: string | null, recipeTitle: string | null) => void;
  clear: () => void;
  count: number;
  totalWeight: number;
  subtotal: number;
}

const LakeFreshCartContext = createContext<LakeFreshCartState | undefined>(undefined);
const STORAGE_KEY = "lf-cart-v1";

const buildKey = (productId: string, qualifier: string) => `${productId}::${qualifier}`;

const roundWeight = (value: number) => Math.round(value * 1000) / 1000;

const readStored = (): LakeFreshCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is LakeFreshCartItem => !!item && typeof item.productId === "string" && typeof item.name === "string")
      .map((item) => {
        const kind: LFItemKind = item.kind === "unit" ? "unit" : "fish";
        if (kind === "unit") {
          return {
            ...item,
            kind,
            key: buildKey(item.productId, "unit"),
            quantity: Number(item.quantity) || 1,
            unitPriceMwk: Number(item.unitPriceMwk) || 0,
          };
        }
        return {
          ...item,
          kind: "fish",
          key: buildKey(item.productId, item.preparation || "whole"),
          weightKg: Number(item.weightKg) || 0,
          pricePerKgMwk: Number(item.pricePerKgMwk) || 0,
          minOrderQtyKg: Number(item.minOrderQtyKg) || 0,
          preparation: item.preparation || "whole",
          preparationOptions: Array.isArray(item.preparationOptions)
            ? item.preparationOptions.filter((v: unknown): v is string => typeof v === "string")
            : [item.preparation || "whole"],
        };
      });
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

  const add = (item: Omit<LakeFreshCartItem, "key" | "kind"> & { weightKg: number; preparation: string; pricePerKgMwk: number }) => {
    const key = buildKey(item.productId, item.preparation);
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key
            ? {
                ...i,
                weightKg: roundWeight((i.weightKg || 0) + item.weightKg),
                recipeId: item.recipeId ?? i.recipeId ?? null,
                recipeTitle: item.recipeTitle ?? i.recipeTitle ?? null,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...item,
          kind: "fish",
          key,
          weightKg: roundWeight(item.weightKg),
          recipeId: item.recipeId ?? null,
          recipeTitle: item.recipeTitle ?? null,
        },
      ];
    });
  };

  const addUnit = (item: Omit<LakeFreshCartItem, "key" | "kind"> & { quantity: number; unitPriceMwk: number }) => {
    const key = buildKey(item.productId, "unit");
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: (i.quantity || 0) + item.quantity } : i
        );
      }
      return [...prev, { ...item, kind: "unit", key, quantity: item.quantity }];
    });
  };

  const remove = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const setWeight = (key: string, weightKg: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key && i.kind === "fish" ? { ...i, weightKg: roundWeight(Math.max(0, weightKg)) } : i))
    );

  const setQuantity = (key: string, quantity: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key && i.kind === "unit" ? { ...i, quantity: Math.max(1, Math.round(quantity)) } : i))
    );

  const setPreparation = (key: string, preparation: string) =>
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (!target || target.kind !== "fish" || target.preparation === preparation) return prev;

      const nextKey = buildKey(target.productId, preparation);
      const duplicate = prev.find((i) => i.key === nextKey);

      if (duplicate) {
        return prev
          .filter((i) => i.key !== key)
          .map((i) =>
            i.key === nextKey
              ? { ...i, weightKg: roundWeight((i.weightKg || 0) + (target.weightKg || 0)) }
              : i
          );
      }

      return prev.map((i) => (i.key === key ? { ...i, key: nextKey, preparation } : i));
    });

  const setRecipe = (key: string, recipeId: string | null, recipeTitle: string | null) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key && i.kind === "fish" ? { ...i, recipeId, recipeTitle } : i))
    );

  const clear = () => setItems([]);

  const { count, totalWeight, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.kind === "unit") {
          const qty = item.quantity || 1;
          const price = item.unitPriceMwk || 0;
          return {
            count: acc.count + qty,
            totalWeight: acc.totalWeight,
            subtotal: acc.subtotal + price * qty,
          };
        }
        const effective = getEffectiveWeightKg(item.weightKg || 0, item.minOrderQtyKg || 0.5);
        const line = calculateFinalPrice(item.pricePerKgMwk || 0, item.weightKg || 0, item.minOrderQtyKg || 0.5);
        return {
          count: acc.count + 1,
          totalWeight: acc.totalWeight + effective,
          subtotal: acc.subtotal + line,
        };
      },
      { count: 0, totalWeight: 0, subtotal: 0 }
    );
  }, [items]);

  return (
    <LakeFreshCartContext.Provider
      value={{ items, add, addUnit, remove, setWeight, setQuantity, setPreparation, setRecipe, clear, count, totalWeight, subtotal }}
    >
      {children}
    </LakeFreshCartContext.Provider>
  );
};

const fallback: LakeFreshCartState = {
  items: [],
  add: () => {},
  addUnit: () => {},
  remove: () => {},
  setWeight: () => {},
  setQuantity: () => {},
  setPreparation: () => {},
  setRecipe: () => {},
  clear: () => {},
  count: 0,
  totalWeight: 0,
  subtotal: 0,
};

export const useLakeFreshCart = (): LakeFreshCartState => {
  const ctx = useContext(LakeFreshCartContext);
  return ctx ?? fallback;
};
