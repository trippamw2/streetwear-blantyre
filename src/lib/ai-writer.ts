import { supabase } from "@/integrations/supabase/client";
import { CONTENT_PROMPTS, type ContentKeyType } from "./ai-prompts";

/**
 * Fill template variables in a prompt string.
 * Replaces {name}, {category}, {pillar}, etc. with actual values.
 */
function fillPrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value || "Not specified");
  }
  return result;
}

/**
 * Generate content using the Supabase Edge Function.
 * Falls back gracefully if the edge function is not deployed.
 */
export async function generateAIContent(
  contentType: ContentKeyType,
  variables: Record<string, string>
): Promise<string> {
  const promptConfig = CONTENT_PROMPTS[contentType];
  if (!promptConfig) throw new Error(`Unknown content type: ${contentType}`);

  const filledPrompt = fillPrompt(promptConfig.prompt, variables);

  try {
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: { prompt: filledPrompt },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "AI generation failed");
    }

    return data?.content || "";
  } catch (err: any) {
    // If edge function not deployed, give clear error
    if (err?.message?.includes("Failed to fetch") || err?.statusCode === 404) {
      throw new Error(
        "AI function not deployed yet. Deploy it with: supabase functions deploy generate-content"
      );
    }
    throw err;
  }
}
