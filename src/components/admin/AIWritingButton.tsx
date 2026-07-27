import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAIContent } from "@/lib/ai-writer";
import { CONTENT_PROMPTS, type ContentKeyType } from "@/lib/ai-prompts";
import { toast } from "@/hooks/use-toast";

interface AIWritingButtonProps {
  /** Which content types this button can generate */
  contentTypes: ContentKeyType[];
  /** Current form values to pass as context to the AI */
  variables: Record<string, string>;
  /** Callback when content is generated — receives the content type key and generated text */
  onGenerated: (contentType: ContentKeyType, content: string) => void;
  /** Optional: size variant */
  size?: "sm" | "default";
  /** Optional: additional CSS classes */
  className?: string;
}

export function AIWritingButton({
  contentTypes,
  variables,
  onGenerated,
  size = "sm",
  className = "",
}: AIWritingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState<ContentKeyType | null>(null);

  const handleGenerate = async (type: ContentKeyType) => {
    setGenerating(type);
    setIsOpen(false);

    try {
      const content = await generateAIContent(type, variables);
      if (content) {
        onGenerated(type, content);
        toast({
          title: "Content generated",
          description: `${CONTENT_PROMPTS[type].label} written by AI. Review and edit as needed.`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const isGenerating = generating !== null;

  return (
    <div className={`relative inline-flex ${className}`}>
      {contentTypes.length === 1 ? (
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={() => handleGenerate(contentTypes[0])}
          disabled={isGenerating}
          className="gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isGenerating ? "Writing..." : "AI Write"}
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size={size}
            onClick={() => setIsOpen(!isOpen)}
            disabled={isGenerating}
            className="gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 rounded-r-none"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "Writing..." : "AI Write"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size={size}
            onClick={() => setIsOpen(!isOpen)}
            disabled={isGenerating}
            className="gap-0 px-1.5 border-l-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 rounded-r-md"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 min-w-[200px]">
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleGenerate(type)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    {CONTENT_PROMPTS[type].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
