import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Tag, Calendar, Users, Percent, DollarSign, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

const AdminPromos = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    min_order: 0,
    max_uses: 100,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        value: formData.value,
        min_order: formData.min_order,
        max_uses: formData.max_uses,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
      };

      if (editingPromo) {
        await supabase.from("promo_codes").update(promoData).eq("id", editingPromo.id);
        toast({ title: "Promo code updated!" });
      } else {
        await supabase.from("promo_codes").insert(promoData);
        toast({ title: "Promo code created!" });
      }

      setDialogOpen(false);
      setEditingPromo(null);
      resetForm();
      fetchPromos();
    } catch {
      toast({ title: "Error saving promo code", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this promo code?")) {
      await supabase.from("promo_codes").delete().eq("id", id);
      fetchPromos();
      toast({ title: "Promo code deleted" });
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      value: promo.value,
      min_order: promo.min_order,
      max_uses: promo.max_uses,
      start_date: promo.start_date.split("T")[0],
      end_date: promo.end_date?.split("T")[0] || "",
      is_active: promo.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      min_order: 0,
      max_uses: 100,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      is_active: true,
    });
  };

  const toggleActive = async (promo: PromoCode) => {
    await supabase.from("promo_codes").update({ is_active: !promo.is_active }).eq("id", promo.id);
    fetchPromos();
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
          <h1 className="font-display font-bold text-3xl">Promo Codes</h1>
          <p className="text-gray-500">Manage discount codes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPromo(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Plus className="h-4 w-4" /> Add Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SALE20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Holiday Sale"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as "percentage" | "fixed" }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (MWK)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(p => ({ ...p, value: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order (MWK)</Label>
                  <Input
                    type="number"
                    value={formData.min_order}
                    onChange={(e) => setFormData(p => ({ ...p, min_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(p => ({ ...p, max_uses: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800">
                {editingPromo ? "Update Promo Code" : "Create Promo Code"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {promos.map((promo) => (
          <div key={promo.id} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${promo.is_active ? "bg-green-100" : "bg-gray-100"}`}>
                  <Tag className={`h-6 w-6 ${promo.is_active ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{promo.code}</h3>
                  <p className="text-sm text-gray-500">{promo.name}</p>
                </div>
              </div>
              <button onClick={() => toggleActive(promo)} className="p-2">
                {promo.is_active ? (
                  <ToggleRight className="h-6 w-6 text-green-500" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-300" />
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                {promo.type === "percentage" ? (
                  <><Percent className="h-4 w-4" /> {promo.value}% off</>
                ) : (
                  <><DollarSign className="h-4 w-4" /> {formatMWK(promo.value)} off</>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" /> {promo.used_count}/{promo.max_uses} used
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <DollarSign className="h-4 w-4" /> Min {formatMWK(promo.min_order)}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="h-4 w-4" /> {promo.start_date?.split("T")[0]} - {promo.end_date?.split("T")[0] || "No expiry"}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                <Edit className="h-3 w-3" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(promo.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-border/60">
            <Tag className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No promo codes yet</p>
            <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-gray-900">
              <Plus className="h-4 w-4" /> Create First Promo Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPromos;