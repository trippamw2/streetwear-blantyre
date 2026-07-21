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
  storeTagline: "Wear the Culture",
};

export const getStoreConfig = (): StoreConfig => {
  return {
    whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_CONFIG.whatsappNumber,
    whatsappMessage: import.meta.env.VITE_WHATSAPP_MESSAGE || DEFAULT_CONFIG.whatsappMessage,
    paymentPhone: import.meta.env.VITE_PAYMENT_PHONE || DEFAULT_CONFIG.paymentPhone,
    freeDeliveryThreshold: Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD) || DEFAULT_CONFIG.freeDeliveryThreshold,
    deliveryFee: Number(import.meta.env.VITE_DELIVERY_FEE) || DEFAULT_CONFIG.deliveryFee,
    expressDeliveryFee: Number(import.meta.env.VITE_EXPRESS_DELIVERY_FEE) || DEFAULT_CONFIG.expressDeliveryFee,
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || DEFAULT_CONFIG.supportEmail,
    storeName: import.meta.env.VITE_STORE_NAME || DEFAULT_CONFIG.storeName,
    storeTagline: import.meta.env.VITE_STORE_TAGLINE || DEFAULT_CONFIG.storeTagline,
  };
};

export const formatMWK = (n: number) => `MK ${n.toLocaleString("en-US")}`;

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};