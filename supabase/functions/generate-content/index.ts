import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `You are a world-class brand copywriter for Streetwear Blantyre, an identity expression brand from Malawi. Follow the brand guidelines exactly. Return only the requested content — no quotes, no labels, no explanations, no markdown formatting around the output.`;

// Model fallback chain — each model has its own rate limit pool on the free tier
// gemini-2.0-flash is primary; flash-lite is fallback with separate quota
const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

/**
 * Call Gemini API with model fallback and per-model retry.
 * Tries each model in order; if one hits rate limits, falls to the next.
 * Also supports GEMINI_API_KEY_FALLBACK as a secondary key for additional quota.
 */
async function callGemini(prompt: string, apiKey: string, fallbackKey?: string): Promise<string> {
  // Collect keys to try: primary first, then fallback if available
  const keysToTry = fallbackKey ? [apiKey, fallbackKey] : [apiKey];
  const lastError: string[] = [];

  for (const key of keysToTry) {
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            if (content) return content;

            console.error(`Empty Gemini response (${model} key ${keysToTry.indexOf(key)}):`, JSON.stringify(data));
            throw new Error("AI returned empty content");
          }

          const status = response.status;
          const errorBody = await response.text();
          console.error(`Gemini error (${model} attempt ${attempt + 1}):`, status, errorBody);

          // 429 = rate limited → skip remaining retries for this model, try next
          if (status === 429) {
            lastError.push(`${model}: rate limited`);
            break;
          }

          // Server error (5xx) → retry this model (transient)
          if (status >= 500 && attempt < 1) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          // Other errors (4xx, etc.) → fatal for all models
          throw new Error(`AI service error (${model}): ${status}`);
        } catch (err) {
          if (err instanceof Error && err.message === "AI returned empty content") throw err;
          if (err instanceof Error && err.message.startsWith("AI service error")) throw err;
          // Network/connection errors → retry this model
          if (attempt < 1) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          lastError.push(`${model}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }
  }

  throw new Error(`All AI models exhausted: ${lastError.join("; ")}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured. Add it in Supabase Dashboard → Settings → Edge Functions → Secrets, or run: supabase secrets set GEMINI_API_KEY=your-key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional secondary key for additional quota — tried after the primary key
    const fallbackKey = Deno.env.get("GEMINI_API_KEY_FALLBACK") || undefined;

    const content = await callGemini(prompt, apiKey, fallbackKey);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Function error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
