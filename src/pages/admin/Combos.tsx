import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Loader2, Search, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface ComboItem {
  id: string;
  product_id: string | null;
  product_name: string | null;
}

interface Combo {
  id: string;
  name: string;
  hook: string;
  lifestyle: string;
  tagline: string;
  description: string;
  discount_percent: number;
  vibe: string;
  badge: string;
  stock: number;
  image: string;
  images: string[];
  items: ComboItem[];
}

const LIFESTYLES = [
  { value: "student", label: "Student" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
  { value: "audio", label: "Audio" },
  { value: "premium", label: "Premium" },
];

const CATEGORIES = [
  { id: "t-shirts", label: "T-Shirts" },
  { id: "hoodies", label: "Hoodies" },
  { id: "caps", label: "Caps" },
  { id: "sneakers", label: "Sneakers" },
  { id: "pants", label: "Pants" },
  { id: "jackets", label: "Jackets" },
  { id: "accessories", label: "Accessories" },
];

const formatMWK = (n: number) => `MK ${n.toLocaleString("en-US")}`;

const AdminCombos = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    hook: "",
    lifestyle: "student",
    tagline: "",
    description: "",
    discount_percent: 15,
    vibe: "",
    badge: "",
    stock: 0,
    image: "",
    selectedProductIds: [] as string[],
  });

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, []);

  const fetchCombos = async () => {
    const { data: combosData } = await supabase
      .from("combos")
      .select("*")
      .order("sort_order", { ascending: true });

    if (combosData) {
      const combosWithItems = await Promise.all(
        combosData.map(async (c) => {
          const { data: items } = await supabase
            .from("combo_items")
            .select("*")
            .eq("combo_id", c.id);
          return {
            ...c,
            items: items || [],
          } as Combo;
        })
      );
      setCombos(combosWithItems);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, category, image")
      .order("name");
    setProducts(data || []);
  };

  // Computed pricing from selected products Ã— discount percent
  const computedPricing = useMemo(() => {
    const selectedProducts = products.filter((p) =>
      formData.selectedProductIds.includes(p.id)
    );
    const separateTotal = selectedProducts.reduce((s, p) => s + p.price, 0);
    const kitPrice = Math.round(
      separateTotal * (1 - formData.discount_percent / 100)
    );
    const saving = separateTotal - kitPrice;
    return { separateTotal, kitPrice, saving };
  }, [formData.selectedProductIds, formData.discount_percent, products]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [productSearch, products]);

  // Group by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, SupabaseProduct[]> = {};
    for (const p of filteredProducts) {
      const cat = p.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [filteredProducts]);

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter((id) => id !== productId)
        : [...prev.selectedProductIds, productId],
    }));
  };

  const handleSave = async () => {
    if (!formData.name || formData.selectedProductIds.length === 0) {
      toast({
        title: "Name and at least one product are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const comboData = {
        name: formData.name,
        hook: formData.hook,
        lifestyle: formData.lifestyle,
        tagline: formData.tagline,
        description: formData.description,
        discount_percent: formData.discount_percent,
        vibe: formData.vibe,
        badge: formData.badge,
        stock: formData.stock,
        image: formData.image,
        is_active: true,
        sort_order: 0,
        // Keep price/saving columns for backward compat (unused by frontend)
        price: computedPricing.kitPrice,
        saving: computedPricing.saving,
      };

      if (editingCombo) {
        // Update combo
        const { error } = await supabase
          .from("combos")
          .update(comboData)
          .eq("id", editingCombo.id);
        if (error) throw error;

        // Delete old items
        await supabase
          .from("combo_items")
          .delete()
          .eq("combo_id", editingCombo.id);

        // Insert new items
        for (const productId of formData.selectedProductIds) {
          const product = products.find((p) => p.id === productId);
          await supabase.from("combo_items").insert({
            combo_id: editingCombo.id,
            product_id: productId,
            product_name: product?.name || "",
          });
        }

        toast({ title: "Combo updated!" });
      } else {
        // Create combo
        const { data: newCombo, error: insertError } = await supabase
          .from("combos")
          .insert(comboData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (newCombo) {
          for (const productId of formData.selectedProductIds) {
            const product = products.find((p) => p.id === productId);
            await supabase.from("combo_items").insert({
              combo_id: newCombo.id,
              product_id: productId,
              product_name: product?.name || "",
            });
          }
        }

        toast({ title: "Combo created!" });
      }

      setIsDialogOpen(false);
      setEditingCombo(null);
      resetForm();
      fetchCombos();
    } catch (error: any) {
      console.error("Save combo error:", error);
      toast({
        title: "Error saving combo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this combo?")) {
      await supabase.from("combos").delete().eq("id", id);
      fetchCombos();
      toast({ title: "Combo deleted" });
    }
  };

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      hook: combo.hook || "",
      lifestyle: combo.lifestyle || "student",
      tagline: combo.tagline || "",
      description: combo.description || "",
      discount_percent: combo.discount_percent || 15,
      vibe: combo.vibe || "",
      badge: combo.badge || "",
      stock: combo.stock || 0,
      image: combo.image || "",
      selectedProductIds: combo.items
        .map((i) => i.product_id)
        .filter(Boolean) as string[],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      hook: "",
      lifestyle: "student",
      tagline: "",
      description: "",
      discount_percent: 15,
      vibe: "",
      badge: "",
      stock: 0,
      image: "",
      selectedProductIds: [],
    });
    setProductSearch("");
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
          <h1 className="font-display font-bold text-3xl">Combos</h1>
          <p className="text-gray-500">Manage bundle packages with dynamic pricing</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCombo(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4" /> Add Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCombo ? "Edit Combo" : "Add New Combo"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Combo Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily Essential Kit"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lifestyle</Label>
                  <select
                    value={formData.lifestyle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lifestyle: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {LIFESTYLES.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hook</Label>
                <Input
                  value={formData.hook}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hook: e.target.value }))}
                  placeholder="e.g., Power and sound. Day one."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g., Keep going all day"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vibe Phrase</Label>
                  <Input
                    value={formData.vibe}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vibe: e.target.value }))}
                    placeholder="e.g., Start right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., The basics to stay charged..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g., Best for Students"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount % *</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discount_percent: parseInt(e.target.value) || 0 }))
                    }
                    min={0}
                    max={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-20 w-20 rounded-lg object-cover mt-2 border"
                  />
                )}
              </div>

              {/* Computed Price Display */}
              {formData.selectedProductIds.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl border border-blue-200 p-4 space-y-1 text-sm">
                  <p className="font-semibold text-blue-800 mb-2">Pricing Preview</p>
                  <div className="flex justify-between text-gray-600">
                    <span>Separate total</span>
                    <span>{formatMWK(computedPricing.separateTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Kit price ({formData.discount_percent}% off)</span>
                    <span>{formatMWK(computedPricing.kitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold border-t border-blue-200 pt-1 mt-1">
                    <span>Savings</span>
                    <span>{formatMWK(computedPricing.saving)}</span>
                  </div>
                </div>
              )}

              {/* Product Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Products in Combo * ({formData.selectedProductIds.length} selected)</Label>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                </div>

                <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto p-2 space-y-2">
                  {Object.entries(productsByCategory).map(([category, catProducts]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                        {CATEGORIES.find((c) => c.id === category)?.label || category}
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {catProducts.map((product) => {
                          const selected = formData.selectedProductIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => toggleProduct(product.id)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                selected
                                  ? "bg-blue-50 border border-blue-300"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <div
                                className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                  selected
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "border-gray-300"
                                }`}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </div>
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="h-8 w-8 rounded object-cover shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{product.name}</p>
                                <p className="text-[10px] text-gray-400">
                                  {formatMWK(product.price)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No products found
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={
                  saving || !formData.name || formData.selectedProductIds.length === 0
                }
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingCombo ? "Update Combo" : "Add Combo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Combos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => {
          // Compute display prices from the actual products
          const comboProducts = products.filter((p) =>
            combo.items.map((i) => i.product_id).includes(p.id)
          );
          const sepTotal = comboProducts.reduce((s, p) => s + p.price, 0);
          const discPct = combo.discount_percent || 15;
          const kitPrice = Math.round(sepTotal * (1 - discPct / 100));
          const saving = sepTotal - kitPrice;

          return (
            <div key={combo.id} className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl">{combo.name}</h3>
                  <p className="text-xs text-blue-500 font-medium">
                    {combo.hook || combo.tagline}
                  </p>
                  {combo.lifestyle && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">
                      {combo.lifestyle}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(combo)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(combo.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">{combo.description}</p>

              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Package className="h-4 w-4" /> Products ({combo.items.length})
                </div>
                <div className="space-y-1">
                  {combo.items.map((item) => (
                    <p key={item.id} className="text-sm">
                      {item.product_name || "Unknown"}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{discPct}% off separate</p>
                  <p className="font-bold text-xl">MK {kitPrice.toLocaleString()}</p>
                  {saving > 0 && (
                    <p className="text-xs text-green-500">
                      Save MK {saving.toLocaleString()}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  {combo.vibe || combo.lifestyle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {combos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Package className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">
            No combos yet. Run the database migration to seed starter combos, or
            create your first one!
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminCombos;
