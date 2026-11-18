import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BRANDS, type BrandSlug } from "@/lib/brands";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "product";
  /** Brand whose name/domain/metadata should be used. Defaults to SB. */
  brand?: BrandSlug;
}

const SITE_NAME = "Streetwear Blantyre";
const SITE_URL = "https://www.wearsb.com";
const DEFAULT_DESC = "SB Streetwear - T shirts, football jerseys, short sleeve shirts and vests for everyday life, sport and outdoor experiences. Blantyre, Malawi. Wear Your Identity.";
const DEFAULT_IMAGE = "https://placehold.co/600x600/0f172a/ffffff?text=Streetwear+Blantyre";

const BRAND_META: Record<BrandSlug, { siteName: string; siteUrl: string; image: string }> = {
  sb: { siteName: SITE_NAME, siteUrl: SITE_URL, image: DEFAULT_IMAGE },
  "lake-fresh": {
    siteName: BRANDS["lake-fresh"].name,
    siteUrl: `https://${BRANDS["lake-fresh"].domain}`,
    image: "/brand/lake-fresh/logo.png",
  },
};

const BRAND_ICONS: Record<BrandSlug, { icon: string; apple: string; manifest: string; theme: string }> = {
  sb: {
    icon: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    manifest: "/site.webmanifest",
    theme: "#0a0a0a",
  },
  "lake-fresh": {
    icon: "/brand/lake-fresh/icon.png",
    apple: "/brand/lake-fresh/icon.png",
    manifest: "/brand/lake-fresh/site.webmanifest",
    theme: "#073B78",
  },
};

export const SEO = ({
  title,
  description,
  path = "",
  image,
  type = "website",
  brand = "sb",
}: SEOProps) => {
  const meta = BRAND_META[brand] ?? BRAND_META.sb;
  const icons = BRAND_ICONS[brand] ?? BRAND_ICONS.sb;
  const iconKey = brand === "lake-fresh" ? "lf" : "sb";
  const resolvedImage = image ?? meta.image;
  const fullTitle = title.includes(meta.siteName) ? title : `${title} | ${meta.siteName}`;
  const url = `${meta.siteUrl}${path}`;

  // Drop the other brand's bootstrap icons so a shared/local host never shows
  // the wrong tab icon after client-side navigation between storefronts.
  useEffect(() => {
    const opposite = iconKey === "lf" ? "sb" : "lf";
    document
      .querySelectorAll(`link[data-brand-icon="${opposite}"]`)
      .forEach((el) => el.parentNode?.removeChild(el));
  }, [iconKey]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={icons.theme} />
      <link rel="canonical" href={url} />
      <link rel="icon" type="image/png" href={icons.icon} data-brand-icon={iconKey} />
      <link rel="apple-touch-icon" sizes="180x180" href={icons.apple} data-brand-icon={iconKey} />
      <link rel="manifest" href={icons.manifest} data-brand-icon={iconKey} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={meta.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "product" ? "Product" : "WebSite",
          name: title,
          description,
          url,
          ...(type === "product" ? { image: resolvedImage } : {}),
        })}
      </script>
    </Helmet>
  );
};

export const defaultSEO = {
  home: {
    title: "Streetwear Blantyre | Wear Your Identity",
    description: DEFAULT_DESC,
  },
  shop: {
    title: "Shop All | T Shirts, Jerseys, Short Sleeve Shirts & Vests",
    description:
      "Shop T shirts, football jerseys, short sleeve shirts and vests from SB Streetwear. Everyday pieces for the street, the pitch and everything in between. Delivery across Malawi.",
  },
  combos: {
    title: "Kits & Bundles | Streetwear Blantyre",
    description:
      "Curated streetwear kits that put a full look together. Better value, one delivery. Free delivery over MK 50,000.",
  },
  about: {
    title: "Our Story | Inspired by Blantyre",
    description:
      "SB Streetwear brings together T shirts, football jerseys, short sleeve shirts and vests for everyday life in Blantyre, Malawi. Wear Your Identity.",
  },
  contact: {
    title: "Contact | SB Streetwear",
    description:
      "Reach SB Streetwear on WhatsApp for orders, sizing and availability. Delivery across Malawi and store pickup in Blantyre.",
  },
  auth: {
    title: "Sign In | SB Streetwear",
    description: "Sign in to check out faster, track your orders and save your favourite pieces.",
  },
  checkout: {
    title: "Checkout | SB Streetwear",
    description:
      "Complete your order securely with Airtel Money, TNM Mpamba, and bank transfer. Delivery across Malawi.",
  },
  orders: {
    title: "My Orders | SB Streetwear",
    description: "Track your SB Streetwear orders and deliveries.",
  },
  rewards: {
    title: "Rewards | Earn Points with SB Streetwear",
    description:
      "Earn points on every purchase, redeem them for discounts and refer friends to SB Streetwear.",
  },
  compare: {
    title: "Compare Pieces | SB Streetwear",
    description: "Compare SB Streetwear pieces side by side and find the fit that feels like you.",
  },
  faq: {
    title: "FAQ | SB Streetwear",
    description:
      "Answers about ordering, delivery, sizing, payments, returns and quality cover at SB Streetwear.",
  },
  terms: {
    title: "Terms & Conditions | SB Streetwear",
    description: "The terms and conditions that apply when you shop with SB Streetwear.",
  },
  privacy: {
    title: "Privacy Policy | SB Streetwear",
    description: "How SB Streetwear collects, uses and protects your personal information.",
  },
  returns: {
    title: "Returns & Exchanges | SB Streetwear",
    description:
      "Our clothing returns and size exchange policy. Unworn items with tags can be returned within 14 days.",
  },
  warranty: {
    title: "Quality Cover | SB Streetwear",
    description:
      "Our 30 day quality cover on clothing faults. We repair, replace or refund faulty items.",
  },
  lfPrivacy: {
    title: "Privacy Policy | Lake Fresh Fish Mart",
    description:
      "How Lake Fresh collects, uses and protects your information when you order fresh fish in Blantyre, Malawi.",
  },
  lfTerms: {
    title: "Terms and Conditions | Lake Fresh Fish Mart",
    description:
      "The terms for ordering fresh fish, seasonings and delivery from Lake Fresh in Blantyre, Malawi.",
  },
  lfRefund: {
    title: "Refund Policy | Lake Fresh Fish Mart",
    description:
      "How Lake Fresh handles refunds, replacements and delivery problems for fresh fish orders in Blantyre, Malawi.",
  },
  lfPhotoCredits: {
    title: "Photo Credits | Lake Fresh Fish Mart",
    description:
      "The photographers and photo terms for the fish and seasoning photos shown on Lake Fresh in Blantyre, Malawi.",
  },
  giftPacks: {
    title: "Gift Packs | SB Streetwear",
    description:
      "Gift a curated SB Streetwear pack with a personal message and delivery in Blantyre.",
  },
  scheduledGift: {
    title: "Schedule a Gift | SB Streetwear",
    description:
      "Send an SB Streetwear piece for any occasion. Add a personal message and choose the delivery date.",
  },
};
