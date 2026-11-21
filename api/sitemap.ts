// Host aware sitemap. Lake Fresh gets clean root URLs; Streetwear keeps its own.
// No browser environment variables or secret values are used here.

import { createClient } from "@supabase/supabase-js";

const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";
const SB_BRAND_ID = "11111111-1111-1111-1111-111111111111";

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader?: (name: string, value: string) => VercelResponse;
  send?: (body: string) => VercelResponse;
  json?: (data: unknown) => VercelResponse;
}

const header = (req: VercelRequest, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const LF_STATIC = [
  "/",
  "/fish",
  "/spices",
  "/recipes",
  "/reviews",
  "/pro",
  "/loyalty",
  "/subscribe",
  "/support",
  "/privacy",
  "/terms",
  "/refund",
];

const SB_STATIC = [
  "/",
  "/shop",
  "/combos",
  "/culture",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/returns",
  "/warranty",
  "/lookbook",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json?.({ error: "Method not allowed" }) as VercelResponse;
  }

  const host = String(header(req, "host") || "").toLowerCase();
  const forcedLf = String(req.query?.brand || "") === "lf";
  const isLf = forcedLf || host.includes("lakefresh") || header(req, "x-brand-site") === "lf";
  const origin = isLf ? "https://lakefreshmw.com" : "https://www.wearsb.com";
  const paths = [...(isLf ? LF_STATIC : SB_STATIC)];
  const today = new Date().toISOString().slice(0, 10);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    if (isLf) {
      const [fish, spices, recipes] = await Promise.all([
        supabase.from("fish_products").select("id").eq("brand_id", LF_BRAND_ID).eq("is_active", true).limit(1000),
        supabase.from("lf_spices").select("id").eq("brand_id", LF_BRAND_ID).eq("is_active", true).limit(1000),
        supabase.from("lf_recipes").select("slug").eq("brand_id", LF_BRAND_ID).eq("is_active", true).limit(1000),
      ]);
      for (const row of fish.data || []) paths.push(`/fish/${row.id}`);
      for (const row of spices.data || []) paths.push(`/spices/${row.id}`);
      for (const row of recipes.data || []) paths.push(`/recipes/${row.slug}`);
    } else {
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("brand_id", SB_BRAND_ID)
        .eq("is_active", true)
        .limit(1000);
      for (const row of products || []) paths.push(`/product/${row.id}`);
    }
  }

  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniquePaths
    .map(
      (path) =>
        `  <url><loc>${escapeXml(`${origin}${path}`)}</loc><lastmod>${today}</lastmod></url>`,
    )
    .join("\n")}\n</urlset>\n`;

  res.setHeader?.("Content-Type", "application/xml; charset=utf-8");
  res.setHeader?.("Cache-Control", "public, max-age=0, s-maxage=3600");
  return res.status(200).send?.(xml) as VercelResponse;
}
