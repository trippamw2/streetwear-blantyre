import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";

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

const PILLAR_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
};

const Lookbooks = () => {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLookbooks = async () => {
      const { data } = await supabase
        .from("lookbooks")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });

      setLookbooks(data || []);
      setLoading(false);
    };
    fetchLookbooks();
  }, []);

  const featured = lookbooks.filter((lb) => lb.is_featured);
  const regular = lookbooks.filter((lb) => !lb.is_featured);

  return (
    <>
      <SEO title="Lookbooks | Streetwear Blantyre" description="Curated collections. Editorial vision. The culture, styled." />

      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.3em] mb-3">Collections</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4">Lookbooks</h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Curated collections. Editorial vision. The culture, styled.</p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-3 border-gray-900 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Empty State */}
          {!loading && lookbooks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No lookbooks yet.</p>
              <p className="text-gray-300 text-sm mt-2">Collections are in the works. Stay tuned.</p>
            </div>
          )}

          {/* Featured Lookbook (full-width hero) */}
          {!loading && featured.map((lb) => (
            <Link
              key={lb.id}
              to={`/lookbook/${lb.slug}`}
              className="block mb-10 rounded-3xl overflow-hidden group"
            >
              <div className="relative h-72 sm:h-96 bg-gray-900">
                {lb.hero_image ? (
                  <img src={lb.hero_image} alt={lb.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    {lb.season && <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">{lb.season}</span>}
                    {lb.culture_pillar && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PILLAR_COLORS[lb.culture_pillar] || "bg-gray-200 text-gray-700"}`}>
                        {lb.culture_pillar}
                      </span>
                    )}
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Featured</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-2 group-hover:text-gray-200 transition-colors">{lb.title}</h2>
                  {lb.description && <p className="text-white/60 text-base max-w-xl">{lb.description}</p>}
                </div>
              </div>
            </Link>
          ))}

          {/* Regular Lookbooks Grid */}
          {!loading && regular.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regular.map((lb) => (
                <Link
                  key={lb.id}
                  to={`/lookbook/${lb.slug}`}
                  className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-56 sm:h-64 bg-gray-100 overflow-hidden">
                    {lb.hero_image ? (
                      <img src={lb.hero_image} alt={lb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 font-display text-4xl font-bold">{lb.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {lb.season && (
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">{lb.season}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {lb.culture_pillar && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PILLAR_COLORS[lb.culture_pillar] || "bg-gray-100 text-gray-700"}`}>
                          {lb.culture_pillar}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2 group-hover:text-gray-700 transition-colors">{lb.title}</h3>
                    {lb.description && <p className="text-gray-500 text-sm line-clamp-2">{lb.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Lookbooks;
