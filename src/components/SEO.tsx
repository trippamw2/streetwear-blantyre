import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "product";
}

const SITE_NAME = "Streetwear Blantyre";
const SITE_URL = "https://www.wearsb.com";
const DEFAULT_DESC = "SB Streetwear - T shirts, football jerseys and short sleeve shirts for everyday life, sport and outdoor experiences. Blantyre, Malawi. Wear Your Identity.";
const DEFAULT_IMAGE = "https://placehold.co/600x600/0f172a/ffffff?text=Streetwear+Blantyre";

export const SEO = ({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  type = "website",
}: SEOProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "product" ? "Product" : "WebSite",
          name: title,
          description,
          url,
          ...(type === "product" ? { image } : {}),
        })}
      </script>
    </Helmet>
  );
};

export const defaultSEO = {
  home: {
    title: "Streetwear Blantyre — Wear Your Identity",
    description: DEFAULT_DESC,
  },
  shop: {
    title: "Shop All — T Shirts, Jerseys & Short Sleeve Shirts",
    description:
      "Shop T shirts, football jerseys and short sleeve shirts from SB Streetwear. Everyday pieces for the street, the pitch and everything in between. Delivery across Malawi.",
  },
  combos: {
    title: "Kits & Bundles — Streetwear Blantyre",
    description:
      "Curated streetwear kits that put a full look together. Better value, one delivery. Free delivery over MK 50,000.",
  },
  about: {
    title: "Our Story — Inspired by Blantyre",
    description:
      "SB Streetwear brings together T shirts, football jerseys and short sleeve shirts for everyday life in Blantyre, Malawi. Wear Your Identity.",
  },
  contact: {
    title: "Contact — SB Streetwear",
    description:
      "Reach SB Streetwear on WhatsApp for orders, sizing and availability. Delivery across Malawi and store pickup in Blantyre.",
  },
  auth: {
    title: "Sign In — SB Streetwear",
    description: "Sign in to check out faster, track your orders and save your favourite pieces.",
  },
  checkout: {
    title: "Checkout — SB Streetwear",
    description:
      "Complete your order securely with Airtel Money, TNM Mpamba, and bank transfer. Delivery across Malawi.",
  },
  orders: {
    title: "My Orders — SB Streetwear",
    description: "Track your SB Streetwear orders and deliveries.",
  },
  rewards: {
    title: "Rewards — Earn Points with SB Streetwear",
    description:
      "Earn points on every purchase, redeem them for discounts and refer friends to SB Streetwear.",
  },
  compare: {
    title: "Compare Pieces — SB Streetwear",
    description: "Compare SB Streetwear pieces side by side and find the fit that feels like you.",
  },
  faq: {
    title: "FAQ — SB Streetwear",
    description:
      "Answers about ordering, delivery, sizing, payments, returns and quality cover at SB Streetwear.",
  },
  terms: {
    title: "Terms & Conditions — SB Streetwear",
    description: "The terms and conditions that apply when you shop with SB Streetwear.",
  },
  privacy: {
    title: "Privacy Policy — SB Streetwear",
    description: "How SB Streetwear collects, uses and protects your personal information.",
  },
  returns: {
    title: "Returns & Exchanges — SB Streetwear",
    description:
      "Our clothing returns and size exchange policy. Unworn items with tags can be returned within 14 days.",
  },
  warranty: {
    title: "Quality Cover — SB Streetwear",
    description:
      "Our 30 day quality cover on clothing faults. We repair, replace or refund faulty items.",
  },
  giftPacks: {
    title: "Gift Packs — SB Streetwear",
    description:
      "Gift a curated SB Streetwear pack with a personal message and delivery in Blantyre.",
  },
  scheduledGift: {
    title: "Schedule a Gift — SB Streetwear",
    description:
      "Send an SB Streetwear piece for any occasion. Add a personal message and choose the delivery date.",
  },
};
