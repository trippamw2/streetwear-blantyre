import { cn } from "@/lib/utils";

/* ─── Base shimmer ─── */
const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-gray-100",
      className,
    )}
  />
);

/* ─── ProductCard skeleton (matches ProductCard layout) ─── */
export const ProductCardSkeleton = () => (
  <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-100 overflow-hidden">
    {/* Image area */}
    <Shimmer className="aspect-[4/3] w-full rounded-none" />
    {/* Content */}
    <div className="p-3 sm:p-4 space-y-3">
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Shimmer className="h-6 w-14 rounded-full" />
        <Shimmer className="h-6 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Shimmer className="h-6 w-20" />
        <Shimmer className="h-4 w-16" />
      </div>
      <Shimmer className="h-9 w-full rounded-lg" />
    </div>
  </div>
);

/* ─── KitCard skeleton (matches KitCard layout) ─── */
export const KitCardSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-100 overflow-hidden">
    <Shimmer className={`w-full rounded-none ${compact ? "aspect-[4/3] max-h-[240px]" : "aspect-[4/3] max-h-[320px]"}`} />
    <div className="p-4 sm:p-5 space-y-3">
      <Shimmer className="h-4 w-20" />
      <Shimmer className="h-5 w-3/4" />
      <Shimmer className="h-4 w-1/2" />
      {!compact && <Shimmer className="h-3 w-full" />}
      <div className="space-y-1.5">
        <Shimmer className="h-3 w-12" />
        <div className="flex items-center gap-2">
          <Shimmer className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
          <Shimmer className="h-3 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
          <Shimmer className="h-3 flex-1" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <Shimmer className="h-5 w-24" />
          <Shimmer className="h-3 w-20 mt-1" />
        </div>
      </div>
      <Shimmer className="h-3 w-32" />
    </div>
  </div>
);

/* ─── Simple page skeleton ─── */
export const PageSkeleton = () => (
  <div className="container py-8 sm:py-12 space-y-6">
    <Shimmer className="h-8 w-64" />
    <Shimmer className="h-4 w-96" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/* ─── Product Detail skeleton ─── */
export const ProductDetailSkeleton = () => (
  <div className="container py-10 sm:py-14 space-y-8">
    <Shimmer className="h-4 w-24" />
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Shimmer className="aspect-square w-full rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="w-20 h-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-8 w-full" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-10 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Shimmer key={i} className="h-5 w-32" />
          ))}
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-12 w-32 rounded-lg" />
          <Shimmer className="h-12 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);
