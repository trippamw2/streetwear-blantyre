import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DeliverySettings {
  freeDeliveryThreshold: number;
  deliveryFee: number;
  expressDeliveryFee: number;
}

const DEFAULT_SETTINGS: DeliverySettings = {
  freeDeliveryThreshold: 50000,
  deliveryFee: 5000,
  expressDeliveryFee: 8500,
};

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["free_delivery_threshold", "delivery_fee", "express_delivery_fee"]);

      if (error) {
        console.error("Fetch settings error:", error);
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const settingsMap: Record<string, string> = {};
      data?.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      setSettings({
        freeDeliveryThreshold: Number(settingsMap.free_delivery_threshold) || DEFAULT_SETTINGS.freeDeliveryThreshold,
        deliveryFee: Number(settingsMap.delivery_fee) || DEFAULT_SETTINGS.deliveryFee,
        expressDeliveryFee: Number(settingsMap.express_delivery_fee) || DEFAULT_SETTINGS.expressDeliveryFee,
      });
    } catch (err) {
      console.error("Settings fetch error:", err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    refresh: fetchSettings,
  };
}