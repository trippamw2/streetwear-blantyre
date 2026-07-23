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
const DEFAULT_DESC = "Premium African streetwear from Blantyre, Malawi. Celebrating creators, builders, dreamers, and cultural keepers. Every piece tells a story. Free delivery over MK 50,000.";
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
    title: "Streetwear Blantyre — Premium African Streetwear",
    description: DEFAULT_DESC,
  },
  shop: {
    title: "Shop — Premium African Streetwear Collection",
    description: "Browse t-shirts, hoodies, caps, bracelets, earbuds, and stickers. Every piece tells a story. Fast delivery across Malawi.",
  },
  combos: {
    title: "Culture Kits — Curated Streetwear Bundles",
    description: "Curated culture kits for every lifestyle. T-shirt + cap + bracelet in one box. Better together. Free delivery over MK 50,000.",
  },
  about: {
    title: "Our Story — Built in Blantyre, Loved Across Africa",
    description: "Streetwear Blantyre celebrates people who create culture instead of chasing it. Premium African streetwear from Malawi.",
  },
  contact: {
    title: "Connect — Streetwear Blantyre Community",
    description: "Reach us on WhatsApp, phone, or email. We're here to listen to your story. Fast replies, fast delivery across Malawi.",
  },
  auth: {
    title: "Sign In — Join the Streetwear Blantyre Community",
    description: "Sign in to checkout, track orders, and join our community of creators, builders, and dreamers.",
  },
  checkout: {
    title: "Checkout — Streetwear Blantyre",
    description: "Complete your order. Secure checkout with Airtel Money, TNM Mpamba, and bank transfer.",
  },
  orders: {
    title: "My Orders — Streetwear Blantyre",
    description: "Track your Streetwear Blantyre orders and deliveries.",
  },
  rewards: {
    title: "Rewards — Earn Points & Join Our Community",
    description: "Earn points on every purchase. Redeem for discounts. Refer friends and grow our community together.",
  },
  compare: {
    title: "Compare Products — Streetwear Blantyre",
    description: "Compare streetwear side by side. Find the pieces that tell your story.",
  },
  faq: {
    title: "FAQ — Streetwear Blantyre",
    description: "Frequently asked questions about ordering, delivery, warranty, and returns.",
  },
  terms: {
    title: "Terms & Conditions — Streetwear Blantyre",
    description: "Terms and conditions for Streetwear Blantyre.",
  },
  privacy: {
    title: "Privacy Policy — Streetwear Blantyre",
    description: "How Streetwear Blantyre collects, uses, and protects your personal information.",
  },
  returns: {
    title: "Returns & Refunds — Streetwear Blantyre",
    description: "30-day return policy. Not happy? Send it back. No questions asked.",
  },
  warranty: {
    title: "Warranty — Streetwear Blantyre",
    description: "30-day quality guarantee on all items. We replace defective products.",
  },
};
