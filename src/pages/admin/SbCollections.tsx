import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Edit, Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type CollectionRow = Database["public"]["Tables"]["sb_collections"]["Row"];
type MembershipRow = Database["public"]["Tables"]["sb_collection_products"]["Row"];
type ProductOption = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "sku" | "category" | "image"
>;

interface CollectionForm {
  kind: "collection" | "drop";
  name: string;
  slug: string;
  description: string;
  hero_image: string;
  release_date: string;
  limited_drop: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  productIds: string[];
}

const emptyForm: CollectionForm = {
  kind: "collection",
  name: "",
  slug: "",
  description: "",
  hero_image: "",
  release_date: "",
  limited_drop: false,
  is_active: true,
  is_featured: false,
  sort_order: 0,
  productIds: [],
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

const SbCollections = () => {
  const [searchParams] = useSearchParams();
  const kindFilter = searchParams.get("kind");
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionRow | null>(null);
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [collectionRes, membershipRes, productRes] = await Promise.all([
      supabase
        .from("sb_collections")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("sb_collection_products")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, sku, category, image")
        .eq("brand_id", SB_BRAND_ID)
        .order("name", { ascending: true }),
    ]);

    const failed = [collectionRes, membershipRes, productRes].find((result) => result.error);
    if (failed?.error) {
      toast({ title: "Error loading collections", description: failed.error.message, variant: "destructive" });
    } else {
      setCollections(collectionRes.data || []);
      setMemberships(membershipRes.data || []);
      setProducts((productRes.data || []) as ProductOption[]);
    }
    setLoading(false);
  };

  const visibleCollections = useMemo(
    () => (kindFilter ? collections.filter((collection) => collection.kind === kindFilter) : collections),
    [collections, kindFilter],
  );

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memberships.forEach((membership) => {
      counts[membership.collection_id] = (counts[membership.collection_id] || 0) + 1;
    });
    return counts;
  }, [memberships]);

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.sku || "").toLowerCase().includes(query),
    );
  }, [products, productSearch]);

  const productName = (id: string) => products.find((product) => product.id === id)?.name || "Unknown product";

  const openDialog = (row?: CollectionRow) => {
    setEditing(row || null);
    setProductSearch("");
    setForm(
      row
        ? {
            kind: row.kind === "drop" ? "drop" : "collection",
            name: row.name,
            slug: row.slug,
            description: row.description || "",
            hero_image: row.hero_image || "",
            release_date: row.release_date || "",
            limited_drop: row.limited_drop,
            is_active: row.is_active,
            is_featured: row.is_featured,
            sort_order: row.sort_order,
            productIds: memberships
              .filter((membership) => membership.collection_id === row.id)
              .map((membership) => membership.product_id),
          }
        : emptyForm,
    );
    setDialogOpen(true);
  };

  const resetDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      setForm(emptyForm);
      setProductSearch("");
    }
  };

  const toggleProduct = (id: string) => {
    setForm((previous) => ({
      ...previous,
      productIds: previous.productIds.includes(id)
        ? previous.productIds.filter((productId) => productId !== id)
        : [...previous.productIds, id],
    }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        kind: form.kind,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        hero_image: form.hero_image.trim() || null,
        release_date: form.release_date || null,
        limited_drop: form.limited_drop,
        is_active: form.is_active,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
      };

      let collectionId: string;
      if (editing) {
        const { error } = await supabase
          .from("sb_collections")
          .update(payload)
          .eq("id", editing.id)
          .eq("brand_id", SB_BRAND_ID);
        if (error) {
          toast({ title: "Error updating collection", description: error.message, variant: "destructive" });
          return;
        }
        collectionId = editing.id;
      } else {
        const { data, error } = await supabase
          .from("sb_collections")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) {
          toast({
            title: "Error creating collection",
            description: error?.message || "No collection id returned",
            variant: "destructive",
          });
          return;
        }
        collectionId = data.id;
      }

      const { error: deleteError } = await supabase
        .from("sb_collection_products")
        .delete()
        .eq("collection_id", collectionId)
        .eq("brand_id", SB_BRAND_ID);
      if (deleteError) {
        toast({ title: "Error updating collection products", description: deleteError.message, variant: "destructive" });
        return;
      }

      if (form.productIds.length > 0) {
        const { error: insertError } = await supabase.from("sb_collection_products").insert(
          form.productIds.map((productId, index) => ({
            brand_id: SB_BRAND_ID,
            collection_id: collectionId,
            product_id: productId,
            sort_order: index,
          })),
        );
        if (insertError) {
          toast({ title: "Error adding products to collection", description: insertError.message, variant: "destructive" });
          return;
        }
      }

      toast({ title: editing ? "Collection updated!" : "Collection created!" });
      resetDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving collection",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CollectionRow) => {
    if (!window.confirm(`Delete collection "${row.name}"?`)) return;
    const { error: placementError } = await supabase
      .from("sb_editorial_placements")
      .update({ collection_id: null })
      .eq("collection_id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (placementError) {
      toast({
        title: "Error unlinking collection placements",
        description: placementError.message,
        variant: "destructive",
      });
      return;
    }
    const { error: membershipError } = await supabase
      .from("sb_collection_products")
      .delete()
      .eq("collection_id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (membershipError) {
      toast({ title: "Error removing collection products", description: membershipError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("sb_collections")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting collection", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Collection deleted" });
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
            <Layers className="h-7 w-7" /> Collections &amp; Drops
          </h1>
          <p className="text-gray-500">Manage collections, drops and their product membership</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4" /> Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Collection" : "New Collection"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <select
                    className={selectClass}
                    value={form.kind}
                    onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as CollectionForm["kind"] }))}
                  >
                    <option value="collection">Collection</option>
                    <option value="drop">Drop</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Release Date</Label>
                  <Input
                    type="date"
                    value={form.release_date}
                    onChange={(e) => setForm((p) => ({ ...p, release_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))
                    }
                    placeholder="e.g., Street Essentials"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="street-essentials"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short collection story"
                  rows={3}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="sb-collection-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-collection-active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="sb-collection-featured"
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-collection-featured">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="sb-collection-limited"
                    type="checkbox"
                    checked={form.limited_drop}
                    onChange={(e) => setForm((p) => ({ ...p, limited_drop: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-collection-limited">Limited Drop</Label>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Products ({form.productIds.length} selected)</Label>
                  <span className="text-xs text-gray-400">Select one or more products</span>
                </div>
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                />
                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {visibleProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                      />
                      <span className="flex-1 truncate">{product.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{product.sku || product.category || "-"}</span>
                    </label>
                  ))}
                  {visibleProducts.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      {products.length === 0 ? "No products found for this brand." : "No products match your search."}
                    </div>
                  )}
                </div>
                {form.productIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {form.productIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleProduct(id)}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                        title={`Remove ${productName(id)}`}
                      >
                        {productName(id)} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => void save()}
                disabled={saving || !form.name.trim() || !form.slug.trim()}
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
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Kind</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-center px-4 py-3 font-medium">Products</th>
              <th className="text-left px-4 py-3 font-medium">Release</th>
              <th className="text-center px-4 py-3 font-medium">Flags</th>
              <th className="text-center px-4 py-3 font-medium">Order</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCollections.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 capitalize">{row.kind}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.slug}</td>
                <td className="px-4 py-3 text-center">{productCounts[row.id] || 0}</td>
                <td className="px-4 py-3 text-gray-500">{row.release_date || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-center gap-1">
                    {row.is_active && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>}
                    {row.is_featured && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Featured</span>}
                    {row.limited_drop && <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">Limited</span>}
                    {!row.is_active && !row.is_featured && !row.limited_drop && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
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
            {visibleCollections.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No collections yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SbCollections;
