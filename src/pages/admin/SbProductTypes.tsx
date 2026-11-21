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
import { Edit, Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ProductTypeRow = Database["public"]["Tables"]["sb_product_types"]["Row"];
type CompleteLookRuleRow = Database["public"]["Tables"]["sb_complete_look_rules"]["Row"];
type SubcategoryRow = Database["public"]["Tables"]["sb_product_subcategories"]["Row"];

interface CompleteLookRuleForm {
  source_type_code: string;
  suggested_type_code: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductTypeForm {
  code: string;
  label: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface SubcategoryForm {
  product_type_code: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: ProductTypeForm = {
  code: "",
  label: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

const emptyRule: CompleteLookRuleForm = {
  source_type_code: "TEE",
  suggested_type_code: "SHORTS",
  sort_order: 0,
  is_active: true,
};

const emptySubcategory: SubcategoryForm = {
  product_type_code: "TEE",
  name: "",
  slug: "",
  sort_order: 0,
  is_active: true,
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SbProductTypes = () => {
  const [rows, setRows] = useState<ProductTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductTypeRow | null>(null);
  const [form, setForm] = useState<ProductTypeForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [rules, setRules] = useState<CompleteLookRuleRow[]>([]);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CompleteLookRuleRow | null>(null);
  const [ruleForm, setRuleForm] = useState<CompleteLookRuleForm>(emptyRule);
  const [ruleSaving, setRuleSaving] = useState(false);

  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryRow | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryForm>(emptySubcategory);
  const [subcategorySaving, setSubcategorySaving] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [typesRes, rulesRes, subcategoriesRes] = await Promise.all([
      supabase
        .from("sb_product_types")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true })
        .order("code", { ascending: true }),
      supabase
        .from("sb_complete_look_rules")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("sb_product_subcategories")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("product_type_code", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);

    const failed = [typesRes, rulesRes, subcategoriesRes].find((result) => result.error);
    if (failed?.error) {
      toast({
        title: "Error loading SB taxonomy",
        description: failed.error.message,
        variant: "destructive",
      });
    } else {
      setRows(typesRes.data || []);
      setRules(rulesRes.data || []);
      setSubcategories(subcategoriesRes.data || []);
    }
    setLoading(false);
  };

  const openDialog = (row?: ProductTypeRow) => {
    setEditing(row || null);
    setForm(
      row
        ? {
            code: row.code,
            label: row.label,
            description: row.description || "",
            sort_order: row.sort_order,
            is_active: row.is_active,
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
    }
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const label = form.label.trim();
    if (!code || !label) {
      toast({ title: "Code and label are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        code,
        label,
        description: form.description.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (editing) {
        const { error } = await supabase
          .from("sb_product_types")
          .update(payload)
          .eq("id", editing.id)
          .eq("brand_id", SB_BRAND_ID);
        if (error) {
          toast({ title: "Error updating product type", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Product type updated!" });
      } else {
        const { error } = await supabase.from("sb_product_types").insert(payload);
        if (error) {
          toast({ title: "Error creating product type", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Product type created!" });
      }

      resetDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving product type",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ProductTypeRow) => {
    if (!window.confirm(`Delete product type "${row.label}"?`)) return;
    const { error } = await supabase
      .from("sb_product_types")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting product type", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product type deleted" });
    await fetchAll();
  };

  const openRuleDialog = (row?: CompleteLookRuleRow) => {
    setEditingRule(row || null);
    setRuleForm(
      row
        ? {
            source_type_code: row.source_type_code,
            suggested_type_code: row.suggested_type_code,
            sort_order: row.sort_order,
            is_active: row.is_active,
          }
        : emptyRule,
    );
    setRuleDialogOpen(true);
  };

  const resetRuleDialog = (open: boolean) => {
    setRuleDialogOpen(open);
    if (!open) {
      setEditingRule(null);
      setRuleForm(emptyRule);
    }
  };

  const saveRule = async () => {
    if (!ruleForm.source_type_code || !ruleForm.suggested_type_code) {
      toast({ title: "Both product types are required", variant: "destructive" });
      return;
    }
    setRuleSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        source_type_code: ruleForm.source_type_code,
        suggested_type_code: ruleForm.suggested_type_code,
        sort_order: ruleForm.sort_order,
        is_active: ruleForm.is_active,
      };
      const { error } = editingRule
        ? await supabase
            .from("sb_complete_look_rules")
            .update(payload)
            .eq("id", editingRule.id)
            .eq("brand_id", SB_BRAND_ID)
        : await supabase.from("sb_complete_look_rules").insert(payload);

      if (error) {
        toast({ title: "Error saving complete-the-look rule", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: editingRule ? "Rule updated!" : "Rule created!" });
      resetRuleDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRuleSaving(false);
    }
  };

  const removeRule = async (row: CompleteLookRuleRow) => {
    if (!window.confirm("Delete this complete-the-look rule?")) return;
    const { error } = await supabase
      .from("sb_complete_look_rules")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting rule", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rule deleted" });
    await fetchAll();
  };

  const openSubcategoryDialog = (row?: SubcategoryRow) => {
    setEditingSubcategory(row || null);
    setSubcategoryForm(
      row
        ? {
            product_type_code: row.product_type_code,
            name: row.name,
            slug: row.slug,
            sort_order: row.sort_order,
            is_active: row.is_active,
          }
        : emptySubcategory,
    );
    setSubcategoryDialogOpen(true);
  };

  const resetSubcategoryDialog = (open: boolean) => {
    setSubcategoryDialogOpen(open);
    if (!open) {
      setEditingSubcategory(null);
      setSubcategoryForm(emptySubcategory);
    }
  };

  const saveSubcategory = async () => {
    const name = subcategoryForm.name.trim();
    if (!subcategoryForm.product_type_code || !name) {
      toast({ title: "Product type and name are required", variant: "destructive" });
      return;
    }

    setSubcategorySaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        product_type_code: subcategoryForm.product_type_code,
        name,
        slug: subcategoryForm.slug.trim() || slugify(name),
        sort_order: subcategoryForm.sort_order,
        is_active: subcategoryForm.is_active,
      };
      const { error } = editingSubcategory
        ? await supabase
            .from("sb_product_subcategories")
            .update(payload)
            .eq("id", editingSubcategory.id)
            .eq("brand_id", SB_BRAND_ID)
        : await supabase.from("sb_product_subcategories").insert(payload);

      if (error) {
        toast({ title: "Error saving subcategory", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: editingSubcategory ? "Subcategory updated!" : "Subcategory created!" });
      resetSubcategoryDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving subcategory",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubcategorySaving(false);
    }
  };

  const removeSubcategory = async (row: SubcategoryRow) => {
    if (!window.confirm(`Delete subcategory "${row.name}"?`)) return;
    const { error } = await supabase
      .from("sb_product_subcategories")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting subcategory", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Subcategory deleted" });
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
            <Tag className="h-7 w-7" /> SB Product Types
          </h1>
          <p className="text-gray-500">Manage the Streetwear Blantyre product type taxonomy</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4" /> Add Product Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product Type" : "New Product Type"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="TEE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label *</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="T-Shirts"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: toNumber(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input
                    id="sb-product-type-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <Label htmlFor="sb-product-type-active">Active</Label>
                </div>
              </div>
              <Button onClick={() => void save()} disabled={saving || !form.code.trim() || !form.label.trim()} className="w-full">
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
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Label</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-center px-4 py-3 font-medium">Order</th>
              <th className="text-center px-4 py-3 font-medium">Active</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{row.code}</td>
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[280px] truncate">{row.description || "-"}</td>
                <td className="px-4 py-3 text-center">{row.sort_order}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {row.is_active ? "Yes" : "No"}
                  </span>
                </td>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No product types yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Complete-the-Look Rules</h2>
            <p className="text-sm text-gray-500">
              Automatic suggestions shown on product pages, based on product type.
            </p>
          </div>
          <Dialog open={ruleDialogOpen} onOpenChange={resetRuleDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => openRuleDialog()}>
                <Plus className="h-4 w-4" /> Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Edit Rule" : "New Complete-the-Look Rule"}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source Type *</Label>
                    <select
                      value={ruleForm.source_type_code}
                      onChange={(e) => setRuleForm((p) => ({ ...p, source_type_code: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {rows.filter((row) => row.is_active).map((row) => (
                        <option key={row.id} value={row.code}>{row.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Suggested Type *</Label>
                    <select
                      value={ruleForm.suggested_type_code}
                      onChange={(e) => setRuleForm((p) => ({ ...p, suggested_type_code: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {rows.filter((row) => row.is_active).map((row) => (
                        <option key={row.id} value={row.code}>{row.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={ruleForm.sort_order}
                      onChange={(e) => setRuleForm((p) => ({ ...p, sort_order: toNumber(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <input
                      id="sb-rule-active"
                      type="checkbox"
                      checked={ruleForm.is_active}
                      onChange={(e) => setRuleForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <Label htmlFor="sb-rule-active">Active</Label>
                  </div>
                </div>
                <Button
                  onClick={() => void saveRule()}
                  disabled={ruleSaving || !ruleForm.source_type_code || !ruleForm.suggested_type_code}
                  className="w-full"
                >
                  {ruleSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingRule ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Suggests</th>
                <th className="px-4 py-3 text-center font-medium">Order</th>
                <th className="px-4 py-3 text-center font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{rule.source_type_code}</td>
                  <td className="px-4 py-3 font-mono text-xs">{rule.suggested_type_code}</td>
                  <td className="px-4 py-3 text-center">{rule.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        rule.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rule.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openRuleDialog(rule)}>
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => void removeRule(rule)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No complete-the-look rules yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Category Subcategories</h2>
            <p className="text-sm text-gray-500">
              Manage selectable styles such as Graphic, Oversized and Utility within each category.
            </p>
          </div>
          <Dialog open={subcategoryDialogOpen} onOpenChange={resetSubcategoryDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => openSubcategoryDialog()}>
                <Plus className="h-4 w-4" /> Add Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "New Subcategory"}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select
                      value={subcategoryForm.product_type_code}
                      onChange={(e) =>
                        setSubcategoryForm((p) => ({ ...p, product_type_code: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {rows.filter((row) => row.is_active).map((row) => (
                        <option key={row.id} value={row.code}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={subcategoryForm.name}
                      onChange={(e) => setSubcategoryForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Graphic"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={subcategoryForm.slug}
                      onChange={(e) => setSubcategoryForm((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="auto-from-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={subcategoryForm.sort_order}
                      onChange={(e) => setSubcategoryForm((p) => ({ ...p, sort_order: toNumber(e.target.value) }))}
                    />
                  </div>
                </div>
                <label className="flex w-fit items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={subcategoryForm.is_active}
                    onChange={(e) => setSubcategoryForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  Active
                </label>
                <Button
                  onClick={() => void saveSubcategory()}
                  disabled={subcategorySaving || !subcategoryForm.product_type_code || !subcategoryForm.name.trim()}
                  className="w-full"
                >
                  {subcategorySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingSubcategory ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-center font-medium">Order</th>
                <th className="px-4 py-3 text-center font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{row.product_type_code}</td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.slug}</td>
                  <td className="px-4 py-3 text-center">{row.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openSubcategoryDialog(row)}>
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => void removeSubcategory(row)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {subcategories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No subcategories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SbProductTypes;
