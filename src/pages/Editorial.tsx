import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";

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

const PILLARS = [
  { value: "all", label: "All" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "faith", label: "Faith" },
  { value: "hustle", label: "Hustle" },
];

const PILLAR_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
};

const Editorial = () => {
  const [stories, setStories] = useState<CultureStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from("culture_stories")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });

      setStories(data || []);
      setLoading(false);
    };
    fetchStories();
  }, []);

  const filtered = filter === "all" ? stories : stories.filter((s) => s.culture_pillar === filter);
  const featured = filtered.filter((s) => s.is_featured);
  const regular = filtered.filter((s) => !s.is_featured);

  return (
    <>
      <SEO title="The Culture Edit | Streetwear Blantyre" description="Stories, editorial, and culture from the streets. The voice of streetwear culture." />

      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.3em] mb-3">Editorial</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4">The Culture Edit</h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Stories from the streets. Music, sports, faith, and hustle — told through the culture.</p>
          </div>

          {/* Pillar Filters */}
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {PILLARS.map((p) => (
              <button
                key={p.value}
                onClick={() => setFilter(p.value)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  filter === p.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-3 border-gray-900 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No stories yet{filter !== "all" ? ` in ${filter} culture` : ""}.</p>
              <p className="text-gray-300 text-sm mt-2">Check back soon — the culture is always growing.</p>
            </div>
          )}

          {/* Featured Story (full-width) */}
          {!loading && featured.length > 0 && featured.map((story) => (
            <Link
              key={story.id}
              to={`/editorial/${story.slug}`}
              className="block mb-12 rounded-3xl overflow-hidden group"
            >
              <div className="relative h-72 sm:h-96 bg-gray-900">
                {story.hero_image ? (
                  <img src={story.hero_image} alt={story.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    {story.culture_pillar && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PILLAR_COLORS[story.culture_pillar] || "bg-gray-100 text-gray-700"}`}>
                        {story.culture_pillar}
                      </span>
                    )}
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Featured</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-3 group-hover:text-gray-200 transition-colors">{story.title}</h2>
                  {story.excerpt && <p className="text-white/70 text-base sm:text-lg max-w-2xl">{story.excerpt}</p>}
                  <div className="flex items-center gap-4 mt-4 text-white/50 text-sm">
                    <span>{story.author_name}</span>
                    {story.published_at && <span>{format(new Date(story.published_at), "MMM d, yyyy")}</span>}
                    <span>{story.read_time_minutes} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Regular Stories Grid */}
          {!loading && regular.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((story) => (
                <Link
                  key={story.id}
                  to={`/editorial/${story.slug}`}
                  className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {story.hero_image ? (
                      <img src={story.hero_image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 font-display text-3xl font-bold">{story.title[0]}</span>
                      </div>
                    )}
                    {story.culture_pillar && (
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${PILLAR_COLORS[story.culture_pillar] || "bg-gray-100 text-gray-700"}`}>
                        {story.culture_pillar}
                      </span>
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
          )}
        </div>
      </div>
    </>
  );
};

export default Editorial;
