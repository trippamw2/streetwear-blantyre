// Brand aware AI message drafting for the admin communications centre.
// Falls back to a hand written template when no AI key is configured, so the
// screen still works in every environment.

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GEMINI_API_KEY_FALLBACK;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://qhpemjwrnnuqhfgifxnh.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

interface VercelRequest {
  method?: string;
  body: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  end: () => VercelResponse;
}

type BrandKey = "sb" | "lf";

const BRAND = {
  sb: {
    name: "Streetwear Blantyre",
    tagline: "Wear Your Identity",
    voice: "bold, confident, rooted in Malawian street culture",
    catalogue: "T shirts, football jerseys and short sleeve shirts",
    location: "Blantyre, Malawi",
    delivery: "Same day in Blantyre, 1 to 3 days elsewhere in Malawi",
  },
  lf: {
    name: "Lake Fresh Fish Mart",
    tagline: "Fresh from the Lake. Ready for Your Table.",
    voice: "warm, simple, trustworthy and food focused",
    catalogue: "fresh Chambo, Ncheni and Usipa, five fish seasonings and free recipes",
    location: "Blantyre, Malawi",
    delivery: "Next day delivery with a daily cut off",
  },
} as const;

const pickBrand = (value: unknown): BrandKey => (String(value || "").toLowerCase().includes("lf") || String(value || "").toLowerCase().includes("lake") ? "lf" : "sb");

const clean = (value: unknown, max = 400) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";
const SB_BRAND_ID = "11111111-1111-1111-1111-111111111111";

/** Only signed in admins (global or staff for the requested brand) may draft. */
const requireAdmin = async (req: VercelRequest, brand: BrandKey): Promise<{ ok: boolean; reason?: string; userId?: string }> => {
  const headers = req.headers || {};
  const authHeader = Array.isArray(headers.authorization) ? headers.authorization[0] : headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return { ok: false, reason: "sign_in_required" };

  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY) {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!authRes.ok) return { ok: false, reason: "unauthorized" };
    const authUser = (await authRes.json()) as { id?: string; user_metadata?: { role?: string }; app_metadata?: { role?: string } };

    const metaRole =
      String(authUser?.user_metadata?.role || "").toLowerCase() || String(authUser?.app_metadata?.role || "").toLowerCase();
    if (["admin", "super_admin", "owner"].includes(metaRole)) {
      return { ok: true, userId: authUser.id };
    }

    const rolesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${authUser.id ?? ""}`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } },
    );
    const roles: Array<{ role: string }> = rolesRes.ok ? ((await rolesRes.json()) as Array<{ role: string }>) : [];
    const role = roles[0]?.role;
    if (["admin", "super_admin", "owner"].includes(String(role || "").toLowerCase())) {
      return { ok: true, userId: authUser.id };
    }

    const staffBrand = brand === "lf" ? LF_BRAND_ID : SB_BRAND_ID;
    const permsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/staff_permissions?select=brand_id&user_id=eq.${authUser.id ?? ""}&brand_id=eq.${staffBrand}`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } },
    );
    const perms: Array<{ brand_id: string }> = permsRes.ok ? ((await permsRes.json()) as Array<{ brand_id: string }>) : [];
    if (perms.length > 0) {
      return { ok: true, userId: authUser.id };
    }

    return { ok: false, reason: "no_admin_access" };
  }

  return { ok: false, reason: "auth_unavailable" };
};

const template = (brand: BrandKey, channel: string, audience: string, topic: string) => {
  const b = BRAND[brand];
  const subject =
    brand === "lf"
      ? topic || "Fresh fish for your next meal"
      : topic || "New drops from Streetwear Blantyre";

  if (channel === "whatsapp") {
    return {
      subject,
      body: `Hi there,\n\n${topic || `Fresh stock is ready at ${b.name}`}.\n\nBrowse ${b.catalogue}. ${b.delivery}.\n\nReply here if you need a hand choosing.\n\n${b.name}`,
    };
  }

  const audienceLine =
    audience === "loyalty_members"
      ? "As one of our rewards members, you get first look."
      : audience === "recent_buyers"
        ? "Thank you for your recent order. Here is something we think you will like."
        : audience === "pro_accounts"
          ? "A note for our business customers."
          : `Here is what is fresh at ${b.name}.`;

  return {
    subject,
    body: `Hi there,\n\n${audienceLine}\n\n${topic || `Our shelves are stocked with ${b.catalogue}.`}\n\n${b.delivery}. ${b.location}.\n\nOrder online any time, or reply to this email and our team will help.\n\n${b.name}\n${b.tagline}`,
  };
};

async function draftWithGemini(brand: BrandKey, channel: string, audience: string, topic: string) {
  const b = BRAND[brand];
  const prompt = `Write a ${channel === "whatsapp" ? "WhatsApp message" : "marketing email"} for ${b.name} (${b.tagline}).
Brand voice: ${b.voice}.
What we sell: ${b.catalogue}.
Delivery: ${b.delivery}.
Audience: ${audience.replace(/_/g, " ")}.
Topic: ${topic || "a friendly update about fresh stock"}.

Rules:
- Never mention the other brand. Never use hyphens or dashes in words.
- Keep it under 170 words.
- Plain text only, no markdown.
- Start with a subject line in the form "Subject: ...".
- Then a blank line, then the message body.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
    },
  );

  if (!response.ok) throw new Error(`AI request failed with ${response.status}`);

  const data = await response.json();
  const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  if (!text) throw new Error("AI returned an empty draft");

  const match = text.match(/^\s*subject\s*:\s*(.+)$/im);
  const subject = match ? match[1].trim() : "";
  const body = match ? text.replace(match[0], "").trim() : text;

  return { subject: subject || topic, body };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Origin", req.headers?.origin && !String(req.headers?.origin).includes("null") ? String(req.headers?.origin) : "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const brand = pickBrand(req.body.brand);
  const channel = clean(req.body.channel, 20) === "whatsapp" ? "whatsapp" : "email";
  const audience = clean(req.body.audience, 40) || "all_customers";
  const topic = clean(req.body.topic, 300);

  const auth = await requireAdmin(req, brand);
  if (!auth.ok) {
    return res.status(401).json({ error: "Admin sign in required", reason: auth.reason });
  }

  if (GEMINI_KEY) {
    try {
      const draft = await draftWithGemini(brand, channel, audience, topic);
      return res.status(200).json({ ...draft, source: "ai" });
    } catch (error) {
      console.error("[AI message] falling back to template:", error);
    }
  }

  return res.status(200).json({ ...template(brand, channel, audience, topic), source: "template" });
}
