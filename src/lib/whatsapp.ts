// Streetwear Blantyre WhatsApp helpers
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_BUSINESS || "265991234567"; // Set in Vercel env
export const STORE_URL = "https://www.wearsb.com";

export const buildWhatsAppLink = (message: string) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
};

export const defaultMessage = "Hi Streetwear Blantyre, I want to order.";

export const productMessage = (name: string, price: number, imageUrl?: string) => {
  const imagePart = imageUrl ? `\nView product: ${imageUrl}` : "";
  return `Hi Streetwear Blantyre.

I would like to order:
${name} — MK ${price.toLocaleString("en-US")}
${imagePart}

Please share next steps. Thanks.`;
};

export const comboMessage = (name: string, price: number, imageUrl?: string) => {
  const imagePart = imageUrl ? `\nView: ${imageUrl}` : "";
  return `Hi Streetwear Blantyre.

I would like to order the ${name} bundle — MK ${price.toLocaleString("en-US")}.
${imagePart}

Please share next steps. Thanks.`;
};

export interface CartItem {
  productKey: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  location: string;
  deliveryMethod: string;
  deliveryFee?: number;
  notes?: string;
}

export const buildOrderMessage = (
  items: CartItem[],
  total: number,
  customer: CustomerDetails,
  orderId?: string,
  storeUrl?: string
) => {
  const itemsTxt = items
    .map((i) => `${i.quantity} x ${i.name} - MK ${(i.price * i.quantity).toLocaleString("en-US")}`)
    .join("\n");

  return `*NEW ORDER - Streetwear Blantyre*

================================

*ORDER #${orderId ? orderId.slice(0, 8).toUpperCase() : "PENDING"}*

================================

*CUSTOMER DETAILS*
================================
Name: ${customer.name}
Phone: ${customer.phone}
Location: ${customer.location}
Delivery: ${customer.deliveryMethod}
${customer.notes ? `Notes: ${customer.notes}` : ""}

================================

*ORDER ITEMS*
================================
${itemsTxt}

================================

*PAYMENT SUMMARY*
================================
    Subtotal: MK ${total.toLocaleString("en-US")}
    Delivery: MK ${customer.deliveryFee ? customer.deliveryFee.toLocaleString("en-US") : "TBD"}
    ================================
    *TOTAL: MK ${total.toLocaleString("en-US")}*
================================

Please confirm order and send payment link. Thank you.`;
};