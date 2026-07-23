import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Loader2, Tag, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Wearable Category ────────────────────────────────────────

interface WearableCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface CulturePillar {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyCategory = { name: "", slug: "", description: "", icon: "", sort_order: 0, is_active: true };
const emptyPillar = { name: "", slug: "", description: "", icon: "", color: "#2563eb", sort_order: 0, is_active: true };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AdminCategories = () => {
  const [categories, setCategories] = useState<WearableCategory[]>([]);
  const [pillars, setPillars] = useState<CulturePillar[]>([]);
  const [loading, setLoading] = useState(true);

  // Category state
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<WearableCategory | null>(null);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [catSaving, setCatSaving] = useState(false);

  // Pillar state
  const [pillarDialog, setPillarDialog] = useState(false);
  const [editingPillar, setEditingPillar] = useState<CulturePillar | null>(null);
  const [pillarForm, setPillarForm] = useState(emptyPillar);
  const [pillarSaving, setPillarSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [catRes, pillarRes] = await Promise.all([
      supabase.from("wearable_categories").select("*").order("sort_order"),
      supabase.from("culture_pillars").select("*").order("sort_order"),
    ]);
    setCategories((catRes.data || []) as WearableCategory[]);
    setPillars((pillarRes.data || []) as CulturePillar[]);
    setLoading(false);
  };

  // ── Category CRUD ──

  const saveCategory = async () => {
    setCatSaving(true);
    try {
      const data = {
        name: catForm.name,
        slug: catForm.slug || slugify(catForm.name),
        description: catForm.description || null,
        icon: catForm.icon || null,
        sort_order: catForm.sort_order,
        is_active: catForm.is_active,
      };
      if (editingCat) {
        await supabase.from("wearable_categories").update(data).eq("id", editingCat.id);
        toast({ title: "Category updated!" });
      } else {
        await supabase.from("wearable_categories").insert(data);
        toast({ title: "Category created!" });
      }
      setCatDialog(false);
      setEditingCat(null);
      setCatForm(emptyCategory);
      fetchAll();
    } catch {
      toast({ title: "Error saving category", variant: "destructive" });
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("wearable_categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    fetchAll();
  };

  // ── Pillar CRUD ──

  const savePillar = async () => {
    setPillarSaving(true);
    try {
      const data = {
        name: pillarForm.name,
        slug: pillarForm.slug || slugify(pillarForm.name),
        description: pillarForm.description || null,
        icon: pillarForm.icon || null,
        color: pillarForm.color || null,
        sort_order: pillarForm.sort_order,
        is_active: pillarForm.is_active,
      };
      if (editingPillar) {
        await supabase.from("culture_pillars").update(data).eq("id", editingPillar.id);
        toast({ title: "Pillar updated!" });
      } else {
        await supabase.from("culture_pillars").insert(data);
        toast({ title: "Pillar created!" });
      }
      setPillarDialog(false);
      setEditingPillar(null);
      setPillarForm(emptyPillar);
      fetchAll();
    } catch {
      toast({ title: "Error saving pillar", variant: "destructive" });
    } finally {
      setPillarSaving(false);
    }
  };

  const deletePillar = async (id: string) => {
    if (!confirm("Delete this pillar?")) return;
    await supabase.from("culture_pillars").delete().eq("id", id);
    toast({ title: "Pillar deleted" });
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ─── Wearable Categories ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl flex items-center gap-2">
              <Tag className="h-7 w-7" /> Wearable Categories
            </h1>
            <p className="text-gray-500">Manage the product categories shown in your store</p>
          </div>
          <Dialog open={catDialog} onOpenChange={(open) => { setCatDialog(open); if (!open) { setEditingCat(null); setCatForm(emptyCategory); } }}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800"><Plus className="h-4 w-4" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={catForm.name} onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="e.g., T-Shirts" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={catForm.slug} onChange={(e) => setCatForm(p => ({ ...p, slug: e.target.value }))} placeholder="t-shirts" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={catForm.description} onChange={(e) => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon (lucide name)</Label>
                    <Input value={catForm.icon} onChange={(e) => setCatForm(p => ({ ...p, icon: e.target.value }))} placeholder="Shirt" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={catForm.is_active} onChange={(e) => setCatForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                  <Label>Active</Label>
                </div>
                <Button onClick={saveCategory} disabled={catSaving || !catForm.name} className="w-full bg-gray-900 hover:bg-gray-800">
                  {catSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingCat ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Icon</th>
                <th className="text-center px-4 py-3 font-medium">Order</th>
                <th className="text-center px-4 py-3 font-medium">Active</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{cat.description || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.icon || "-"}</td>
                  <td className="px-4 py-3 text-center">{cat.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || "", icon: cat.icon || "", sort_order: cat.sort_order, is_active: cat.is_active }); setCatDialog(true); }}>
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No categories yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Culture Pillars ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl flex items-center gap-2">
              <Palette className="h-7 w-7" /> Culture Pillars
            </h1>
            <p className="text-gray-500">Manage the culture pillars (Music, Sports, Faith, Hustle)</p>
          </div>
          <Dialog open={pillarDialog} onOpenChange={(open) => { setPillarDialog(open); if (!open) { setEditingPillar(null); setPillarForm(emptyPillar); } }}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800"><Plus className="h-4 w-4" /> Add Pillar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPillar ? "Edit Pillar" : "New Pillar"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={pillarForm.name} onChange={(e) => setPillarForm(p => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="e.g., Music Culture" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={pillarForm.slug} onChange={(e) => setPillarForm(p => ({ ...p, slug: e.target.value }))} placeholder="music" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={pillarForm.description} onChange={(e) => setPillarForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon (lucide name)</Label>
                    <Input value={pillarForm.icon} onChange={(e) => setPillarForm(p => ({ ...p, icon: e.target.value }))} placeholder="Music" />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={pillarForm.color || "#2563eb"} onChange={(e) => setPillarForm(p => ({ ...p, color: e.target.value }))} className="h-10 w-10 rounded border cursor-pointer" />
                      <Input value={pillarForm.color} onChange={(e) => setPillarForm(p => ({ ...p, color: e.target.value }))} placeholder="#8B5CF6" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={pillarForm.sort_order} onChange={(e) => setPillarForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <input type="checkbox" checked={pillarForm.is_active} onChange={(e) => setPillarForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                    <Label>Active</Label>
                  </div>
                </div>
                <Button onClick={savePillar} disabled={pillarSaving || !pillarForm.name} className="w-full bg-gray-900 hover:bg-gray-800">
                  {pillarSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingPillar ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Icon</th>
                <th className="text-left px-4 py-3 font-medium">Color</th>
                <th className="text-center px-4 py-3 font-medium">Order</th>
                <th className="text-center px-4 py-3 font-medium">Active</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pillars.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{p.description || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.icon || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: p.color || "#888" }} />
                      <span className="text-xs text-gray-500">{p.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{p.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPillar(p); setPillarForm({ name: p.name, slug: p.slug, description: p.description || "", icon: p.icon || "", color: p.color || "#2563eb", sort_order: p.sort_order, is_active: p.is_active }); setPillarDialog(true); }}>
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePillar(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pillars.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No culture pillars yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
