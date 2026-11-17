// Streetwear Blantyre Brevo Email Integration
// All Brevo API calls are proxied through /api/send-email (serverless)
// The API key is NEVER exposed to the client bundle

const BREVO_PROXY_URL = "/api/send-email";

export type EmailBrand = "sb" | "lake-fresh";

interface BrandConfig {
  name: string;
  tagline: string;
  email: string;
  website: string;
  primaryColor: string;
  businessName: string;
  address: string;
  whatsapp: string;
  logoText: string;
}

const BRANDS: Record<EmailBrand, BrandConfig> = {
  sb: {
    name: "Streetwear Blantyre",
    tagline: "Wear Your Identity",
    email: "orders@wearsb.com",
    website: "https://www.wearsb.com",
    primaryColor: "${primary}",
    businessName: "Streetwear Blantyre",
    address: "Blantyre, Malawi",
    whatsapp: `https://wa.me/${import.meta.env.VITE_WHATSAPP_BUSINESS || "265991234567"}`,
    logoText: "SB",
  },
  "lake-fresh": {
    name: "Lake Fresh Fish Mart",
    tagline: "Fresh fish from Lake Malawi, made for your table.",
    email: "orders@lakefreshmw.com",
    website: "https://lakefreshmw.com",
    primaryColor: "#073B78",
    businessName: "Lake Fresh Fish Mart",
    address: "Blantyre, Malawi",
    whatsapp: `https://wa.me/${import.meta.env.VITE_WHATSAPP_BUSINESS || "265991234567"}`,
    logoText: "LF",
  },
};

const getBrand = (brand?: EmailBrand): BrandConfig => BRANDS[brand || "sb"];

// Premium Email wrapper with branding - LIGHT THEME
const wrapEmail = (content: string, title: string, brand?: EmailBrand) => {
  const BRAND = getBrand(brand);
  const primary = BRAND.primaryColor;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND.name}</title>
</head>
<body style="margin: 0; padding: 40px 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background: #f8f9fa;">
  
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 0 16px;">
        
        <!-- Main card with light styling -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
          
          <!-- Premium Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${primary} 100%); padding: 40px 32px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%); pointer-events: none;"></div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 64px; height: 64px; background: rgba(255,255,255,0.9); border-radius: 20px; line-height: 64px; font-size: 24px; font-weight: 800; color: ${primary}; margin-bottom: 16px;">${BRAND.logoText}</div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-shadow: 0 2px 20px rgba(0,0,0,0.2);">${BRAND.name}</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 8px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 4px; text-transform: uppercase;">${BRAND.tagline}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content area -->
          <tr>
            <td style="padding: 40px 32px; color: #0a0a0a; background: #ffffff;">
              ${content}
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.4) 50%, transparent 100%);"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 32px; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 20px;">
                      <span style="color: ${primary}; font-size: 12px; font-weight: 600; letter-spacing: 1px;">${BRAND.businessName}</span>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">${BRAND.address}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 24px 0;">${BRAND.email}</p>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="padding: 0 8px;"><a href="${BRAND.whatsapp}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 10px 16px; border-radius: 10px; letter-spacing: 0.5px;">WhatsApp</a></td>
                        <td style="padding: 0 8px;"><a href="${BRAND.website}" style="display: inline-block; background: ${primary}; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 10px 16px; border-radius: 10px; letter-spacing: 0.5px;">Shop</a></td>
                      </tr>
                    </table>
                    
                    <p style="color: #9ca3af; font-size: 11px; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                      © ${new Date().getFullYear()} ${BRAND.name}. ${BRAND.tagline}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Tagline badge -->
        <div style="margin-top: 24px; text-align: center;">
          <span style="display: inline-block; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); border-radius: 20px; padding: 8px 20px;">
            <span style="color: ${primary}; font-size: 11px; font-weight: 600; letter-spacing: 2px;">${BRAND.tagline}</span>
          </span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

};

// ============================================
// PROXIED BREVO API CALL
// ============================================
async function sendViaProxy(action: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(BREVO_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      console.error("[Brevo] Proxy error:", response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("[Brevo] Proxy failed:", error);
    return false;
  }
}

interface OrderEmailParams {
  to: string;
  toName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  location: string;
  deliveryMethod: string;
  eta?: string;
  type: 'confirmation' | 'payment' | 'dispatched' | 'delivered';
  brand?: EmailBrand;
  /** Recipe PDF links emailed with a Lake Fresh order. */
  recipes?: Array<{ title: string; url: string }>;
  /** Public tracking link for this order. */
  trackingUrl?: string;
}

// ============================================
// BRAND BROADCAST (admin communications)
// ============================================
export const sendBrandBroadcast = async (params: {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  brand?: EmailBrand;
}) => {
  const B = getBrand(params.brand);
  const paragraphs = params.body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin: 0 0 14px 0; line-height: 1.65;">${block.replace(/\n/g, "<br />")}</p>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #073B78; margin-top: 0;">${params.subject}</h2>
      ${paragraphs}
      <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">Thanks, ${B.name}</p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: params.to,
    toName: params.toName || params.to,
    subject: params.subject,
    htmlContent: wrapEmail(html, params.subject, params.brand),
    senderName: B.businessName,
    senderEmail: B.email,
  });
};

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================
export const sendOrderConfirmationEmail = async (order: OrderEmailParams) => {
  const B = getBrand(order.brand);
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0;">${item.quantity} × ${item.name}</td>
        <td style="padding: 8px 0; text-align: right;">MK ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Order Confirmed</h2>
      <p>Hi ${order.toName},</p>
      <p>Your ${B.name} order is in. Here is the summary:</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr style="border-top: 2px solid #0f172a;">
          <td style="padding: 12px 0; font-weight: bold;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold;">MK ${order.total.toLocaleString()}</td>
        </tr>
      </table>
      
      ${
        order.recipes && order.recipes.length > 0
          ? `<div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #073B78;">Your free recipe${order.recipes.length > 1 ? "s" : ""}</p>
        ${order.recipes
          .map(
            (recipe) =>
              `<p style="margin: 4px 0;"><a href="${recipe.url}" style="color: #073B78; font-weight: bold;">${recipe.title} (PDF)</a></p>`,
          )
          .join("")}
      </div>`
          : ""
      }
      
      <div style="background: #f8f9fa; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.location}</p>
        <p style="margin: 4px 0;"><strong>Method:</strong> ${order.deliveryMethod}</p>
        ${order.eta ? `<p style="margin: 4px 0;"><strong>ETA:</strong> ${order.eta}</p>` : ""}
      </div>
      
      ${
        order.trackingUrl
          ? `<p style="margin: 16px 0;"><a href="${order.trackingUrl}" style="display: inline-block; background: #073B78; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">Track your order</a></p>`
          : ""
      }
      <p>Order #${order.orderId.slice(0, 8).toUpperCase()}</p>
      <p style="color: #6b7280; font-size: 14px;">We will WhatsApp you with updates.</p>
      <p style="margin-top: 24px;">Thanks, ${B.name} Team</p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: order.to,
    toName: order.toName,
    subject: `Order Confirmed. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: wrapEmail(html, "Order Confirmed", order.brand),
  });
};

// ============================================
// PAYMENT RECEIVED EMAIL
// ============================================
export const sendPaymentReceivedEmail = async (order: OrderEmailParams) => {
  const B = getBrand(order.brand);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Payment Confirmed</h2>
      <p>Hi ${order.toName},</p>
      <p>Thanks for paying. Your order is being prepared.</p>
      
      <div style="background: #f8f9fa; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Order #:</strong> ${order.orderId.slice(0, 8).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> MK ${order.total.toLocaleString()}</p>
        <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.location}</p>
      </div>
      
      <p>We will let you know when it is dispatched.</p>
      <p style="margin-top: 24px;">Thanks, ${B.name} Team</p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: order.to,
    toName: order.toName,
    subject: `Payment Received. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: wrapEmail(html, "Payment Received", order.brand),
  });
};

