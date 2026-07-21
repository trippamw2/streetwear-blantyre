const PAYCHANGU_PUBLIC_KEY = import.meta.env.VITE_PAYCHANGU_PUBLIC_KEY;
const PAYCHANGU_SECRET_KEY = import.meta.env.VITE_PAYCHANGU_SECRET_KEY;

export interface PayChanguPaymentParams {
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title?: string;
  description?: string;
}

export interface PayChanguResponse {
  link: string;
  txRef: string;
}

export const createPayChanguPayment = async (params: PayChanguPaymentParams): Promise<PayChanguResponse> => {
  const PAYCHANGU_API_URL = "https://api.paychangu.com/payment";
  
  const payload = {
    amount: params.amount.toString(),
    currency: params.currency || "MWK",
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    tx_ref: params.txRef,
    callback_url: params.callbackUrl,
    return_url: params.returnUrl,
    customization: {
      title: params.title || "Streetwear Blantyre Order",
      description: params.description || "Order payment",
    },
  };

  try {
    const response = await fetch(PAYCHANGU_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok && (data.data?.checkout_url || data.link || data.checkout_url)) {
      const checkoutUrl = data.data?.checkout_url || data.checkout_url || data.link;
      const txRef = data.data?.tx_ref || data.tx_ref;
      return {
        link: checkoutUrl,
        txRef: txRef,
      };
    }

    console.error("PayChangu full response:", JSON.stringify(data, null, 2));
    throw new Error(data.message || data.data?.message || `Payment creation failed: ${response.status}`);
  } catch (error) {
    console.error("PayChangu error:", error);
    throw error;
  }
};

export const PAYCHANGU_CONFIG = {
  publicKey: PAYCHANGU_PUBLIC_KEY,
  testMode: !PAYCHANGU_PUBLIC_KEY || !PAYCHANGU_SECRET_KEY || PAYCHANGU_SECRET_KEY?.startsWith("your_"),
  hasKeys: !!(PAYCHANGU_PUBLIC_KEY && PAYCHANGU_SECRET_KEY),
};