import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { BRANDS, type BrandSlug } from "@/lib/brands";
import { LF_CONTACT } from "@/lib/lfContact";

type SchemaObject = Record<string, unknown>;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "product";
  /** Brand whose name/domain/metadata should be used. Defaults to Wear What Speaks. */
  brand?: BrandSlug;
  /** Extra structured data, for example a recipe or breadcrumb trail. */
  jsonLd?: SchemaObject | SchemaObject[];
}

const SITE_NAME = "SB";
const SITE_URL = "https://www.wearsb.com";
const DEFAULT_DESC = "SB is streetwear clothing made for everyday life. Shop quality tees, vests, shirts, and shorts in Malawi with simple shopping and reliable delivery.";
const DEFAULT_IMAGE = "https://www.wearsb.com/images/sb/home-menu.jpg";

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

/** Local `/lf` routes are for QA. Search engines only see clean brand URLs. */
export const canonicalPathFor = (brand: BrandSlug, pathname: string) =>
  brand === "lake-fresh" ? pathname.replace(/^\/lf(?=\/|$)/, "") || "/" : pathname;

const LF_SITE_URL = BRAND_META["lake-fresh"].siteUrl;

export const lfBreadcrumbSchema = (
  items: Array<{ name: string; path: string }>,
): SchemaObject => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${LF_SITE_URL}${canonicalPathFor("lake-fresh", item.path)}`,
  })),
});

export const lfProductSchema = (input: {
  name: string;
  description: string;
  image: string;
  path: string;
  priceMwk: number;
  inStock: boolean;
}): SchemaObject => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: input.name,
  description: input.description,
  image: input.image,
  url: `${LF_SITE_URL}${canonicalPathFor("lake-fresh", input.path)}`,
  brand: { "@type": "Brand", name: BRANDS["lake-fresh"].name },
  offers: {
    "@type": "Offer",
    priceCurrency: "MWK",
    price: Number(input.priceMwk.toFixed(0)),
    availability: input.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    url: `${LF_SITE_URL}${canonicalPathFor("lake-fresh", input.path)}`,
  },
});

export const lfRecipeSchema = (input: {
  name: string;
  description: string;
  image: string;
  path: string;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients: string[];
  steps: string[];
}): SchemaObject => {
  const minutes = Math.max(0, Number(input.prepMinutes || 0) + Number(input.cookMinutes || 0));
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: input.name,
    description: input.description,
    image: input.image,
    url: `${LF_SITE_URL}${canonicalPathFor("lake-fresh", input.path)}`,
    recipeCuisine: "Malawian",
    recipeCategory: "Fish",
    totalTime: minutes > 0 ? `PT${minutes}M` : undefined,
    recipeIngredient: input.ingredients,
    recipeInstructions: input.steps.map((step) => ({ "@type": "HowToStep", text: step })),
  };
};

export const SEO = ({
  title,
  description,
  path,
  image,
  type = "website",
  brand = "sb",
  jsonLd,
}: SEOProps) => {
  const location = useLocation();
  const meta = BRAND_META[brand] ?? BRAND_META.sb;
  const icons = BRAND_ICONS[brand] ?? BRAND_ICONS.sb;
  const iconKey = brand === "lake-fresh" ? "lf" : "sb";
  const resolvedImage = image ?? meta.image;
  const fullTitle = title.includes(meta.siteName) ? title : `${title} | ${meta.siteName}`;

  // LF pages often omit `path`. Derive a clean canonical from the current route
  // so every page does not collapse to the home page.
  const resolvedPath = path ?? canonicalPathFor(brand, location.pathname);
  const url = `${meta.siteUrl}${resolvedPath}`;

  const structuredData =
    brand === "lake-fresh" && type === "website"
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: meta.siteName,
          description,
          url,
          image: resolvedImage,
          areaServed: "Blantyre, Malawi",
          ...(LF_CONTACT.phone ? { telephone: LF_CONTACT.phone } : {}),
          ...(LF_CONTACT.email ? { email: LF_CONTACT.email } : {}),
          ...(LF_CONTACT.address
            ? { address: { "@type": "PostalAddress", streetAddress: LF_CONTACT.address, addressCountry: "MW" } }
            : {}),
        }
      : {
          "@context": "https://schema.org",
          "@type": type === "product" ? "Product" : "WebSite",
          name: title,
          description,
          url,
          ...(type === "product" ? { image: resolvedImage } : {}),
        };

  const extraSchemas = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean);
  const schemaForPage = extraSchemas.length > 0
    ? [structuredData, ...extraSchemas]
    : structuredData;

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
      <script type="application/ld+json">{JSON.stringify(schemaForPage)}</script>
    </Helmet>
  );
};

export const defaultSEO = {
  home: {
    title: "SB | Your Style. Your Everyday.",
    description: DEFAULT_DESC,
  },
  shop: {
    title: "Shop Clothing | SB",
    description:
      "Shop SB streetwear clothing in Malawi. Find quality tees, vests, shirts, and shorts made for comfort, lifestyle, and everyday wear.",
  },
  combos: {
    title: "Bundles & Looks | SB",
    description:
      "Build a complete look with curated SB bundles and everyday style combinations.",
  },
  about: {
    title: "About SB | Streetwear for Everyday Life",
    description:
      "SB makes everyday streetwear simple. We focus on quality tees, vests, shirts, and shorts designed for comfort, lifestyle, and convenience in Malawi.",
  },
  contact: {
    title: "Contact SB | Support & Store Info",
    description:
      "Need help with sizing, stock, orders, or delivery? Contact SB on WhatsApp or visit us in Blantyre, Malawi.",
  },
  auth: {
    title: "Account | SB",
    description: "Sign in to manage your account, track orders, and shop faster at SB.",
  },
  checkout: {
    title: "Checkout | SB",
    description:
      "Complete your SB order securely with mobile money, card, or supported payment options. Delivery across Malawi.",
  },
  orders: {
    title: "My Orders | SB",
    description: "Track your SB orders and delivery updates.",
  },
  rewards: {
    title: "Rewards | SB",
    description:
      "Earn rewards on every SB purchase and redeem them for future orders.",
  },
  compare: {
    title: "Compare | SB",
    description: "Compare SB pieces side by side and find the right fit for your style.",
  },
  faq: {
    title: "FAQ | SB",
    description:
      "Answers about ordering, delivery, sizing, payments, returns, and support at SB.",
  },
  terms: {
    title: "Terms & Conditions | SB",
    description: "The terms and conditions that apply when you shop with SB.",
  },
  privacy: {
    title: "Privacy Policy | SB",
    description: "How SB collects, uses, and protects your personal information.",
  },
  returns: {
    title: "Returns & Exchanges | SB",
    description:
      "SB returns and exchange policy. Learn how to request an exchange or return eligible items.",
  },
  warranty: {
    title: "Quality Cover | SB",
    description:
      "SB quality cover for eligible product faults. We support repairs, replacements, or refunds where applicable.",
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
  giftPacks: {
    title: "Gift Packs | SB",
    description:
      "Gift curated style from SB with a personal message and delivery options.",
  },
  scheduledGift: {
    title: "Schedule a Gift | SB",
    description:
      "Send an SB gift for any occasion. Add a personal message and choose the delivery date.",
  },
};
