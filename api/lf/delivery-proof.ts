// Vercel Serverless Function — short-lived signed URL for a delivered order photo.
// Access is verified by Supabase using the order owner, a Lake Fresh staff
// session, or the private guest token. The bucket itself stays private.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const PROOF_BUCKET = "lf-delivery-proof";
const PROOF_PATH = /^lf\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;
const UUID = /^[0-9a-f-]{36}$/i;

interface VercelRequest {
  method?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader?: (name: string, value: string) => VercelResponse;
}

const value = (source: Record<string, unknown> | undefined, key: string) => {
  const raw = source?.[key];
  return typeof raw === "string" ? raw : "";
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader?.("Cache-Control", "no-store");

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server configuration is missing" });
  }

  const source = req.method === "GET" ? req.query : req.body;
  const orderId = value(source, "order_id");
  const accessToken = value(source, "access_token");

  if (!UUID.test(orderId)) {
    return res.status(400).json({ error: "A valid order is required" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("lf_public_order_proof", {
    p_order_id: orderId,
    p_access_token: accessToken || null,
  });
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const result = data as { ok?: boolean; reason?: string; proof_path?: string } | null;
  if (!result?.ok || !result.proof_path) {
    const status = result?.reason === "not_found" ? 404 : 403;
    return res.status(status).json({ error: result?.reason || "unauthorized" });
  }

  if (!PROOF_PATH.test(result.proof_path)) {
    return res.status(500).json({ error: "Invalid proof path" });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(result.proof_path, 60);
  if (signError) {
    return res.status(500).json({ error: signError.message });
  }

  return res.status(200).json({ url: signed.signedUrl, expires_in: 60 });
}
