import { BRANDS, type BrandSlug } from "@/lib/brands";

export type { BrandSlug };

interface StoreConfig {
  whatsappNumber: string;
  whatsappMessage: string;
  paymentPhone: string;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  expressDeliveryFee: number;
  supportEmail: string;
  storeName: string;
  storeTagline: string;
  brand?: BrandSlug;
}

export const DEFAULT_CONFIG: StoreConfig = {
  whatsappNumber: "265991234567",
  whatsappMessage: "Hi Streetwear Blantyre, I want to order",
  paymentPhone: "265991234567",
  freeDeliveryThreshold: 50000,
  deliveryFee: 5000,
  expressDeliveryFee: 8500,
  supportEmail: "hello@streetwearblantyre.mw",
  storeName: "Streetwear Blantyre",
  storeTagline: "Wear Your Identity",
};

export const getStoreConfig = (brand: BrandSlug = "sb"): StoreConfig => {
  const base: StoreConfig = {
    ...DEFAULT_CONFIG,
    brand,
  };
  const prefix = BRANDS[brand].envPrefix;
  const read = (key: string, fallback: string) => {
    const value = (import.meta.env as Record<string, string | undefined>)[`VITE_${prefix}_${key}`];
    return value || fallback;
  };
  const readNumber = (key: string, fallback: number) => {
    const raw = (import.meta.env as Record<string, string | undefined>)[`VITE_${prefix}_${key}`];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    whatsappNumber: read("WHATSAPP_NUMBER", base.whatsappNumber),
    whatsappMessage: read("WHATSAPP_MESSAGE", base.whatsappMessage),
    paymentPhone: read("PAYMENT_PHONE", base.paymentPhone),
    freeDeliveryThreshold: readNumber("FREE_DELIVERY_THRESHOLD", base.freeDeliveryThreshold),
    deliveryFee: readNumber("DELIVERY_FEE", base.deliveryFee),
    expressDeliveryFee: readNumber("EXPRESS_DELIVERY_FEE", base.expressDeliveryFee),
    supportEmail: read("SUPPORT_EMAIL", base.supportEmail),
    storeName: read("STORE_NAME", base.storeName),
    storeTagline: read("STORE_TAGLINE", base.storeTagline),
    brand,
  };
};
