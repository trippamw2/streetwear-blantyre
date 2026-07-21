// Streetwear Blantyre AI WhatsApp Message Templates

interface OrderDetails {
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  location: string;
  deliveryMethod: string;
  paymentMethod?: string;
  eta?: string;
}

interface StatusUpdate {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  status: 'new' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  items: Array<{ name: string; quantity: number; price?: number }>;
  total?: number;
  eta?: string;
}

const generateTrackingCode = (orderId: string) => `PP-${orderId.slice(0, 6).toUpperCase()}`;

const formatMWK = (amount: number) => `MK ${amount.toLocaleString('en-US')}`;

export const orderConfirmation = (details: OrderDetails) => {
  const { customerName, items, total, location, deliveryMethod, eta = '1-2 days' } = details;
  const trackingCode = generateTrackingCode(details.orderId);
  const itemsList = items.map(i => `  ${i.quantity}x ${i.name}`).join('\n');

  return `Order Confirmed. ${customerName.split(' ')[0]}

Your Streetwear Blantyre order has been received.

ORDER DETAILS
${itemsList}

Total: ${formatMWK(total)}
Delivery to: ${location}
Method: ${deliveryMethod}
ETA: ${eta}
Ref: ${trackingCode}

Next Steps:
1. We confirm payment
2. We prepare your items
3. We dispatch and notify you

Track: https://streetwearblantyre-store.vercel.app/track/${details.orderId}`;
};

export const paymentReceived = (details: OrderDetails) => {
  const { orderId, customerName, items, total, location, deliveryMethod, eta = '1-2 days' } = details;
  const trackingCode = generateTrackingCode(orderId);
  const itemsList = items.map(i => `  ${i.quantity}x ${i.name}`).join('\n');

  return `Payment Confirmed. ${customerName.split(' ')[0]}

Thank you for your payment. Your order is now being prepared.

ORDER DETAILS
${itemsList}

Total Paid: ${formatMWK(total)}
Delivery to: ${location}
Delivery: ${deliveryMethod}
ETA: ${eta}
Tracking: ${trackingCode}

We will notify you when it is dispatched.

Track: https://streetwearblantyre-store.vercel.app/track/${orderId}`;
};

export const orderDispatched = (update: StatusUpdate) => {
  const { orderId, customerName, items, eta = 'Today/Tomorrow' } = update;
  const trackingCode = generateTrackingCode(orderId);
  const itemsList = items.map(i => `  ${i.quantity}x ${i.name}`).join('\n');

  return `Order On The Way. ${customerName.split(' ')[0]}

Your Streetwear Blantyre order is out for delivery.

ITEMS
${itemsList}

Order Ref: ${trackingCode}
Est. Delivery: ${eta}

Please ensure someone is available to receive your order.

Track: https://streetwearblantyre-store.vercel.app/track/${orderId}

Questions? Reply here.`;
};

export const orderDelivered = (update: StatusUpdate) => {
  const { orderId, customerName, items } = update;
  const trackingCode = generateTrackingCode(orderId);
  const itemsList = items.map(i => `  ${i.quantity}x ${i.name}`).join('\n');

  return `Order Delivered. ${customerName.split(' ')[0]}

Your Streetwear Blantyre order has arrived.

DELIVERED ITEMS
${itemsList}

Ref: ${trackingCode}

Thank you for choosing Streetwear Blantyre.

Please leave a review to help other customers:
https://streetwearblantyre-store.vercel.app/product/powerbank-001

Need anything else? Just reply.`;
};

export const orderCancelled = (update: StatusUpdate) => {
  const { orderId, customerName, total } = update;
  const trackingCode = generateTrackingCode(orderId);

  return `Order Cancelled. ${customerName.split(' ')[0]}

Your order ${trackingCode} (${formatMWK(total)}) has been cancelled.

If this was a mistake, we would love to help you reorder.

Browse: https://streetwearblantyre-store.vercel.app/shop

Questions? Reply here.`;
};

export const getStatusMessage = (orderId: string, status: string, items: any[], eta?: string) => {
  return `Order Status

Your order ${generateTrackingCode(orderId)}:

Status: ${status.toUpperCase()}
${eta ? `ETA: ${eta}` : ''}

${items.map(i => `  ${i.quantity}x ${i.name}`).join('\n')}

Track: https://streetwearblantyre-store.vercel.app/track/${orderId}`;
};

export const statusCheck = (status: string, eta?: string) => {
  const statusMessages: Record<string, string> = {
    new: 'Just received. We are reviewing it now.',
    confirmed: 'Ready. We are preparing your order.',
    processing: 'Being packed with care.',
    dispatched: 'On its way to you.',
    delivered: 'You should have it now.',
  };
  return statusMessages[status] || 'Checking on it for you.';
};

export const reminderMessage = (details: OrderDetails, daysOverdue: number) => {
  return `Payment Reminder. ${details.customerName.split(' ')[0]}

A friendly reminder about your Streetwear Blantyre order.

Order: ${generateTrackingCode(details.orderId)}
Outstanding: ${formatMWK(details.total)}
Delivery to: ${details.location}

Please confirm payment to secure your items.

Questions? Reply here.`;
};

export const thankYouMessage = (orderId: string, customerName: string) => {
  return `Thanks for your order, ${customerName.split(' ')[0]}.

We appreciate you choosing Streetwear Blantyre.

As a returning customer, you will get an exclusive discount on your next order. Just ask.

Check back soon for new arrivals.

Questions? We are here.`;
};

export const buildWhatsAppLink = (message: string, phone?: string) => {
  const defaultPhone = "265991234567";
  const phoneNumber = phone?.replace(/[^0-9]/g, '') || defaultPhone;
  const formatted = phoneNumber.startsWith('0') 
    ? `265${phoneNumber.slice(1)}` 
    : phoneNumber;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
};

export const STORE_PHONE = "265991234567";
export const STORE_URL = "https://streetwearblantyre-store.vercel.app";
export const defaultMessage = "Hi Streetwear Blantyre. I want to order.";
