import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "product";
}

const SITE_NAME = "Streetwear Blantyre";
const SITE_URL = "https://streetwearblantyre.mw";
const DEFAULT_DESC = "Streetwear fashion in Malawi. T-shirts, hoodies, caps, sneakers, pants, and jackets. Free delivery over MK 50,000.";
const DEFAULT_IMAGE = "https://placehold.co/600x600/FF6B00/ffffff?text=Streetwear+Blantyre";

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
    title: "Streetwear Blantyre — Fashion & Streetwear in Malawi",
    description: DEFAULT_DESC,
  },
  shop: {
    title: "Shop — T-Shirts, Hoodies, Caps, Sneakers & More",
    description: "Browse t-shirts, hoodies, caps, sneakers, pants, and jackets. Fast delivery across Malawi.",
  },
  combos: {
    title: "Fashion Bundles — Save 15-25% vs Buying Separate",
    description: "Curated fashion bundles for every style. T-shirt + cap + sneakers in one box. Cheaper together. Free delivery.",
  },
  about: {
    title: "About Streetwear Blantyre — Malawi's Streetwear Brand",
    description: "Streetwear Blantyre brings you the culture. Premium fits for the streets. Based in Blantyre, Malawi.",
  },
  contact: {
    title: "Contact Streetwear Blantyre — WhatsApp, Phone & Email",
    description: "Reach us on WhatsApp, phone or email. Fast replies, fast delivery across Malawi.",
  },
  auth: {
    title: "Sign In or Create Account — Streetwear Blantyre Rewards",
    description: "Sign in to checkout, track orders, and earn rewards on every purchase.",
  },
  checkout: {
    title: "Checkout — Streetwear Blantyre Malawi",
    description: "Complete your order. Secure checkout with Airtel Money, TNM Mpamba, and bank transfer.",
  },
  orders: {
    title: "My Orders — Streetwear Blantyre",
    description: "Track your Streetwear Blantyre orders and deliveries.",
  },
  rewards: {
    title: "Streetwear Blantyre Rewards — Earn Points & Redeem Discounts",
    description: "Earn points on every purchase. Redeem for discounts. Refer friends and earn more.",
  },
  compare: {
    title: "Compare Products — Streetwear Blantyre",
    description: "Compare streetwear side by side. Find the best fits for your style.",
  },
  faq: {
    title: "FAQ — Streetwear Blantyre Malawi",
    description: "Frequently asked questions about ordering, delivery, warranty, and returns.",
  },
  terms: {
    title: "Terms & Conditions — Streetwear Blantyre",
    description: "Terms and conditions for Streetwear Blantyre online store.",
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
    title: "Warranty Information — Streetwear Blantyre",
    description: "30-day quality guarantee on all items. We replace defective products.",
  },
};
