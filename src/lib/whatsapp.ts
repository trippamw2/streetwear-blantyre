// Multi-brand WhatsApp helpers.
// `brand` is optional and defaults to SB Streetwear so existing SB callers keep working.

import { getBrandConfig, normalizeBrandSlug, type BrandSlug } from "@/lib/brands";

export const WHATSAPP_NUMBERS: Record<BrandSlug, string> = {
  sb: "265991234567",
  "lake-fresh": "265991234567",
};

export const STORE_URLS: Record<BrandSlug, string> = {
  sb: "https://www.wearsb.com",
  "lake-fresh": "https://lakefreshmw.com",
};

export const WHATSAPP_NUMBER = WHATSAPP_NUMBERS.sb; // default (SB)
export const STORE_URL = STORE_URLS.sb;

const brandOf = (brand?: BrandSlug) => normalizeBrandSlug(brand);

export const buildWhatsAppLink = (message: string, phone?: string, brand?: BrandSlug) => {
  const b = brandOf(brand);
  const number = (phone || WHATSAPP_NUMBERS[b]).replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
};

export const defaultMessage = "Hi Streetwear Blantyre, I want to order.";
export const defaultMessageFor = (brand?: BrandSlug) =>
  `Hi ${getBrandConfig(brand).name}, I want to order.`;

export const productMessage = (name: string, price: number, imageUrl?: string, brand?: BrandSlug) => {
  const b = brandOf(brand);
  const imagePart = imageUrl ? `\nView product: ${imageUrl}` : "";
  return `Hi ${getBrandConfig(b).name}.

I would like to order:
${name}, MK ${price.toLocaleString("en-US")}
${imagePart}

Please share next steps. Thanks.`;
};

export const comboMessage = (name: string, price: number, imageUrl?: string, brand?: BrandSlug) => {
  const b = brandOf(brand);
  const imagePart = imageUrl ? `\nView: ${imageUrl}` : "";
  return `Hi ${getBrandConfig(b).name}.

I would like to order the ${name} bundle, MK ${price.toLocaleString("en-US")}.
${imagePart}

Please share next steps. Thanks.`;
};
