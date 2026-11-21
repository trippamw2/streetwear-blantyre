// Public Lake Fresh contact details.
// These are intentionally environment driven. If a value is not configured we
// hide the channel instead of showing a placeholder number to customers.

const configured = (value?: string) => (value || "").trim();

export const LF_CONTACT = {
  whatsapp: configured(import.meta.env.VITE_LF_WHATSAPP),
  phone: configured(import.meta.env.VITE_LF_PHONE),
  email: configured(import.meta.env.VITE_LF_EMAIL),
  address: configured(import.meta.env.VITE_LF_ADDRESS),
  registration: configured(import.meta.env.VITE_LF_REGISTRATION),
} as const;

export const hasLfWhatsApp = Boolean(LF_CONTACT.whatsapp);
export const hasLfPhone = Boolean(LF_CONTACT.phone);
export const hasLfEmail = Boolean(LF_CONTACT.email);

/** tel: link from the configured public phone number, when available. */
export const lfPhoneHref = () => {
  if (!LF_CONTACT.phone) return null;
  return `tel:${LF_CONTACT.phone.replace(/[^0-9+]/g, "")}`;
};

/** mailto: link from the configured public email address, when available. */
export const lfEmailHref = () => (LF_CONTACT.email ? `mailto:${LF_CONTACT.email}` : null);
