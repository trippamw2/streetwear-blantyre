import { useState } from "react";
import { Link } from "react-router-dom";
import { categories, Category, BRANDS } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { PromotionSlider } from "@/components/PromotionSlider";
import { SEO, defaultSEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { Search, X, Grid3X3, List, SlidersHorizontal, ArrowUpDown, ChevronRight, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PRODUCTS_PER_PAGE = 12;

const Shop = () => {
  const { products, loading, getProductsByCategory } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "name">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(200000);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Reset visible count when filters change
  const resetVisible = () => setVisibleCount(PRODUCTS_PER_PAGE);

  // Get products by category
  const categoryProducts = getProductsByCategory(selectedCategory);
  const productsToShow = categoryProducts.length > 0 ? categoryProducts : products;
  
  const minPrice = productsToShow.length > 0 ? Math.min(...productsToShow.map(p => p.price)) : 0;
  const maxPrice = productsToShow.length > 0 ? Math.max(...productsToShow.map(p => p.price)) : 100000;

  const filtered = productsToShow.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.benefit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes((p as any).brand?.toLowerCase() || "");
    const matchesPrice = p.price >= priceMin && p.price <= priceMax;
    return matchesCategory && matchesSearch && matchesBrand && matchesPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "name": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  // Products to show based on pagination
  const visibleProducts = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSelectedBrands([]);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(b => b !== brandId)
        : [...prev, brandId]
    );
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const handleCategoryChange = (cat: Category | "all") => {
    setSelectedCategory(cat);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
  };

  const hasFilters = selectedCategory !== "all" || searchQuery || selectedBrands.length > 0;

  if (loading) {
    return (
      <div className="container py-8 sm:py-12">
        <PromotionSlider page="shop" className="mb-6" />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-8 md:py-12">
      <SEO {...defaultSEO.shop} />
      <div className="mb-4 sm:mb-6">
        <PromotionSlider page="shop" />
      </div>

      <div className="max-w-3xl space-y-2 sm:space-y-3 mb-4 sm:mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight">Shop by Item</h1>
        <p className="text-gray-500 text-sm sm:text-base">Single items. Add to your setup one piece at a time.</p>
      </div>

      {/* Kit upsell banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 sm:p-7 mb-6 sm:mb-10 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-display font-bold text-base sm:text-lg">Get a Kit. Save 15-25%.</p>
            <p className="text-white/80 text-xs sm:text-sm">Same items. One box. Less cash.</p>
          </div>
          <Link to="/combos">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 px-5 py-2 h-auto rounded-full font-semibold text-xs sm:text-sm gap-1.5">
              See Kits <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1 max-w-sm sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PRODUCTS_PER_PAGE);
                }}
            className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 hover:text-gray-900" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {/* Filter Toggle - hidden on mobile, shows in drawer */}
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5 sm:gap-2 text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <SlidersHorizontal className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            <span className="hidden sm:inline">Filters</span>
            {selectedBrands.length > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.5 bg-white text-gray-900 rounded-full text-xs">{selectedBrands.length}</span>
            )}
          </Button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-3 sm:px-4 pr-8 sm:pr-10 py-1.5 sm:py-2 rounded-full border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-teal-500"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
              <option value="name">Name</option>
            </select>
            <ArrowUpDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Toggle - hidden on mobile */}
          <div className="hidden md:flex border border-gray-200 rounded-full overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "bg-white"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "bg-white"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6 space-y-3 sm:space-y-4">
              <div>
                <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Brand</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {BRANDS.slice(0, 10).map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrand(brand.id)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                        selectedBrands.includes(brand.id)
                          ? "bg-orange-500 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Price (MWK)</h3>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(Number(e.target.value))}
                    placeholder="Min"
                    className="w-16 sm:w-24 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm"
                  />
                  <span className="text-gray-400 text-xs sm:text-sm">-</span>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    placeholder="Max"
                    className="w-16 sm:w-24 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                  <button onClick={() => { setPriceMin(0); setPriceMax(10000); }} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">10K</button>
                  <button onClick={() => { setPriceMin(10000); setPriceMax(25000); }} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">25K</button>
                  <button onClick={() => { setPriceMin(25000); setPriceMax(50000); }} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">50K</button>
                  <button onClick={() => { setPriceMin(50000); setPriceMax(1000000); }} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">50K+</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-orange-500 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
          }`}
        >
          All
        </button>
        {categories.filter(c => c.id !== "all").map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === c.id
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {categories.find(c => c.id === selectedCategory)?.label}
              <button onClick={() => setSelectedCategory("all")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              "{searchQuery}"
              <button onClick={() => setSearchQuery("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-4 w-4" /> Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {visibleProducts.length} of {sorted.length} products
      </p>

      {/* Products Grid - minimal gaps on mobile */}
      {sorted.length > 0 ? (
        <>
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-5" 
            : "grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
          }>
            {visibleProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-6 sm:mt-10">
              <Button 
                onClick={loadMore} 
                variant="outline" 
                size="sm"
                className="px-6 sm:px-8 border-orange-500 text-orange-500 hover:bg-orange-50 text-sm"
              >
                Load More ({sorted.length - visibleCount} left)
                <ChevronRight className="ml-1.5 sm:ml-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 sm:py-20 space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-base sm:text-lg">No products found</p>
          <button onClick={clearFilters} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;