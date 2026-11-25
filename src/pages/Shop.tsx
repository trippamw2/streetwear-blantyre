import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { culturePillars } from "@/data/products";
import { SB_PRODUCT_TYPES } from "@/data/sbArchitecture";
import { useProducts } from "@/hooks/useProducts";
import { useSbSubcategories } from "@/hooks/useSbSubcategories";
import { useWearableCategories } from "@/hooks/useWearableCategories";
import { ProductCard } from "@/components/ProductCard";
import { PromotionSlider } from "@/components/PromotionSlider";
import { SEO, defaultSEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { Search, X, SlidersHorizontal, ArrowUpDown, ChevronRight, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRODUCTS_PER_PAGE = 12;

const styleSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useWearableCategories();
  const { subcategories, loading: subcategoriesLoading } = useSbSubcategories();
  const loading = productsLoading || categoriesLoading || subcategoriesLoading;

  const categoryParam = searchParams.get("category") || "all";
  const styleParam = searchParams.get("style") || "";
  const qParam = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedStyle, setSelectedStyle] = useState(styleParam);
  const [selectedCulture, setSelectedCulture] = useState(searchParams.get("culture") || "");
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [sortBy, setSortBy] = useState<"newest" | "best" | "price-low" | "price-high" | "name">(
    searchParams.get("sort") === "best" ? "best" : "newest",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000000);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  // Keep filters in sync with header/category links and navbar search.
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedStyle(styleParam);
  }, [styleParam]);

  useEffect(() => {
    setSearchQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedStyle, selectedCulture, searchQuery, selectedBrands, selectedSize, inStockOnly, priceMin, priceMax, sortBy]);

  const categoryName =
    selectedCategory === "all"
      ? null
      : categories.find((c) => c.slug === selectedCategory)?.name ||
        selectedCategory.replace(/-/g, " ");
  const selectedType = SB_PRODUCT_TYPES.find((type) => type.slug === selectedCategory);
  const visibleSubcategories =
    selectedCategory === "all"
      ? subcategories
      : subcategories.filter((sub) => sub.productTypeCode === selectedType?.code);

  const allSizes = useMemo(
    () =>
      [...new Set(products.flatMap((p) => (p.types || []).map((t) => t.name)))]
        .filter(Boolean)
        .sort(),
    [products],
  );

  const allBrands = useMemo(
    () =>
      [...new Set(products.map((p) => (p.brand || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const priceFloor = useMemo(
    () => (products.length ? Math.floor(Math.min(...products.map((p) => p.price)) / 1000) * 1000 : 0),
    [products],
  );
  const priceCeiling = useMemo(
    () => (products.length ? Math.ceil(Math.max(...products.map((p) => p.price)) / 1000) * 1000 : 1000000),
    [products],
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStyle = !selectedStyle || styleSlug(p.subcategory || "") === selectedStyle;
    const matchesCulture = !selectedCulture || p.culture_pillar === selectedCulture;
    const haystack = `${p.name} ${p.benefit} ${p.brand || ""}`.toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes((p.brand || "").trim());
    const matchesPrice = p.price >= priceMin && p.price <= priceMax;
    const matchesStock = !inStockOnly || (p.stock ?? 0) > 0;
    const matchesSize = selectedSize === "all" || (p.types || []).some((t) => t.name === selectedSize);
    return matchesCategory && matchesStyle && matchesCulture && matchesSearch && matchesBrand && matchesPrice && matchesStock && matchesSize;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "best":
        return (
          Number(Boolean(b.is_best_seller)) - Number(Boolean(a.is_best_seller)) ||
          Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
          a.name.localeCompare(b.name)
        );
      default:
        return Number(Boolean(b.is_new_arrival)) - Number(Boolean(a.is_new_arrival)) || a.name.localeCompare(b.name);
    }
  });

  const visibleProducts = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedStyle ? 1 : 0) +
    (selectedCulture ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (selectedBrands.length ? 1 : 0) +
    (selectedSize !== "all" ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (priceMin > priceFloor || priceMax < priceCeiling ? 1 : 0);

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (categoryName) {
    activeFilters.push({
      label: categoryName,
      clear: () => {
        setSelectedCategory("all");
        updateParam("category", "all");
      },
    });
  }
  if (selectedStyle) {
    activeFilters.push({
      label: subcategories.find((sub) => sub.slug === selectedStyle)?.name || selectedStyle,
      clear: () => {
        setSelectedStyle("");
        updateParam("style", "");
      },
    });
  }
  if (selectedCulture) {
    activeFilters.push({
      label: culturePillars.find((pillar) => pillar.id === selectedCulture)?.label || selectedCulture,
      clear: () => {
        setSelectedCulture("");
        updateParam("culture", "");
      },
    });
  }
  if (searchQuery) {
    activeFilters.push({
      label: `Search: ${searchQuery}`,
      clear: () => {
        setSearchQuery("");
        updateParam("q", "");
      },
    });
  }
  selectedBrands.forEach((brand) => {
    activeFilters.push({
      label: brand,
      clear: () => setSelectedBrands((prev) => prev.filter((item) => item !== brand)),
    });
  });
  if (selectedSize !== "all") {
    activeFilters.push({
      label: `Size ${selectedSize}`,
      clear: () => setSelectedSize("all"),
    });
  }
  if (inStockOnly) {
    activeFilters.push({
      label: "In stock only",
      clear: () => setInStockOnly(false),
    });
  }
  if (priceMin > priceFloor || priceMax < priceCeiling) {
    activeFilters.push({
      label: `Price ${priceMin.toLocaleString("en-US")} to ${priceMax.toLocaleString("en-US")}`,
      clear: () => {
        setPriceMin(priceFloor);
        setPriceMax(priceCeiling);
      },
    });
  }

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStyle("");
    setSelectedCulture("");
    setSearchQuery("");
    setSelectedBrands([]);
    setSelectedSize("all");
    setInStockOnly(false);
    setPriceMin(priceFloor);
    setPriceMax(priceCeiling);
    setSearchParams({}, { replace: true });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="container py-8 sm:py-12">
          <PromotionSlider page="shop" className="mb-6" />
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <SEO {...defaultSEO.shop} />

      {/* PAGE HEADER */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container py-10 sm:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="eyebrow text-primary">{categoryName || "Shop all"}</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
                {categoryName || "Shop all"}
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">
                {selectedCategory === "all"
                  ? "Find tees, vests, shirts, and shorts you’ll love to wear."
                  : selectedType?.description || "Find your next favorite piece."}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-500">
              {sorted.length} {sorted.length === 1 ? "piece" : "pieces"} available
            </p>
          </div>

          <div className="mt-6">
            <PromotionSlider page="shop" />
          </div>
        </div>
      </section>

      <div className="container py-6 sm:py-10">
        {/* SEARCH + TOOLBAR */}
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search pieces, brands, styles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateParam("q", e.target.value);
              }}
              className="h-11 rounded-full border-gray-200 bg-gray-50 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateParam("q", "");
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-1 items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters((v) => !v)}
              className="h-11 gap-2 px-5"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className={`ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    showFilters ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="relative flex-1 sm:flex-none">
              <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort products"
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-gray-50 pl-10 pr-9 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none sm:w-auto"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-500" />
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600 hover:text-primary sm:inline-flex"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE FILTERS */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-600">
              Active filters
            </span>
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={filter.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
              >
                {filter.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-semibold text-gray-600 underline underline-offset-4 hover:text-primary"
            >
              Clear all
            </button>
          </div>
        )}

        {/* FILTER PANEL */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setShowFilters(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-gray-200 bg-white p-4 shadow-2xl sm:p-6 lg:static lg:z-20 lg:mb-6 lg:max-h-none lg:overflow-visible lg:rounded-2xl lg:bg-gray-50 lg:p-6 lg:shadow-sm lg:sticky lg:top-24">
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <h2 className="font-display text-lg font-bold text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5">
            <div>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900">Brand</h3>
              <div className="flex flex-wrap gap-2">
                {allBrands.length > 0 ? (
                  allBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        selectedBrands.includes(brand)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {brand}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-600">Brands appear as stock is added.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900">Size</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSize("all")}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    selectedSize === "all"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  All sizes
                </button>
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-900">
                Price (MWK)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={priceMin}
                  min={0}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                  placeholder="Min"
                  aria-label="Minimum price"
                  className="h-10 w-24 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-none"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="number"
                  value={priceMax}
                  min={0}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  placeholder="Max"
                  aria-label="Maximum price"
                  className="h-10 w-28 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-none"
                />
                {[
                  { label: "Under 20K", min: 0, max: 20000 },
                  { label: "20K to 40K", min: 20000, max: 40000 },
                  { label: "40K to 70K", min: 40000, max: 70000 },
                  { label: "70K+", min: 70000, max: 1000000 },
                ].map((range) => (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => {
                      setPriceMin(range.min);
                      setPriceMax(range.max);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      priceMin === range.min && priceMax === range.max
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-gray-200 bg-white px-3.5 py-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold text-gray-700">In stock only</span>
            </label>
              </div>
              <div className="mt-5 flex gap-3 lg:hidden">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear all</Button>
                <Button className="flex-1" onClick={() => setShowFilters(false)}>Show results</Button>
              </div>
            </div>
          </>
        )}

        {/* CATEGORY CHIPS */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              updateParam("category", "all");
            }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              selectedCategory === "all"
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategory(c.slug);
                updateParam("category", c.slug);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                selectedCategory === c.slug
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* STYLE CHIPS */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-600">Style</span>
          <button
            type="button"
            onClick={() => {
              setSelectedStyle("");
              updateParam("style", "");
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              selectedStyle === ""
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
            }`}
          >
            All styles
          </button>
          {visibleSubcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelectedStyle(sub.slug);
                updateParam("style", sub.slug);
              }}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                selectedStyle === sub.slug
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* VIBE CHIPS */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-600">Vibe</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCulture("");
              updateParam("culture", "");
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              selectedCulture === ""
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
            }`}
          >
            All vibes
          </button>
          {culturePillars.map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => {
                const next = selectedCulture === cp.id ? "" : cp.id;
                setSelectedCulture(next);
                updateParam("culture", next);
              }}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                selectedCulture === cp.id
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {cp.label}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        {sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {visibleProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center sm:mt-12">
                <Button onClick={() => setVisibleCount((v) => v + PRODUCTS_PER_PAGE)} variant="outline" size="lg">
                  Load more ({sorted.length - visibleCount} left)
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <Search className="mx-auto mb-4 h-9 w-9 text-primary" />
            <h2 className="font-display text-xl font-bold text-gray-900">No pieces match those filters</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              Try a different size, brand or price range. Your next favourite piece is close.
            </p>
            <Button onClick={clearFilters} className="mt-6" variant="hero">
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
