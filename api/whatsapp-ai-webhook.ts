// Streetwear Blantyre AI WhatsApp Webhook
// Endpoint to receive messages and respond with AI

// This can be deployed on:
// - Vercel (API routes)
// - Netlify (functions)  
// - Supabase Edge Functions
// - Connected to WhatsApp Gateway via webhook URL

// Note: This requires a WhatsApp gateway (OpenWA/WAHA) to be running
// The gateway sends incoming messages to this webhook, and this returns the AI response

export const config = {
  api: {
    bodyParser: true,
  },
};

interface WebhookPayload {
  session?: string;
  from: string;
  message: string;
  type?: string;
  name?: string;
}

// Knowledge base for AI responses
const KNOWLEDGE = {
  products: "We sell: T-shirts, Hoodies, Caps, Sneakers, Pants, Jackets",
  delivery: "Blantyre: Same day | Southern: 1-2 days | Central/Northern: 2-3 days | Free over MK 50,000",
  payment: "PayChangu (Airtel Money, TNM Mpamba) or WhatsApp bank transfer",
  warranty: "30-day quality guarantee, 7 days return with receipt",
  hours: "Mon-Sat 8am-6pm, Sun 9am-4pm",
  location: "Based in Blantyre, Malawi - Online orders at streetwearblantyre-store.vercel.app",
};

function getResponse(input: string): string {
  const msg = input.toLowerCase();
  
  // Order/Status
  if (msg.includes('order') || msg.includes('status') || msg.includes('tracking')) {
    return `📦 To check your order, please share your order number or phone number used to place the order.\n\nOr track at: streetwearblantyre-store.vercel.app/track`;
  }
  
  // Price/Cost
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much') || msg.includes('buy')) {
    return `💰 Our products:\n\n👕 T-shirts from MK 8,000\n🧥 Hoodies from MK 15,000\n🧢 Caps from MK 5,000\n👟 Sneakers from MK 20,000\n\nWhat interests you?`;
  }
  
  // Delivery
  if (msg.includes('delivery') || msg.includes('shipping') || msg.includes('bring')) {
    return `🚚 ${KNOWLEDGE.delivery}\n\nWhat's your location?`;
  }
  
  // Location/Shop
  if (msg.includes('where') || msg.includes('location') || msg.includes('shop') || msg.includes('address')) {
    return `📍 ${KNOWLEDGE.location}\n\nOpen: ${KNOWLEDGE.hours}`;
  }
  
  // Warranty
  if (msg.includes('warranty') || msg.includes('return') || msg.includes('repair') || msg.includes('problem')) {
    return `🛡️ ${KNOWLEDGE.warranty}\n\nWhat's the issue?`;
  }
  
  // Contact/Help
  if (msg.includes('contact') || msg.includes('speak') || msg.includes('human') || msg.includes('agent')) {
    return `👤 I'll connect you with our team! One moment please...\n\nOr call: ${KNOWLEDGE.location}`;
  }
  
  // Hello
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('start')) {
    return `👋 Hey! Welcome to Streetwear Blantyre!\n\nWe sell fashion: 👕🧢👟\n\nHow can I help?`;
  }
  
  // Thank you
  if (msg.includes('thank') || msg.includes('thanks')) {
    return `🙏 You're welcome! Anything else? 😊`;
  }
  
  // Bye
  if (msg.includes('bye') || msg.includes('goodbye') || msg.includes('see you')) {
    return `👋 Bye! Thanks for chatting!\n\nOrder: streetwearblantyre-store.vercel.app\n\nSee you again! 😊`;
  }
  
  // Default
  return `Thanks for messaging!\n\nI can help with:\n• Order status\n• Product prices\n• Delivery info\n• Warranty\n\nOr visit: streetwearblantyre-store.vercel.app\n\nOur team is here Mon-Sat 8am-6pm 🙏`;
}

export default async function handler(req: any, res: any) {
  // Handle CORS for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming message
    const payload = req.body as WebhookPayload;
    const { from, message, name } = payload;

    // Validate we have a message
    if (!message || typeof message !== 'string') {
      return res.status(200).json({ status: 'ignored', reason: 'no_message' });
    }

    // Get AI response
    const response = getResponse(message);

    // Return the response
    // The WhatsApp gateway will send this back to the user
    return res.status(200).json({
      success: true,
      to: from,
      message: response,
    });

  } catch (error) {
    ;
    return res.status(500).json({ error: 'Internal error' });
  }
}