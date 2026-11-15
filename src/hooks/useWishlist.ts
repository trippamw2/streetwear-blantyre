import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sb_wishlist";
const EVENT = "sb-wishlist-change";

const readWishlist = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const writeWishlist = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage unavailable - keep the current session usable.
  }
};

export function useWishlist(productId?: string) {
  const [ids, setIds] = useState<string[]>(readWishlist);

  useEffect(() => {
    const sync = () => setIds(readWishlist());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readWishlist();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeWishlist(next);
    return next.includes(id);
  }, []);

  return {
    ids,
    count: ids.length,
    isWishlisted: productId ? ids.includes(productId) : false,
    toggle,
  };
}
