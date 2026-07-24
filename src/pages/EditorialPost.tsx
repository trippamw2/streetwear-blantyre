import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { formatMWK } from "@/data/products";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

interface CultureStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  hero_image: string | null;
  culture_pillar: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  author_name: string;
  read_time_minutes: number;
  published_at: string | null;
  created_at: string;
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

const PILLAR_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
};

const EditorialPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<CultureStory | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("culture_stories")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStory(data);

      if (data.culture_pillar) {
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("culture_pillar", data.culture_pillar)
          .eq("is_active", true)
          .limit(6);
        setRelatedProducts(products || []);
      }

      setLoading(false);
    };
    fetchStory();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Story not found</p>
          <Link to="/editorial" className="text-gray-900 font-medium hover:underline mt-2 inline-block">Back to Editorial</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={`${story.title} | Streetwear Blantyre`} description={story.excerpt || story.title} />

      <article className="min-h-screen bg-white">
        {/* Hero Image */}
        <div className="relative w-full h-[40vh] sm:h-[50vh] lg:h-[60vh] bg-gray-900">
          {story.hero_image ? (
            <img src={story.hero_image} alt={story.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-6 left-6">
            <Link to="/editorial" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              Back to Editorial
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-6">
              {story.culture_pillar && (
                <Link
                  to={`/culture/${story.culture_pillar}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${PILLAR_COLORS[story.culture_pillar] || "bg-gray-100 text-gray-700"} hover:opacity-80 transition-opacity`}
                >
                  {story.culture_pillar}
                </Link>
              )}
              <span className="text-gray-400 text-xs">{story.read_time_minutes} min read</span>
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 leading-tight">{story.title}</h1>

            {/* Author & Date */}
            <div className="flex items-center gap-4 pb-8 border-b border-gray-100 mb-8">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                {story.author_name?.[0]?.toUpperCase() || "S"}
              </div>
              <div>
                <p className="font-medium text-sm">{story.author_name}</p>
                {story.published_at && (
                  <p className="text-gray-400 text-xs">{format(new Date(story.published_at), "MMMM d, yyyy")}</p>
                )}
              </div>
            </div>

            {/* Excerpt */}
            {story.excerpt && (
              <p className="text-lg text-gray-600 italic mb-8 leading-relaxed">{story.excerpt}</p>
            )}

            {/* Body */}
            <div className="prose prose-lg max-w-none">
              {story.content.split("\n").map((paragraph, i) => (
                paragraph.trim() ? (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>
                ) : null
              ))}
            </div>

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="font-display font-bold text-2xl mb-8">Culture Pieces</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
};

export default EditorialPost;
