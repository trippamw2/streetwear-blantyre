import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, BookOpen, Eye, EyeOff, Star } from "lucide-react";
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
  { value: "music", label: "Music Culture" },
  { value: "sports", label: "Sports Culture" },
  { value: "faith", label: "Faith Culture" },
  { value: "hustle", label: "Hustle Culture" },
];

const PILLAR_COLORS: Record<string, string> = {
  music: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  faith: "bg-amber-100 text-amber-700",
  hustle: "bg-red-100 text-red-700",
};

const AdminCultureStories = () => {
  const [stories, setStories] = useState<CultureStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<CultureStory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    hero_image: "",
    culture_pillar: "music",
    tags: "",
    is_published: false,
    is_featured: false,
    author_name: "Streetwear Blantyre",
    read_time_minutes: 5,
  });

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    const { data } = await supabase.from("culture_stories").select("*").order("created_at", { ascending: false });
    setStories(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const storyData = {
        title: formData.title,
        excerpt: formData.excerpt || null,
        content: formData.content,
        hero_image: formData.hero_image || null,
        culture_pillar: formData.culture_pillar,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        author_name: formData.author_name,
        read_time_minutes: formData.read_time_minutes,
        published_at: formData.is_published ? (editingStory?.published_at || new Date().toISOString()) : null,
      };

      if (editingStory) {
        const { error } = await supabase.from("culture_stories").update(storyData).eq("id", editingStory.id);
        if (error) throw error;
        toast({ title: "Story updated!" });
      } else {
        const { error } = await supabase.from("culture_stories").insert(storyData);
        if (error) throw error;
        toast({ title: "Story created!" });
      }
      setIsDialogOpen(false);
      setEditingStory(null);
      resetForm();
      fetchStories();
    } catch (err: any) {
      toast({ title: "Error saving story", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this story?")) return;
    await supabase.from("culture_stories").delete().eq("id", id);
    fetchStories();
    toast({ title: "Story deleted" });
  };

  const handleEdit = (story: CultureStory) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      excerpt: story.excerpt || "",
      content: story.content,
      hero_image: story.hero_image || "",
      culture_pillar: story.culture_pillar,
      tags: (story.tags || []).join(", "),
      is_published: story.is_published,
      is_featured: story.is_featured,
      author_name: story.author_name,
      read_time_minutes: story.read_time_minutes,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "", excerpt: "", content: "", hero_image: "",
      culture_pillar: "music", tags: "", is_published: false,
      is_featured: false, author_name: "Streetwear Blantyre", read_time_minutes: 5,
    });
  };

  const togglePublish = async (story: CultureStory) => {
    await supabase.from("culture_stories").update({
      is_published: !story.is_published,
      published_at: !story.is_published ? new Date().toISOString() : null,
    }).eq("id", story.id);
    fetchStories();
  };

  const toggleFeatured = async (story: CultureStory) => {
    await supabase.from("culture_stories").update({ is_featured: !story.is_featured }).eq("id", story.id);
    fetchStories();
  };

  const filtered = filter === "all" ? stories : stories.filter(s => s.culture_pillar === filter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Culture Stories</h1>
          <p className="text-gray-500">Editorial content about global street culture</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingStory(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800"><Plus className="h-4 w-4" /> New Story</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStory ? "Edit Story" : "New Culture Story"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Why Hip-Hop Still Shapes Streetwear" />
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Input value={formData.excerpt} onChange={(e) => setFormData(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary for cards and previews" />
              </div>
              <div className="space-y-2">
                <Label>Content * (Markdown supported)</Label>
                <Textarea value={formData.content} onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))} rows={16} placeholder="Write your story..." className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Culture Pillar *</Label>
                  <select value={formData.culture_pillar} onChange={(e) => setFormData(p => ({ ...p, culture_pillar: e.target.value }))} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                    {PILLARS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={formData.author_name} onChange={(e) => setFormData(p => ({ ...p, author_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input value={formData.hero_image} onChange={(e) => setFormData(p => ({ ...p, hero_image: e.target.value }))} placeholder="https://..." />
                  {formData.hero_image && <img src={formData.hero_image} alt="" className="h-24 w-full object-cover rounded-lg mt-2" />}
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} placeholder="streetwear, hip-hop, culture" />
                  <div className="space-y-2 mt-2">
                    <Label>Read Time (minutes)</Label>
                    <Input type="number" value={formData.read_time_minutes} onChange={(e) => setFormData(p => ({ ...p, read_time_minutes: parseInt(e.target.value) || 5 }))} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData(p => ({ ...p, is_published: e.target.checked }))} className="rounded" />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData(p => ({ ...p, is_featured: e.target.checked }))} className="rounded" />
                  Featured on Homepage
                </label>
              </div>
              <Button onClick={handleSave} className="w-full bg-gray-900 hover:bg-gray-800" disabled={saving || !formData.title || !formData.content}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingStory ? "Update Story" : "Publish Story"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All ({stories.length})
        </button>
        {PILLARS.map(p => (
          <button key={p.value} onClick={() => setFilter(p.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === p.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p.label} ({stories.filter(s => s.culture_pillar === p.value).length})
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(story => (
          <div key={story.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {story.hero_image && <img src={story.hero_image} alt="" className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${PILLAR_COLORS[story.culture_pillar]}`}>
                  {story.culture_pillar}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${story.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {story.is_published ? "Published" : "Draft"}
                </span>
                {story.is_featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              </div>
              <h3 className="font-bold text-sm line-clamp-2">{story.title}</h3>
              {story.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{story.excerpt}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-gray-400">
                  {story.read_time_minutes} min read · {format(new Date(story.created_at), "MMM d")}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublish(story)} className="p-1 rounded hover:bg-gray-100" title={story.is_published ? "Unpublish" : "Publish"}>
                    {story.is_published ? <Eye className="h-3.5 w-3.5 text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                  <button onClick={() => toggleFeatured(story)} className="p-1 rounded hover:bg-gray-100" title="Toggle featured">
                    <Star className={`h-3.5 w-3.5 ${story.is_featured ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                  </button>
                  <button onClick={() => handleEdit(story)} className="p-1 rounded hover:bg-gray-100"><Edit className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(story.id)} className="p-1 rounded hover:bg-gray-100"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            No stories yet. Create your first culture story.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCultureStories;
