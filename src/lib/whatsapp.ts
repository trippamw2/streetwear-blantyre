// Multi-brand WhatsApp helpers.
// `brand` is optional and defaults to SB so existing callers keep working.

import { getBrandConfig, normalizeBrandSlug, type BrandSlug } from "@/lib/brands";

export const WHATSAPP_NUMBERS: Record<BrandSlug, string> = {
  sb: "265982972977",
  // Lake Fresh must never inherit another brand's number. The public number is
  // configured with VITE_LF_WHATSAPP and hidden when it has not been provided.
  "lake-fresh": "",
};

export const STORE_URLS: Record<BrandSlug, string> = {
  sb: "https://www.wearsb.com",
  "lake-fresh": "https://lakefreshmw.com",
};

export const WHATSAPP_NUMBER = WHATSAPP_NUMBERS.sb; // default (SB)
export const STORE_URL = STORE_URLS.sb;

const brandOf = (brand?: BrandSlug) => normalizeBrandSlug(brand);

const configured = (value?: string) => (value || "").trim();

/** The public Lake Fresh WhatsApp number, or null when it is not configured. */
export const lfWhatsAppNumber = () =>
  configured(
    import.meta.env.VITE_LF_WHATSAPP ||
      import.meta.env.VITE_WHATSAPP_LAKEFRESH ||
      WHATSAPP_NUMBERS["lake-fresh"],
  ) || null;

export const buildWhatsAppLink = (message: string, phone?: string, brand?: BrandSlug) => {
  const b = brandOf(brand);
  const source = phone || (b === "lake-fresh" ? lfWhatsAppNumber() : WHATSAPP_NUMBERS[b]) || "";
  const number = source.replace(/[^0-9]/g, "");
  if (!number) return "";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
};

/** One WhatsApp path for every Lake Fresh customer facing link. */
export const lfWhatsAppLink = (message: string): string | null => {
  const number = lfWhatsAppNumber();
  return number ? buildWhatsAppLink(message, number, "lake-fresh") : null;
};

export const defaultMessage = "Hi SB, I want to order.";
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
