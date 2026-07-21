import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Promotion } from "@/data/promotions";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PAGES_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "shop", label: "Shop" },
  { value: "combos", label: "Combos" },
];

const PROMO_COLORS = [
  "from-orange-500 to-orange-600",
  "from-purple-500 to-indigo-500",
  "from-green-500 to-teal-500",
  "from-blue-500 to-cyan-500",
  "from-red-500 to-orange-500",
  "from-pink-500 to-rose-500",
];

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    images: [""] as string[],
    link: "/shop",
    link_text: "Shop Now",
    background_color: "from-orange-500 to-orange-600",
    text_color: "text-white",
    is_active: true,
    is_featured: true,
    sort_order: 0,
    pages: ["home"],
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .order("sort_order", { ascending: true });
    setPromotions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    
    try {
      const validImages = formData.images
        .map(img => img.trim())
        .filter(img => img.startsWith('http://') || img.startsWith('https://'));
      
      const finalImage = validImages[0] || "";

      if (editingPromotion) {
        const updateData: Record<string, unknown> = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          image: finalImage,
          link: formData.link,
          link_text: formData.link_text,
          background_color: formData.background_color,
          text_color: formData.text_color,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          sort_order: formData.sort_order,
          pages: formData.pages,
        };
        
        if (validImages.length > 0) {
          updateData.images = validImages;
        }

        const { error } = await supabase.from("promotions").update(updateData).eq("id", editingPromotion.id);
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        toast({ title: "Promotion updated!" });
      } else {
        const insertData: Record<string, unknown> = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          image: finalImage,
          link: formData.link,
          link_text: formData.link_text,
          background_color: formData.background_color,
          text_color: formData.text_color,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          sort_order: formData.sort_order,
          pages: formData.pages,
        };
        
        if (validImages.length > 0) {
          insertData.images = validImages;
        }

        const { error } = await supabase.from("promotions").insert(insertData);
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        toast({ title: "Promotion created!" });
      }

      setDialogOpen(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error: any) {
      console.error("Promotion error:", error);
      toast({ title: "Error saving promotion", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      images: [""],
      link: "/shop",
      link_text: "Shop Now",
      background_color: "from-orange-500 to-orange-600",
      text_color: "text-white",
      is_active: true,
      is_featured: true,
      sort_order: 0,
      pages: ["home"],
    });
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    const promoImages = promo.images && promo.images.length > 0 
      ? promo.images 
      : promo.image ? [promo.image] : [""];
    setFormData({
      title: promo.title,
      subtitle: promo.subtitle || "",
      description: promo.description || "",
      image: promo.image || "",
      images: promoImages,
      link: promo.link,
      link_text: promo.link_text,
      background_color: promo.background_color,
      text_color: promo.text_color,
      is_active: promo.is_active,
      is_featured: promo.is_featured,
      sort_order: promo.sort_order,
      pages: promo.pages,
    });
    setDialogOpen(true);
  };

  const deletePromotion = async (id: string) => {
    if (confirm("Delete this promotion?")) {
      try {
        const { error } = await supabase.from("promotions").delete().eq("id", id);
        if (error) throw error;
        toast({ title: "Promotion deleted" });
        fetchPromotions();
      } catch (error: any) {
        toast({ title: "Error deleting promotion", variant: "destructive" });
      }
    }
  };

  const togglePage = (page: string) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.includes(page)
        ? prev.pages.filter(p => p !== page)
        : [...prev.pages, page],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Promotions</h1>
          <p className="text-gray-500">Manage promotional banners and sliders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingPromotion(null); }} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? "Edit Promotion" : "Add Promotion"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Slider Images (Optional)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFormData(p => ({ ...p, images: [...p.images, ""] }))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Add multiple images for auto-sliding gallery</p>
                <div className="space-y-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={img}
                        onChange={e => {
                          const newImages = [...formData.images];
                          newImages[idx] = e.target.value;
                          setFormData(p => ({ ...p, images: newImages }));
                        }}
                        placeholder="https://i.ibb.co/xxx/image.jpg"
                        className={img && !img.startsWith('http') ? "border-red-500" : ""}
                      />
                      {formData.images.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== idx);
                            setFormData(p => ({ ...p, images: newImages }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.images[0] && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formData.images.filter(i => i.startsWith('http')).map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt={`Preview ${idx + 1}`}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input value={formData.link} onChange={e => setFormData(p => ({ ...p, link: e.target.value }))} placeholder="/product/..." />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input value={formData.link_text} onChange={e => setFormData(p => ({ ...p, link_text: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="flex flex-wrap gap-2">
                  {PROMO_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, background_color: color }))}
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} ${formData.background_color === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Show on Pages</Label>
                <div className="flex flex-wrap gap-2">
                  {PAGES_OPTIONS.map(page => (
                    <button
                      key={page.value}
                      type="button"
                      onClick={() => togglePage(page.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.pages.includes(page.value)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                {editingPromotion ? "Update Promotion" : "Create Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions Grid */}
      {promotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No promotions yet</p>
          <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-orange-500">Create First Promotion</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map(promo => (
            <div key={promo.id} className="relative rounded-xl overflow-hidden bg-white border border-gray-100 group">
              <div className={`h-40 bg-gradient-to-r ${promo.background_color} relative`}>
                {promo.image && (
                  <img 
                    src={promo.image} 
                    alt={promo.title} 
                    className="w-full h-full object-cover opacity-50" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r ${promo.background_color}" />
                <div className="absolute inset-0 flex items-center p-4">
                  <div>
                    <p className="text-white/80 text-sm">{promo.subtitle}</p>
                    <h3 className="text-white font-bold text-xl">{promo.title}</h3>
                  </div>
                </div>
                {!promo.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/80 text-white text-xs rounded">Inactive</div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500">Pages: {promo.pages.join(", ")}</p>
                <p className="text-xs text-gray-400 mt-1">Order: {promo.sort_order}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(promo)}
                  className="p-2 bg-white rounded-lg shadow hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deletePromotion(promo.id)}
                  className="p-2 bg-white rounded-lg shadow hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;