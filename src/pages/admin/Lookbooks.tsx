import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Camera, Eye, EyeOff, GripVertical, X, Search } from "lucide-react";
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
  items?: LookbookItem[];
}

interface LookbookItem {
  id: string;
  lookbook_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  editorial_note: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

const PILLARS = [
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

const AdminLookbooks = () => {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLookbook, setEditingLookbook] = useState<Lookbook | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hero_image: "",
    season: "",
    culture_pillar: "",
    is_published: false,
    is_featured: false,
    selectedProducts: [] as { product_id: string; editorial_note: string }[],
  });

  useEffect(() => { fetchLookbooks(); fetchProducts(); }, []);

  const fetchLookbooks = async () => {
    const { data } = await supabase.from("lookbooks").select("*").order("sort_order", { ascending: true });
    if (data) {
      const withItems = await Promise.all(data.map(async (lb) => {
        const { data: items } = await supabase.from("lookbook_items").select("*").eq("lookbook_id", lb.id).order("sort_order");
        return { ...lb, items: items || [] } as Lookbook;
      }));
      setLookbooks(withItems);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, price, image, category").order("name");
    setProducts(data || []);
  };

  const filteredProducts = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const lbData = {
        title: formData.title,
        description: formData.description || null,
        hero_image: formData.hero_image || null,
        season: formData.season || null,
        culture_pillar: formData.culture_pillar || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        sort_order: editingLookbook?.sort_order || lookbooks.length,
      };

      let lookbookId: string;
      if (editingLookbook) {
        const { error } = await supabase.from("lookbooks").update(lbData).eq("id", editingLookbook.id);
        if (error) throw error;
        lookbookId = editingLookbook.id;
        await supabase.from("lookbook_items").delete().eq("lookbook_id", lookbookId);
        toast({ title: "Lookbook updated!" });
      } else {
        const { data, error } = await supabase.from("lookbooks").insert(lbData).select().single();
        if (error) throw error;
        lookbookId = data.id;
        toast({ title: "Lookbook created!" });
      }

      for (let i = 0; i < formData.selectedProducts.length; i++) {
        await supabase.from("lookbook_items").insert({
          lookbook_id: lookbookId,
          product_id: formData.selectedProducts[i].product_id,
          editorial_note: formData.selectedProducts[i].editorial_note || null,
          sort_order: i,
        });
      }

      setIsDialogOpen(false);
      setEditingLookbook(null);
      resetForm();
      fetchLookbooks();
    } catch (err: any) {
      toast({ title: "Error saving lookbook", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lookbook?")) return;
    await supabase.from("lookbooks").delete().eq("id", id);
    fetchLookbooks();
    toast({ title: "Lookbook deleted" });
  };

  const handleEdit = (lb: Lookbook) => {
    setEditingLookbook(lb);
    setFormData({
      title: lb.title,
      description: lb.description || "",
      hero_image: lb.hero_image || "",
      season: lb.season || "",
      culture_pillar: lb.culture_pillar || "",
      is_published: lb.is_published,
      is_featured: lb.is_featured,
      selectedProducts: (lb.items || []).map(item => ({
        product_id: item.product_id,
        editorial_note: item.editorial_note || "",
      })),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", hero_image: "", season: "", culture_pillar: "", is_published: false, is_featured: false, selectedProducts: [] });
    setProductSearch("");
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => {
      const exists = prev.selectedProducts.find(p => p.product_id === productId);
      if (exists) {
        return { ...prev, selectedProducts: prev.selectedProducts.filter(p => p.product_id !== productId) };
      }
      return { ...prev, selectedProducts: [...prev.selectedProducts, { product_id: productId, editorial_note: "" }] };
    });
  };

  const updateProductNote = (productId: string, note: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p => p.product_id === productId ? { ...p, editorial_note: note } : p),
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Lookbooks</h1>
          <p className="text-gray-500">Curated visual collections with editorial context</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingLookbook(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800"><Plus className="h-4 w-4" /> New Lookbook</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLookbook ? "Edit Lookbook" : "New Lookbook"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g., The Faith Collection" />
                </div>
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Input value={formData.season} onChange={(e) => setFormData(p => ({ ...p, season: e.target.value }))} placeholder="e.g., SS26, FW25" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What's the story behind this collection?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Culture Pillar</Label>
                  <select value={formData.culture_pillar} onChange={(e) => setFormData(p => ({ ...p, culture_pillar: e.target.value }))} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                    <option value="">None</option>
                    {PILLARS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input value={formData.hero_image} onChange={(e) => setFormData(p => ({ ...p, hero_image: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              {formData.hero_image && <img src={formData.hero_image} alt="" className="h-32 w-full object-cover rounded-lg" />}

              <div className="space-y-2">
                <Label>Products ({formData.selectedProducts.length} selected)</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
                </div>
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                  {filteredProducts.map(product => {
                    const selected = formData.selectedProducts.some(p => p.product_id === product.id);
                    return (
                      <button key={product.id} type="button" onClick={() => toggleProduct(product.id)} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm ${selected ? "bg-gray-50 border border-gray-300" : "hover:bg-gray-50 border border-transparent"}`}>
                        {product.image && <img src={product.image} alt="" className="h-8 w-8 rounded object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400">MK {product.price.toLocaleString()}</p>
                        </div>
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selected ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"}`}>
                          {selected && <span className="text-[8px]">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Editorial Notes</Label>
                  {formData.selectedProducts.map(sp => {
                    const product = products.find(p => p.id === sp.product_id);
                    return (
                      <div key={sp.product_id} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-32 truncate shrink-0">{product?.name}</span>
                        <Input value={sp.editorial_note} onChange={(e) => updateProductNote(sp.product_id, e.target.value)} placeholder="Why this piece fits the collection..." className="text-xs" />
                      </div>
                    );
                  })}
                </div>
              )}

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
              <Button onClick={handleSave} className="w-full bg-gray-900 hover:bg-gray-800" disabled={saving || !formData.title}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingLookbook ? "Update Lookbook" : "Create Lookbook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lookbooks.map(lb => (
          <div key={lb.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {lb.hero_image && <img src={lb.hero_image} alt="" className="w-full h-48 object-cover" />}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                {lb.culture_pillar && <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${PILLAR_COLORS[lb.culture_pillar] || ""}`}>{lb.culture_pillar}</span>}
                {lb.season && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{lb.season}</span>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${lb.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {lb.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="font-bold text-lg">{lb.title}</h3>
              {lb.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lb.description}</p>}
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                <span>{lb.items?.length || 0} pieces</span>
                <span>·</span>
                <span>{format(new Date(lb.created_at), "MMM d")}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(lb)} className="flex-1"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(lb.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
        {lookbooks.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Camera className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            No lookbooks yet. Create your first curated collection.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLookbooks;
