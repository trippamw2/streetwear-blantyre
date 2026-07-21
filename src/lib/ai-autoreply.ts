// Streetwear Blantyre AI Auto-Reply System
// Receives messages via webhook and responds with AI

interface IncomingMessage {
  from: string;
  message: string;
  timestamp: Date;
}

interface AIResponse {
  response: string;
  action?: 'reply' | 'forward' | 'escalate';
}

// ============================================
// KNOWLEDGE BASE - Your order/product info
// ============================================
const KNOWLEDGE_BASE = `
Streetwear Blantyre Store Information:
- We sell fashion: t-shirts, hoodies, caps, sneakers, pants, jackets
- Brands: SB Original, SB Street
- Delivery: Blantyre (same day), Southern (1-2 days), Central/Northern (2-3 days)
- Payment: PayChangu (mobile money), WhatsApp bank transfer
- Warranty: 30 days on all items
- Returns: 7 days with receipt
- Hours: 8am-6pm Mon-Sat, 9am-4pm Sun
`;

// ============================================
// ORDER STATUS CHECKER
// ============================================
const checkOrderStatus = async (orderIdOrPhone: string) => {
  // This would connect to Supabase
  // For now, return a placeholder
  return null;
};

// ============================================
// AI RESPONSE GENERATOR
// Simple rule-based AI that can be enhanced with OpenAI
// ============================================
export class AIAgent {
  private knowledgeBase = KNOWLEDGE_BASE;
  
  // Main response function
  async respond(message: string, customerPhone?: string): Promise<AIResponse> {
    const lowerMsg = message.toLowerCase();
    
    // Check for order status query
    if (lowerMsg.includes('order') || lowerMsg.includes('tracking') || lowerMsg.includes('status')) {
      const orderInfo = await checkOrderStatus(customerPhone || '');
      if (orderInfo) {
        return {
          response: `📦 Your Order Status: ${orderInfo.status}\n${orderInfo.eta ? `📦 ETA: ${orderInfo.eta}` : ''}`,
          action: 'reply'
        };
      }
    }
    
    // Check for price/pricing
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
      return {
        response: `Our prices vary by product! What are you interested in?

👕 T-Shirts, 🧥 Hoodies, 👟 Sneakers, 🧢 Caps

Reply with the product type and I'll check current prices!`,
        action: 'reply'
      };
    }
    
    // Check for delivery
    if (lowerMsg.includes('delivery') || lowerMsg.includes('shipping') || lowerMsg.includes('bring')) {
      return {
        response: `🚚 Delivery Options:

📍 Blantyre CBD: Same day delivery!
📍 Southern Region: 1-2 days
📍 Central/Northern: 2-3 days

Delivery is FREE on orders over MK 50,000!

What's your location?`,
        action: 'reply'
      };
    }
    
    // Check for location/address
    if (lowerMsg.includes('where') || lowerMsg.includes('location') || lowerMsg.includes('shop')) {
      return {
        response: `📍 Streetwear Blantyre Store

We're based in Blantyre, Malawi!

Order online: streetwearblantyre-store.vercel.app
Or visit our physical shop in Blantyre CBD.

Open: Mon-Sat 8am-6pm, Sun 9am-4pm`,
        action: 'reply'
      };
    }
    
    // Check for hello/greeting
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      return {
        response: `👋 Hey! Welcome to Streetwear Blantyre!

We sell t-shirts, hoodies, caps, sneakers & more.

How can I help you today?`,
        action: 'reply'
      };
    }
    
    // Check for warranty/returns
    if (lowerMsg.includes('warranty') || lowerMsg.includes('return') || lowerMsg.includes('repair')) {
      return {
        response: `🛡️ Streetwear Blantyre Warranty & Returns:

✅ Warranty: 30 days on all items
↩️ Returns: 7 days with receipt

Have an issue with a recent order?`,
        action: 'reply'
      };
    }
    
    // Default - try to help or escalate
    return {
      response: `Thanks for reaching out! 

I can help with:
• Order status & tracking
• Product prices
• Delivery info
• Warranty & returns

Or connect you with our team for more help!`,
      action: 'reply'
    };
  }
}

// Singleton instance
export const aiAgent = new AIAgent();

// ============================================
// WEBHOOK HANDLER FOR WHATSAPP GATEWAY
// ============================================
// When using OpenWA/WAHA, this is the endpoint that receives messages
/*
POST /api/webhook
Body: {
  "from": "265991234567",
  "message": "Hi, I want to order",
  "timestamp": "2025-01-01T00:00:00Z"
}
*/
export async function handleWebhook(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { from, message } = body;
    
    if (!message) {
      return Response.json({ status: 'ignored', reason: 'no_message' });
    }
    
    // Get AI response
    const aiResponse = await aiAgent.respond(message, from);
    
    // If action is reply, send back (this would call WhatsApp API)
    if (aiResponse.action === 'reply') {
      // This would be: sendWhatsAppMessage(from, aiResponse.response)
      }
    
    return Response.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('[AI Webhook Error]', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}