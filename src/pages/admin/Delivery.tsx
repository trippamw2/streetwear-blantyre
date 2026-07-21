import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Truck, Loader2, MapPin } from "lucide-react";
import { formatMWK } from "@/data/products";

interface DeliveryCompany {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_same_day: boolean;
  service_area: string[];
  estimated_days: number;
  base_fee_mwk: number;
  is_active: boolean;
}

const AdminDelivery = () => {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_same_day: false,
    service_area: "all",
    estimated_days: 5,
    base_fee_mwk: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("delivery_companies")
      .select("*")
      .order("base_fee_mwk", { ascending: true });
    
    if (error) {
      console.error("Fetch error:", error);
    }
    setCompanies(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const companyData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        is_same_day: formData.is_same_day,
        service_area: formData.service_area === "all" ? ["all"] : [formData.service_area],
        estimated_days: formData.estimated_days,
        base_fee_mwk: formData.base_fee_mwk,
        is_active: true,
      };

      if (editingCompany) {
        await supabase.from("delivery_companies").update(companyData).eq("id", editingCompany.id);
        toast({ title: "Delivery company updated!" });
      } else {
        await supabase.from("delivery_companies").insert(companyData);
        toast({ title: "Delivery company created!" });
      }

      setIsDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      fetchCompanies();
    } catch (error) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this delivery company?")) {
      await supabase.from("delivery_companies").delete().eq("id", id);
      fetchCompanies();
      toast({ title: "Deleted" });
    }
  };

  const toggleActive = async (company: DeliveryCompany) => {
    await supabase
      .from("delivery_companies")
      .update({ is_active: !company.is_active })
      .eq("id", company.id);
    fetchCompanies();
  };

  const handleEdit = (company: DeliveryCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      slug: company.slug,
      description: company.description || "",
      is_same_day: company.is_same_day,
      service_area: company.service_area.includes("all") ? "all" : company.service_area[0] || "all",
      estimated_days: company.estimated_days,
      base_fee_mwk: company.base_fee_mwk,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      is_same_day: false,
      service_area: "all",
      estimated_days: 5,
      base_fee_mwk: 0,
    });
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
          <h1 className="font-display font-bold text-3xl">Delivery Options</h1>
          <p className="text-gray-500">Manage delivery companies and shipping options</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCompany(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4" /> Add Delivery Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Delivery" : "Add Delivery Company"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Free Delivery Nationwide"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g., Free delivery anywhere in Malawi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Days</Label>
                  <Input
                    type="number"
                    value={formData.estimated_days}
                    onChange={(e) => setFormData(p => ({ ...p, estimated_days: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fee (MWK)</Label>
                  <Input
                    type="number"
                    value={formData.base_fee_mwk}
                    onChange={(e) => setFormData(p => ({ ...p, base_fee_mwk: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Service Area</Label>
                <select
                  value={formData.service_area}
                  onChange={(e) => setFormData(p => ({ ...p, service_area: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Nationwide (All)</option>
                  <option value="blantyre">Blantyre</option>
                  <option value="lilongwe">Lilongwe</option>
                  <option value="mzuzu">Mzuzu</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_same_day}
                  onChange={(e) => setFormData(p => ({ ...p, is_same_day: e.target.checked }))}
                />
                <span className="text-sm">Same day delivery</span>
              </label>
              
              <Button 
                onClick={handleSave} 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={saving || !formData.name}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingCompany ? "Update" : "Add Company"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delivery Companies Grid */}
      {companies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Truck className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No delivery companies yet</p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4 bg-blue-500">Add First Company</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className={`bg-white border rounded-2xl p-6 ${!company.is_active && "opacity-50"}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${company.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {company.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {company.service_area.includes("all") ? "Nationwide" : company.service_area.join(", ")}
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Truck className="h-4 w-4" />
                  {company.estimated_days === 0 ? "Same day" : `${company.estimated_days} days`}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="font-bold text-lg text-green-600">
                  {company.base_fee_mwk === 0 ? "FREE" : formatMWK(company.base_fee_mwk)}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(company)}>
                    {company.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDelivery;