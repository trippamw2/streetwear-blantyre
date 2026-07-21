// Streetwear Blantyre Brevo Email Integration
// Send transactional emails via Brevo (formerly Sendinblue)

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_LIST_ID = import.meta.env.VITE_BREVO_LIST_ID || "2";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "martinezkaponda@gmail.com";

// Brand configuration
const BRAND = {
  name: "Streetwear Blantyre",
  tagline: "Wear the Culture",
  email: "orders@wearsb.com",
  website: "https://www.wearsb.com",
  // Use text-based header since images can be blocked
  useLogoImage: false,
  phone: import.meta.env.VITE_WHATSAPP_BUSINESS || "+265 991 234 567",
  facebook: "https://facebook.com/streetwearblantyre",
  instagram: "https://instagram.com/streetwearblantyre",
  whatsapp: `https://wa.me/${import.meta.env.VITE_WHATSAPP_BUSINESS || "265991234567"}`,
  address: "Blantyre, Malawi",
  businessName: "Streetwear Blantyre",
};

// Premium Email wrapper with branding - LIGHT THEME
const wrapEmail = (content: string, title: string) => `
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
            <td style="background: linear-gradient(135deg, #2563eb 0%, #2563eb 50%, #2563eb 100%); padding: 40px 32px; position: relative; overflow: hidden;">
              <!-- Decorative glow -->
              <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%); pointer-events: none;"></div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo icon -->
                    <div style="display: inline-block; width: 64px; height: 64px; background: rgba(255,255,255,0.9); border-radius: 20px; line-height: 64px; font-size: 24px; font-weight: 800; color: #2563eb; margin-bottom: 16px;">SB</div>
                    <!-- Brand name -->
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-shadow: 0 2px 20px rgba(0,0,0,0.2);">${BRAND.name}</h1>
                    <!-- Tagline -->
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
                    
                    <!-- Brand badge -->
                    <div style="display: inline-block; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 20px;">
                      <span style="color: #2563eb; font-size: 12px; font-weight: 600; letter-spacing: 1px;">${BRAND.businessName}</span>
                    </div>
                    
                    <!-- Contact info -->
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">${BRAND.address}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 24px 0;">${BRAND.email}</p>
                    
                    <!-- Social links -->
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="padding: 0 8px;"><a href="${BRAND.whatsapp}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 10px 16px; border-radius: 10px; letter-spacing: 0.5px;">WhatsApp</a></td>
                        <td style="padding: 0 8px;"><a href="${BRAND.website}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 10px 16px; border-radius: 10px; letter-spacing: 0.5px;">Shop</a></td>
                      </tr>
                    </table>
                    
                    <!-- Copyright -->
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
            <span style="color: #2563eb; font-size: 11px; font-weight: 600; letter-spacing: 2px;">${BRAND.tagline}</span>
          </span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  params?: Record<string, string>;
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
}

// Template IDs - create these in Brevo dashboard
const TEMPLATES = {
  orderConfirmation: 1,
  paymentReceived: 2, 
  orderDispatched: 3,
  orderDelivered: 4,
};

const BREVO_API_URL = "https://api.brevo.com/v3";

export const config = {
  api: {
    bodyParser: {
      raw: true,
    },
  },
};

// ============================================
// SEND TRANSACTIONAL EMAIL
// ============================================
async function sendBrevoEmail(params: SendEmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn("[Brevo] No API key configured");
    return false;
  }

  try {
    // Wrap content with brand template
    const htmlContent = wrapEmail(params.htmlContent || params.textContent || "", params.subject);

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: BRAND.name,
          email: BRAND.email,
        },
        to: [
          {
            email: params.to,
            name: params.toName || params.to,
          },
        ],
        subject: params.subject,
        htmlContent: htmlContent,
        textContent: params.textContent || "",
        params: params.params || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Brevo] Error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Brevo] Failed:", error);
    return false;
  }
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================
export const sendOrderConfirmationEmail = async (order: OrderEmailParams) => {
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
      <h2 style="color: #2563eb;">Order Confirmed</h2>
      <p>Hi ${order.toName},</p>
      <p>Your Streetwear Blantyre order is in. Here is the summary:</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr style="border-top: 2px solid #2563eb;">
          <td style="padding: 12px 0; font-weight: bold;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold;">MK ${order.total.toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="background: #f8f9fa; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.location}</p>
        <p style="margin: 4px 0;"><strong>Method:</strong> ${order.deliveryMethod}</p>
        ${order.eta ? `<p style="margin: 4px 0;"><strong>ETA:</strong> ${order.eta}</p>` : ""}
      </div>
      
      <p>Order #${order.orderId.slice(0, 8).toUpperCase()}</p>
      <p style="color: #6b7280; font-size: 14px;">We will WhatsApp you with updates.</p>
      <p style="margin-top: 24px;">Thanks, Streetwear Blantyre Team</p>
    </div>
  `;

  return sendBrevoEmail({
    to: order.to,
    toName: order.toName,
    subject: `Order Confirmed. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: html,
  });
};

// ============================================
// PAYMENT RECEIVED EMAIL
// ============================================
export const sendPaymentReceivedEmail = async (order: OrderEmailParams) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Payment Confirmed</h2>
      <p>Hi ${order.toName},</p>
      <p>Thanks for paying. Your order is being prepared.</p>
      
      <div style="background: #f8f9fa; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Order #:</strong> ${order.orderId.slice(0, 8).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> MK ${order.total.toLocaleString()}</p>
        <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.location}</p>
      </div>
      
      <p>We will let you know when it is dispatched.</p>
      <p style="margin-top: 24px;">Thanks, Streetwear Blantyre Team</p>
    </div>
  `;

  return sendBrevoEmail({
    to: order.to,
    toName: order.toName,
    subject: `Payment Received. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: html,
  });
};

// ============================================
// ORDER DISPATCHED EMAIL
// ============================================
export const sendDispatchedEmail = async (order: OrderEmailParams) => {
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} × ${item.name}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">On The Way</h2>
      <p>Hi ${order.toName},</p>
      <p>Your Streetwear Blantyre order is out for delivery.</p>
      
      <ul>${itemsHtml}</ul>
      
      <p>Est. delivery: ${order.eta || "later today"}</p>
      <p style="margin-top: 16px;">Track: <a href="https://www.wearsb.com/track/${order.orderId}" style="color: #2563eb;">streetwearblantyre-store.vercel.app/track/${order.orderId.slice(0, 8)}</a></p>
      <p style="margin-top: 24px;">Thanks, Streetwear Blantyre Team</p>
    </div>
  `;

  return sendBrevoEmail({
    to: order.to,
    toName: order.toName,
    subject: `Order On The Way. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: html,
  });
};

// ============================================
// ORDER DELIVERED EMAIL
// ============================================
export const sendDeliveredEmail = async (order: OrderEmailParams) => {
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} × ${item.name}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Delivered</h2>
      <p>Hi ${order.toName},</p>
      <p>Your order has arrived.</p>
      
      <ul>${itemsHtml}</ul>
      
      <p style="margin: 16px 0;">Hope you love your Streetwear Blantyre gear.</p>
      <p>Please leave a review: <a href="https://www.wearsb.com/reviews" style="color: #2563eb;">streetwearblantyre-store.vercel.app/reviews</a></p>
      <p style="margin-top: 24px;">Thanks for choosing Streetwear Blantyre.</p>
    </div>
  `;

  return sendBrevoEmail({
    to: order.to,
    toName: order.toName,
    subject: `Order Delivered. #${order.orderId.slice(0, 8).toUpperCase()}`,
    htmlContent: html,
  });
};

// ============================================
// SEND GENERIC EMAIL
// ============================================
export const sendEmail = async (to: string, subject: string, html: string) => {
  return sendBrevoEmail({
    to,
    subject,
    htmlContent: html,
  });
};

// ============================================
// SEND ADMIN NOTIFICATION (New Order Alert)
// ============================================
export const sendAdminNotificationEmail = async (order: OrderEmailParams) => {
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
      <h2 style="color: #2563eb;">New Order Received</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr style="border-top: 2px solid #2563eb;">
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
        <a href="https://www.wearsb.com/admin/orders" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View in Admin</a>
      </p>
    </div>
  `;

  return sendBrevoEmail({
    to: ADMIN_EMAIL,
    toName: "Streetwear Blantyre Admin",
    subject: `NEW ORDER #${order.orderId.slice(0, 8).toUpperCase()} - MK ${order.total.toLocaleString()}`,
    htmlContent: html,
  });
};

// ============================================
// ADD TO BREVO LIST (Subscribe)
// ============================================
export const subscribeToList = async (email: string, name?: string) => {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [parseInt(BREVO_LIST_ID)],
        attributes: {
          FIRSTNAME: name || email.split("@")[0],
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Brevo] Subscribe error:", error);
    return false;
  }
};

// Check if configured
export const isBrevoConfigured = () => !!BREVO_API_KEY;