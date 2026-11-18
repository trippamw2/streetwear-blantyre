import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

type LakeFreshImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  onError?: () => void;
};

/**
 * Product photo with a calm placeholder when one image URL fails.
 * Used outside the gallery on cards, recipes, basket and admin previews.
 */
const LakeFreshImage = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  onError,
}: LakeFreshImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#EAF6FB] text-[#08A9E8] ${className}`}
        role="img"
        aria-label={`${alt} photo unavailable`}
      >
        <ImageIcon className="h-8 w-8 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
};

export default LakeFreshImage;
