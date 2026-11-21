import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SB_BRAND_ID } from "@/data/sbArchitecture";
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
import { Edit, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type LookRow = Database["public"]["Tables"]["sb_looks"]["Row"];
type LookItemRow = Database["public"]["Tables"]["sb_look_items"]["Row"];
type ProductOption = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "sku" | "category"
>;

interface LookForm {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  hero_image: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface LookItemDraft {
  key: string;
  id?: string;
  product_id: string;
  variant_id: string | null;
  role: string;
  styling_note: string;
  is_purchasable: boolean;
  sort_order: number;
}

const emptyForm: LookForm = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  hero_image: "",
  is_published: true,
  is_featured: false,
  sort_order: 0,
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

let draftCounter = 0;
const nextDraftKey = () => `new-${Date.now()}-${draftCounter++}`;

const toDraft = (item: LookItemRow): LookItemDraft => ({
  key: item.id,
  id: item.id,
  product_id: item.product_id,
  variant_id: item.variant_id,
  role: item.role || "",
  styling_note: item.styling_note || "",
  is_purchasable: item.is_purchasable,
  sort_order: item.sort_order,
});

const SbLooks = () => {
  const [looks, setLooks] = useState<LookRow[]>([]);
  const [lookItems, setLookItems] = useState<LookItemRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LookRow | null>(null);
  const [form, setForm] = useState<LookForm>(emptyForm);
  const [items, setItems] = useState<LookItemDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [lookRes, itemRes, productRes] = await Promise.all([
      supabase
        .from("sb_looks")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true }),
      supabase
        .from("sb_look_items")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, sku, category")
        .eq("brand_id", SB_BRAND_ID)
        .order("name", { ascending: true }),
    ]);

    const failed = [lookRes, itemRes, productRes].find((result) => result.error);
    if (failed?.error) {
      toast({ title: "Error loading SB looks", description: failed.error.message, variant: "destructive" });
    } else {
      setLooks(lookRes.data || []);
      setLookItems(itemRes.data || []);
      setProducts((productRes.data || []) as ProductOption[]);
    }
    setLoading(false);
  };

  const openDialog = (row?: LookRow) => {
    setEditing(row || null);
    setForm(
      row
        ? {
            title: row.title,
            slug: row.slug,
            subtitle: row.subtitle || "",
            description: row.description || "",
            hero_image: row.hero_image || "",
            is_published: row.is_published,
            is_featured: row.is_featured,
            sort_order: row.sort_order,
          }
        : emptyForm,
    );
    setItems(
      row
        ? lookItems
            .filter((item) => item.look_id === row.id)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(toDraft)
        : [],
    );
    setDialogOpen(true);
  };

  const resetDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      setForm(emptyForm);
      setItems([]);
    }
  };

  const updateItem = (key: string, patch: Partial<LookItemDraft>) => {
    setItems((previous) => previous.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    if (products.length === 0) {
      toast({ title: "No products available", description: "Add products before styling a look.", variant: "destructive" });
      return;
    }
    setItems((previous) => [
      ...previous,
      {
        key: nextDraftKey(),
        product_id: products[0].id,
        variant_id: null,
        role: "",
        styling_note: "",
        is_purchasable: true,
        sort_order: previous.length * 10,
      },
    ]);
  };

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Title and slug are required", variant: "destructive" });
      return;
    }
    if (items.some((item) => !item.product_id)) {
      toast({ title: "Every look item needs a product", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        hero_image: form.hero_image.trim() || null,
        is_published: form.is_published,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
      };

      let lookId: string;
      if (editing) {
        const { error } = await supabase
          .from("sb_looks")
          .update(payload)
          .eq("id", editing.id)
          .eq("brand_id", SB_BRAND_ID);
        if (error) {
          toast({ title: "Error updating look", description: error.message, variant: "destructive" });
          return;
        }
        lookId = editing.id;
      } else {
        const { data, error } = await supabase
          .from("sb_looks")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) {
          toast({
            title: "Error creating look",
            description: error?.message || "No look id returned",
            variant: "destructive",
          });
          return;
        }
        lookId = data.id;
      }

      const existingItems = lookItems.filter((item) => item.look_id === lookId);
      const keptIds = items.map((item) => item.id).filter((id): id is string => Boolean(id));

      for (const existing of existingItems) {
        if (!keptIds.includes(existing.id)) {
          const { error } = await supabase
            .from("sb_look_items")
            .delete()
            .eq("id", existing.id)
            .eq("look_id", lookId)
            .eq("brand_id", SB_BRAND_ID);
          if (error) {
            toast({ title: "Error removing look item", description: error.message, variant: "destructive" });
            return;
          }
        }
      }

      for (const item of items) {
        const itemPayload = {
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          role: item.role.trim() || null,
          styling_note: item.styling_note.trim() || null,
          is_purchasable: item.is_purchasable,
          sort_order: item.sort_order,
        };

        if (item.id) {
          const { error } = await supabase
            .from("sb_look_items")
            .update(itemPayload)
            .eq("id", item.id)
            .eq("look_id", lookId)
            .eq("brand_id", SB_BRAND_ID);
          if (error) {
            toast({ title: "Error updating look item", description: error.message, variant: "destructive" });
            return;
          }
        } else {
          const { error } = await supabase.from("sb_look_items").insert({
            brand_id: SB_BRAND_ID,
            look_id: lookId,
            ...itemPayload,
          });
          if (error) {
            toast({ title: "Error adding look item", description: error.message, variant: "destructive" });
            return;
          }
        }
      }

      toast({ title: editing ? "Look updated!" : "Look created!" });
      resetDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving look",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: LookRow) => {
    if (!window.confirm(`Delete look "${row.title}"?`)) return;
    const { error: placementError } = await supabase
      .from("sb_editorial_placements")
      .update({ look_id: null })
      .eq("look_id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (placementError) {
      toast({
        title: "Error unlinking look placements",
        description: placementError.message,
        variant: "destructive",
      });
      return;
    }
    const { error: itemError } = await supabase
      .from("sb_look_items")
      .delete()
      .eq("look_id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (itemError) {
      toast({ title: "Error removing look items", description: itemError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("sb_looks")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting look", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Look deleted" });
    await fetchAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl flex items-center gap-2">
            <Sparkles className="h-7 w-7" /> SB Looks
          </h1>
          <p className="text-gray-500">Build styled looks and shoppable item lists</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4" /> Add Look
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Look" : "New Look"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))
                    }
                    placeholder="e.g., Weekend Uniform"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="weekend-uniform"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Short supporting line"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Tell the styling story"
                />
              </div>

              <div className="space-y-2">
                <Label>Hero Image URL</Label>
                <Input
                  value={form.hero_image}
                  onChange={(e) => setForm((p) => ({ ...p, hero_image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="sb-look-published"
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-look-published">Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="sb-look-featured"
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-look-featured">Featured</Label>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: toNumber(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Styling Items</Label>
                    <p className="text-xs text-gray-500">Products shown in this look ({items.length})</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>

                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed py-8 text-center text-sm text-gray-500">
                    No items yet. Click &ldquo;Add Item&rdquo; to style this look.
                  </div>
                )}

                {items.map((item, index) => (
                  <div key={item.key} className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5 space-y-2">
                        <Label>Product</Label>
                        <select
                          className={selectClass}
                          value={item.product_id}
                          onChange={(e) => updateItem(item.key, { product_id: e.target.value })}
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                              {product.sku ? ` (${product.sku})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={item.role}
                          onChange={(e) => updateItem(item.key, { role: e.target.value })}
                          placeholder="e.g., Top"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={item.sort_order}
                          onChange={(e) => updateItem(item.key, { sort_order: toNumber(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 pb-2">
                        <input
                          id={`look-item-purchasable-${item.key}`}
                          type="checkbox"
                          checked={item.is_purchasable}
                          onChange={(e) => updateItem(item.key, { is_purchasable: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 accent-primary"
                        />
                        <Label htmlFor={`look-item-purchasable-${item.key}`} className="text-xs">
                          Purchasable
                        </Label>
                      </div>
                      <div className="sm:col-span-1 flex justify-end pb-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems((previous) => previous.filter((entry) => entry.key !== item.key))}
                          title="Remove item"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Styling Note</Label>
                      <Textarea
                        value={item.styling_note}
                        onChange={(e) => updateItem(item.key, { styling_note: e.target.value })}
                        rows={2}
                        placeholder={`Item ${index + 1} styling note`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => void save()}
                disabled={saving || !form.title.trim() || !form.slug.trim()}
                className="w-full"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Subtitle</th>
              <th className="text-center px-4 py-3 font-medium">Items</th>
              <th className="text-center px-4 py-3 font-medium">Published</th>
              <th className="text-center px-4 py-3 font-medium">Featured</th>
              <th className="text-center px-4 py-3 font-medium">Order</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {looks.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.slug}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{row.subtitle || "-"}</td>
                <td className="px-4 py-3 text-center">{lookItems.filter((item) => item.look_id === row.id).length}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {row.is_published ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.is_featured ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {row.is_featured ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{row.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(row)}>
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void remove(row)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {looks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No looks yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SbLooks;
