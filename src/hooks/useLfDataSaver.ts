import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lf_data_saver";
const EVENT = "lf-data-saver-changed";

const readPreference = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
};

/** Persisted low-data preference shared by every Lake Fresh image component. */
export const useLfDataSaver = () => {
  const [enabled, setEnabled] = useState(readPreference);

  useEffect(() => {
    const sync = () => setEnabled(readPreference());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setPreference = useCallback((next: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    enabled,
    setPreference,
    toggle: () => setPreference(!enabled),
  };
};
