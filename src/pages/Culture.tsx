import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

const VALID_PILLARS = ["music", "sports", "faith", "hustle", "street", "hip-hop"] as const;
type Pillar = typeof VALID_PILLARS[number];

const CULTURE_INFO = {
  name: "Hip Hop & Street Lifestyle",
  description: "The sound, the style, the movement. Streetwear built for people who live the culture.",
  color: "text-white",
  bg: "bg-gray-950",
};

interface CultureStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_image: string | null;
  culture_pillar: string;
  author_name: string;
  read_time_minutes: number;
  published_at: string | null;
}

interface Product {
  id: string;
  name: string;
  benefit: string;
  price: number;
  image: string;
  gallery_images: string[];
  category: string;
  culture_pillar: string | null;
  culture_pillar_color?: string;
  brand: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_on_sale?: boolean;
  discount_percent?: number;
  types: { id: string; name: string }[];
  stock?: number;
  rating?: number;
}

const Culture = () => {
  const { pillar } = useParams<{ pillar: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<CultureStory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const validPillar = VALID_PILLARS.includes(pillar as Pillar) ? (pillar as Pillar) : null;

  useEffect(() => {
    if (!validPillar) {
      navigate("/editorial");
      return;
    }

    const fetchData = async () => {
      const [storiesResult, productsResult] = await Promise.all([
        supabase
          .from("culture_stories")
          .select("id, title, slug, excerpt, hero_image, culture_pillar, author_name, read_time_minutes, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false }),
      ]);

      setStories(storiesResult.data || []);
      setProducts((productsResult.data || []).map((p: any) => ({
        ...p,
        types: p.types || [],
        gallery_images: p.gallery_images || [],
        is_on_sale: p.is_on_sale || false,
        discount_percent: p.discount_percent || 0,
        culture_pillar_color: p.culture_pillar_color || "",
        rating: p.rating || 0,
        stock: p.stock_quantity ?? 10,
      })));
      setLoading(false);
    };

    setLoading(true);
    fetchData();
  }, [validPillar, navigate]);

  if (!validPillar) return null;

  const info = CULTURE_INFO;

  return (
    <>
      <SEO title={`${info.name} | Wear What Speaks`} description={info.description} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className={`${info.bg} py-16 sm:py-24`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Link to="/editorial" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium mb-8">
              <ArrowLeft className="h-4 w-4" />
              The Culture Journal
            </Link>
            <h1 className={`font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight ${info.color}`}>{info.name}</h1>
            <p className="text-white/75 text-lg mt-4 max-w-xl">
              Hip Hop is more than music. It is how you move, how you dress and how you show up. Find pieces that match your voice.
            </p>
            <div className="flex gap-6 mt-8 text-sm text-white/70">
              <span>{stories.length} stor{stories.length !== 1 ? "ies" : "y"}</span>
              <span>{products.length} piece{products.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          {/* Stories Section */}
          {stories.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display font-bold text-2xl mb-8 text-gray-900">Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/editorial/${story.slug}`}
                    className="group rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 bg-gray-100"
                  >
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {story.hero_image ? (
                        <img src={story.hero_image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                          <span className="text-gray-900/20 font-display text-3xl font-bold">{story.title[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg mb-2 text-gray-900 group-hover:text-gray-200 transition-colors">{story.title}</h3>
                      {story.excerpt && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{story.excerpt}</p>}
                      <div className="flex items-center gap-3 text-gray-600 text-xs">
                        <span>{story.author_name}</span>
                        {story.published_at && <span>{format(new Date(story.published_at), "MMM d, yyyy")}</span>}
                        <span>{story.read_time_minutes} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Products Section */}
          {products.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-2xl mb-8 text-gray-900">Shop All</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && stories.length === 0 && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">Nothing here yet.</p>
              <p className="text-sm mt-2 italic text-gray-600">New stories are on the way. Check back soon.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Culture;
