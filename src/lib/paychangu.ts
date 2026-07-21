const PAYCHANGU_PUBLIC_KEY = import.meta.env.VITE_PAYCHANGU_PUBLIC_KEY;

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

/**
 * Creates a hidden HTML form and submits it to PayChangu's hosted payment page.
 * This is the correct client-side integration method (no secret key exposed).
 * The user is redirected to PayChangu's checkout page to complete payment.
 */
export const redirectToPayChangu = (params: PayChanguPaymentParams): void => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://api.paychangu.com/hosted-payment-page";
  form.style.display = "none";

  const fields: Record<string, string> = {
    public_key: PAYCHANGU_PUBLIC_KEY || "",
    callback_url: params.callbackUrl,
    return_url: params.returnUrl,
    tx_ref: params.txRef,
    amount: params.amount.toString(),
    currency: params.currency || "MWK",
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    title: params.title || "Streetwear Blantyre Order",
    description: params.description || "Order payment",
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  // Form is removed by the browser after redirect
};

export const PAYCHANGU_CONFIG = {
  publicKey: PAYCHANGU_PUBLIC_KEY,
  testMode: !PAYCHANGU_PUBLIC_KEY || PAYCHANGU_PUBLIC_KEY?.startsWith("your_"),
  hasKeys: !!PAYCHANGU_PUBLIC_KEY,
};
