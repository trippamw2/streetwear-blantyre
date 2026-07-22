// Streetwear Blantyre AI Agent for WhatsApp Messages
// Generates intelligent, personalized messages automatically

import { OrderDetails, StatusUpdate } from './ai-messages';

interface AIGenerationRequest {
  type: 'confirmation' | 'payment' | 'dispatch' | 'delivery' | 'reminder' | 'custom';
  orderData: OrderDetails | StatusUpdate;
  tone?: 'friendly' | 'professional' | 'excited';
  extra?: string;
}

// ============================================
// AI MESSAGE GENERATOR
// Uses templates with smart personalization
// ============================================
export class WhatsAppAIAgent {
  private storeName = "Streetwear Blantyre";
  private storeUrl = "https://www.wearsb.com";
  
  // Generate message based on type and data
  generate(request: AIGenerationRequest): string {
    const { type, orderData, tone = 'friendly', extra } = request;
    
    switch (type) {
      case 'confirmation':
        return this.generateConfirmation(orderData as OrderDetails, tone);
      case 'payment':
        return this.generatePaymentConfirmation(orderData as OrderDetails, tone);
      case 'dispatch':
        return this.generateDispatch(orderData as StatusUpdate, tone);
      case 'delivery':
        return this.generateDelivered(orderData as StatusUpdate, tone);
      case 'reminder':
        return this.generateReminder(orderData as OrderDetails, tone);
      default:
        return this.generateCustom(orderData, extra || 'Hello', tone);
    }
  }

  private generateConfirmation(data: OrderDetails, tone: string): string {
    const itemsList = data.items
      .map(i => `• ${i.quantity}× ${i.name}`)
      .join('\n');

    const emojis = { friendly: '', professional: '', excited: '' };
    
    return `${emojis[tone as keyof typeof emojis]} *Order Confirmed!* ${data.customerName.split(' ')[0]}

Your ${this.storeName} order is in!

${itemsList}

Total: MK ${data.total.toLocaleString()}
Delivery: ${data.location}

We'll WhatsApp you when it's dispatched!`;

  }

  private generatePaymentConfirmation(data: OrderDetails, tone: string): string {
    const emojis = { friendly: '', professional: '', excited: '' };
    
    return `${emojis[tone as keyof typeof emojis]} *Payment Confirmed!*

Thanks for paying, ${data.customerName.split(' ')[0]}! Your order is being prepared.

Order: PP-${data.orderId.slice(0, 6).toUpperCase()}
Paid: MK ${data.total.toLocaleString()}

On its way soon!`;
  }

  private generateDispatch(data: StatusUpdate, tone: string): string {
    const itemsList = data.items.map(i => `• ${i.quantity}× ${i.name}`).join('\n');
    const emojis = { friendly: '', professional: '', excited: '' };
    
    return `${emojis[tone as keyof typeof emojis]} *On The Way!* 

${data.customerName.split(' ')[0]}, your order is out for delivery!

${itemsList}

Est. delivery: ${data.eta || 'later today'}

Track: ${this.storeUrl}/track/${data.orderId}`;
  }

  private generateDelivered(data: StatusUpdate, tone: string): string {
    const itemsList = data.items.map(i => `• ${i.quantity}× ${i.name}`).join('\n');
    const emojis = { friendly: '', professional: '', excited: '' };
    
    return `${emojis[tone as keyof typeof emojis]} *Delivered!* 

You got it, ${data.customerName.split(' ')[0]}!

${itemsList}

Thanks for choosing ${this.storeName}!

Leave a review: ${this.storeUrl}/reviews`;
  }

  private generateReminder(data: OrderDetails, tone: string): string {
    return `*Payment Reminder* 

Hi ${data.customerName.split(' ')[0]}!

Just checking in about your ${this.storeName} order.

Outstanding: MK ${data.total.toLocaleString()}
Delivery: ${data.location}

Please confirm payment to secure your items!`;
  }

  private generateCustom(data: any, customMessage: string, tone: string): string {
    const prefix = tone === 'friendly' ? '' : '';
    return `${prefix}${customMessage}`;
  }
}

// Singleton instance
export const aiAgent = new WhatsAppAIAgent();

// ============================================
// EASY TO USE FUNCTIONS
// ============================================
export const generateOrderConfirmation = (data: OrderDetails, tone?: 'friendly' | 'professional' | 'excited') => 
  aiAgent.generate({ type: 'confirmation', orderData: data, tone });

export const generatePaymentNotification = (data: OrderDetails, tone?: 'friendly' | 'professional' | 'excited') => 
  aiAgent.generate({ type: 'payment', orderData: data, tone });

export const generateDispatchNotification = (data: StatusUpdate, tone?: 'friendly' | 'professional' | 'excited') => 
  aiAgent.generate({ type: 'dispatch', orderData: data, tone });

export const generateDeliveryNotification = (data: StatusUpdate, tone?: 'friendly' | 'professional' | 'excited') => 
  aiAgent.generate({ type: 'delivery', orderData: data, tone });

export const generateReminder = (data: OrderDetails, tone?: 'friendly' | 'professional' | 'excited') => 
  aiAgent.generate({ type: 'reminder', orderData: data, tone });

// ============================================
// BUILD WhatsApp LINK WITH AI MESSAGE
// ============================================
export const sendAIMessage = (message: string, phone?: string) => {
  const defaultPhone = "265991234567";
  const phoneNumber = phone?.replace(/[^0-9]/g, '') || defaultPhone;
  const formatted = phoneNumber.startsWith('0') 
    ? `265${phoneNumber.slice(1)}` 
    : phoneNumber;
  
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
};