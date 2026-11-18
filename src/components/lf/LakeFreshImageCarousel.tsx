import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import LakeFreshImage from "@/components/lf/LakeFreshImage";

type LakeFreshImageCarouselProps = {
  images: string[];
  alt: string;
  coverOnly?: boolean;
  className?: string;
  imageClassName?: string;
};

/**
 * Product photo viewer. Cards pass coverOnly so they keep the calm, single
 * image look. Product pages use the full viewer with arrows, dots and thumbs.
 */
const LakeFreshImageCarousel = ({
  images,
  alt,
  coverOnly = false,
  className = "",
  imageClassName = "",
}: LakeFreshImageCarouselProps) => {
  const [active, setActive] = useState(0);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const imagesKey = images.join("|");
  const visibleImages = images.filter((image) => !failedSources.includes(image));
  const photo = visibleImages[active] ?? visibleImages[0] ?? null;
  const visibleIndex = visibleImages.length > 0 ? Math.min(active, visibleImages.length - 1) : 0;
  const canMove = visibleImages.length > 1;

  useEffect(() => {
    setActive(0);
    setFailedSources([]);
  }, [imagesKey]);

  useEffect(() => {
    if (active > visibleImages.length - 1) {
      setActive(Math.max(visibleImages.length - 1, 0));
    }
  }, [imagesKey, visibleImages.length, active]);

  const markFailed = (source: string) => {
    setFailedSources((current) => (current.includes(source) ? current : [...current, source]));
  };

  const move = (step: number) => {
    if (!canMove) return;
    setActive((current) => (current + step + visibleImages.length) % visibleImages.length);
  };

  if (coverOnly) {
    if (!photo) {
      return (
        <div className={`flex items-center justify-center bg-[#EAF6FB] text-[#08A9E8] ${className}`}>
          <ImageIcon className="h-10 w-10 opacity-60" aria-hidden="true" />
        </div>
      );
    }
    return (
      <LakeFreshImage
        src={photo}
        alt={alt}
        className={`h-full w-full object-cover ${imageClassName}`}
        onError={() => markFailed(photo)}
      />
    );
  }

  return (
    <div className={`w-full min-w-0 overflow-hidden rounded-2xl border border-[#EAF6FB] bg-white ${className}`}>
      <div className="relative flex aspect-square items-center justify-center bg-[#F4FBF7] sm:aspect-[4/3]">
        {photo ? (
          <LakeFreshImage
            key={photo}
            src={photo}
            alt={`${alt}, photo ${visibleIndex + 1}`}
            loading="eager"
            className={`h-full w-full object-contain ${imageClassName}`}
            onError={() => markFailed(photo)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#08A9E8]">
            <ImageIcon className="h-12 w-12 opacity-60" aria-hidden="true" />
            <p className="text-xs font-bold text-[#073B78]/60">Photos coming soon</p>
          </div>
        )}

        {canMove ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#073B78] shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#073B78] shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-[#073B78]/85 px-2.5 py-1 text-[10px] font-bold text-white">
              {visibleIndex + 1} / {visibleImages.length}
            </span>
          </>
        ) : null}
      </div>

      {canMove ? (
        <div className="border-t border-[#EAF6FB] p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#F4FBF7] transition ${
                  index === visibleIndex ? "border-[#39B54A]" : "border-transparent opacity-70"
                }`}
              >
                <LakeFreshImage
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => markFailed(image)}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {visibleImages.map((image, index) => (
              <button
                key={`dot-${image}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Go to photo ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === visibleIndex ? "w-5 bg-[#39B54A]" : "w-1.5 bg-[#073B78]/20"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LakeFreshImageCarousel;