// ============================================
// ORDER DISPATCHED EMAIL
// ============================================
export const sendDispatchedEmail = async (order: OrderEmailParams) => {
  const B = getBrand(order.brand);
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} × ${item.name}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">On The Way</h2>
      <p>Hi ${order.toName},</p>
      <p>Your ${B.name} order is out for delivery.</p>
      
      <ul>${itemsHtml}</ul>
      
      <p>Est. delivery: ${order.eta || "later today"}</p>
      ${
        order.trackingUrl
          ? `<p style="margin-top: 16px;">Track: <a href="${order.trackingUrl}" style="color: #0f172a;">${order.trackingUrl}</a></p>`
          : ""
      }
      <p style="margin-top: 24px;">Thanks, ${B.name} Team</p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: order.to,
    toName: order.toName,
    subject: `Order On The Way. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: wrapEmail(html, "Order On The Way", order.brand),
  });
};

// ============================================
// ORDER DELIVERED EMAIL
// ============================================
export const sendDeliveredEmail = async (order: OrderEmailParams) => {
  const B = getBrand(order.brand);
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} × ${item.name}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Delivered</h2>
      <p>Hi ${order.toName},</p>
      <p>Your order has arrived.</p>
      
      <ul>${itemsHtml}</ul>
      
      <p style="margin: 16px 0;">Hope you love your ${B.name} gear.</p>
      <p>Please leave a review: <a href="https://www.wearsb.com/reviews" style="color: #0f172a;">www.wearsb.com/reviews</a></p>
      <p style="margin-top: 24px;">Thanks for choosing ${B.name}.</p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: order.to,
    toName: order.toName,
    subject: `Order Delivered. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: wrapEmail(html, "Order Delivered", order.brand),
  });
};

// ============================================
// SEND GENERIC EMAIL
// ============================================
export const sendEmail = async (to: string, subject: string, html: string, brand?: EmailBrand) => {
  const B = getBrand(brand);
  return sendViaProxy("send-email", {
    to,
    subject,
    htmlContent: wrapEmail(html, subject, brand),
  });
};

// ============================================
// SEND ADMIN NOTIFICATION (New Order Alert)
// ============================================
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "martinezkaponda@gmail.com";

export const sendAdminNotificationEmail = async (order: OrderEmailParams) => {
  const B = getBrand(order.brand);
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0;">${item.quantity} × ${item.name}</td>
        <td style="padding: 8px 0; text-align: right;">MK ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">New Order Received</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr style="border-top: 2px solid #0f172a;">
          <td style="padding: 12px 0; font-weight: bold;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold;">MK ${order.total.toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="background: #f8f9fa; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${order.toName}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.to}</p>
        <p style="margin: 4px 0;"><strong>Location:</strong> ${order.location}</p>
        <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.deliveryMethod}</p>
      </div>
      
      <p>Order #${order.orderId.slice(0, 8).toUpperCase()}</p>
      <p style="margin-top: 16px;">
        <a href="https://www.wearsb.com/admin/orders" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View in Admin</a>
      </p>
    </div>
  `;

  return sendViaProxy("send-email", {
    to: ADMIN_EMAIL,
    toName: "Streetwear Blantyre Admin",
    subject: `NEW ORDER #${order.orderId.slice(0, 8).toUpperCase()} - MK ${order.total.toLocaleString()}`,
    htmlContent: wrapEmail(html, "New Order", order.brand),
  });
};

// ============================================
// ADD TO BREVO LIST (Subscribe)
// ============================================
export const subscribeToList = async (email: string, name?: string) => {
  return sendViaProxy("subscribe", {
    email,
    name,
    listId: parseInt(import.meta.env.VITE_BREVO_LIST_ID || "2"),
  });
};

// Check if proxy is reachable (always true since it's our own serverless function)
export const isBrevoConfigured = () => true;
