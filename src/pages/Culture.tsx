import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

const VALID_PILLARS = ["music", "sports", "faith", "hustle"] as const;
type Pillar = typeof VALID_PILLARS[number];

const PILLAR_INFO: Record<Pillar, { name: string; description: string; color: string; bg: string }> = {
  music: {
    name: "Music Culture",
    description: "From Blantyre beats to global sound. The rhythm that moves us.",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  sports: {
    name: "Sports Culture",
    description: "Game day energy. The grind that builds champions.",
    color: "text-green-700",
    bg: "bg-green-50",
  },
  faith: {
    name: "Faith Culture",
    description: "Rooted in purpose. Faith is the foundation.",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  hustle: {
    name: "Hustle Culture",
    description: "Built from nothing. Every piece tells the come-up story.",
    color: "text-red-700",
    bg: "bg-red-50",
  },
};

const PILLAR_BADGE_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
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
  images: string[];
  category: string;
  culture_pillar: string | null;
  brand: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
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
      navigate("/shop");
      return;
    }

    const fetchData = async () => {
      const [storiesResult, productsResult] = await Promise.all([
        supabase
          .from("culture_stories")
          .select("id, title, slug, excerpt, hero_image, culture_pillar, author_name, read_time_minutes, published_at")
          .eq("culture_pillar", validPillar)
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .eq("culture_pillar", validPillar)
          .eq("is_active", true)
          .order("is_featured", { ascending: false }),
      ]);

      setStories(storiesResult.data || []);
      setProducts(productsResult.data || []);
      setLoading(false);
    };

    setLoading(true);
    fetchData();
  }, [validPillar, navigate]);

  if (!validPillar) return null;

  const info = PILLAR_INFO[validPillar];

  return (
    <>
      <SEO title={`${info.name} | Streetwear Blantyre`} description={info.description} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className={`${info.bg} py-16 sm:py-24`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Link to="/editorial" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium mb-8">
              <ArrowLeft className="h-4 w-4" />
              The Culture Edit
            </Link>
            <h1 className={`font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight ${info.color}`}>{info.name}</h1>
            <p className="text-gray-600 text-lg mt-4 max-w-xl">{info.description}</p>
            <div className="flex gap-6 mt-8 text-sm text-gray-500">
              <span>{stories.length} stor{stories.length !== 1 ? "ies" : "y"}</span>
              <span>{products.length} piece{products.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          {/* Stories Section */}
          {stories.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display font-bold text-2xl mb-8">Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/editorial/${story.slug}`}
                    className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {story.hero_image ? (
                        <img src={story.hero_image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-300 font-display text-3xl font-bold">{story.title[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-gray-700 transition-colors">{story.title}</h3>
                      {story.excerpt && <p className="text-gray-500 text-sm line-clamp-2 mb-3">{story.excerpt}</p>}
                      <div className="flex items-center gap-3 text-gray-400 text-xs">
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
              <h2 className="font-display font-bold text-2xl mb-8">Culture Pieces</h2>
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
              <p className="text-gray-400 text-lg">Nothing here yet.</p>
              <p className="text-gray-300 text-sm mt-2">The culture is building. Check back soon.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-3 border-gray-900 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Culture;
