import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { formatMWK } from "@/data/products";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Lookbook {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image: string | null;
  season: string | null;
  culture_pillar: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

interface LookbookItem {
  id: string;
  lookbook_id: string;
  product_id: string;
  editorial_note: string | null;
  sort_order: number;
  products: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  } | null;
}

const PILLAR_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
};

const LookbookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [lookbook, setLookbook] = useState<Lookbook | null>(null);
  const [items, setItems] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchLookbook = async () => {
      if (!slug) return;

      const { data: lb, error } = await supabase
        .from("lookbooks")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !lb) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLookbook(lb);

      const { data: lbItems } = await supabase
        .from("lookbook_items")
        .select("*, products(id, name, price, image, category)")
        .eq("lookbook_id", lb.id)
        .order("sort_order", { ascending: true });

      setItems(lbItems || []);
      setLoading(false);
    };
    fetchLookbook();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !lookbook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Lookbook not found</p>
          <Link to="/lookbook" className="text-gray-900 font-medium hover:underline mt-2 inline-block">Back to Lookbooks</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={`${lookbook.title} | Streetwear Blantyre`} description={lookbook.description || lookbook.title} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="relative w-full h-[40vh] sm:h-[50vh] lg:h-[60vh] bg-gray-900">
          {lookbook.hero_image ? (
            <img src={lookbook.hero_image} alt={lookbook.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <div className="absolute top-6 left-6">
            <Link to="/lookbook" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              Lookbooks
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                {lookbook.season && <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">{lookbook.season}</span>}
                {lookbook.culture_pillar && (
                  <Link to={`/culture/${lookbook.culture_pillar}`} className={`px-3 py-1 rounded-full text-xs font-semibold ${PILLAR_COLORS[lookbook.culture_pillar] || "bg-gray-200 text-gray-700"} hover:opacity-80 transition-opacity`}>
                    {lookbook.culture_pillar}
                  </Link>
                )}
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">{lookbook.title}</h1>
              {lookbook.description && <p className="text-white/60 text-lg mt-3 max-w-xl">{lookbook.description}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">This collection is being curated.</p>
              <p className="text-gray-300 text-sm mt-2">Pieces coming soon.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.products?.image ? (
                      <img src={item.products.image} alt={item.products.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-300 font-display text-2xl font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info + Editorial Note */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Piece {index + 1}</span>
                        {item.products?.category && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{item.products.category}</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-xl mb-1">{item.products?.name || "Untitled"}</h3>
                      {item.products?.price && (
                        <p className="text-gray-900 font-semibold text-lg">{formatMWK(item.products.price)}</p>
                      )}
                    </div>

                    {item.editorial_note && (
                      <p className="text-gray-500 italic text-sm mt-3 leading-relaxed border-l-2 border-gray-200 pl-4">{item.editorial_note}</p>
                    )}

                    {item.products?.id && (
                      <Link
                        to={`/product/${item.products.id}`}
                        className="inline-flex items-center gap-2 text-gray-900 font-medium text-sm mt-4 hover:text-gray-600 transition-colors"
                      >
                        View Piece <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LookbookDetail;
