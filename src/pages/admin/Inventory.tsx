import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, TrendingUp, TrendingDown, Warehouse, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface InventoryItem {
  id: string;
  product_id: string;
  sku: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  cost_price_mwk: number;
  location: string;
  last_restocked: string | null;
}

const AdminInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { products } = useProducts();
  
  const [formData, setFormData] = useState({
    product_id: "",
    sku: "",
    quantity: 0,
    reorder_level: 5,
    cost_price_mwk: 0,
    location: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("product_id");
    
    setInventory(data || []);
    setLoading(false);
  };

  const handleSaveNew = async () => {
    const item = {
      product_id: formData.product_id,
      sku: formData.sku || `SKU-${Date.now()}`,
      quantity: formData.quantity,
      reserved_quantity: 0,
      reorder_level: formData.reorder_level,
      cost_price_mwk: formData.cost_price_mwk,
      location: formData.location,
    };

    const { error } = await supabase
      .from("inventory")
      .insert(item);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inventory added!" });
      setIsAddDialogOpen(false);
      resetForm();
      fetchInventory();
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from("inventory")
      .update({
        sku: formData.sku,
        quantity: formData.quantity,
        reorder_level: formData.reorder_level,
        cost_price_mwk: formData.cost_price_mwk,
        location: formData.location,
      })
      .eq("id", editingItem.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inventory updated!" });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      sku: item.sku,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      cost_price_mwk: item.cost_price_mwk,
      location: item.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (confirm(`Delete inventory for ${products.find(p => p.id === item.product_id)?.name || item.product_id}?`)) {
      await supabase.from("inventory").delete().eq("id", item.id);
      toast({ title: "Inventory deleted" });
      fetchInventory();
    }
  };

  const updateQuantity = async (item: InventoryItem, change: number, type: string) => {
    const { error } = await supabase
      .from("inventory")
      .update({ quantity: Math.max(0, item.quantity + change) })
      .eq("id", item.id);

    if (!error) {
      fetchInventory();
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      sku: "",
      quantity: 0,
      reorder_level: 5,
      cost_price_mwk: 0,
      location: "",
    });
  };

  const lowStock = inventory.filter(i => i.quantity <= i.reorder_level && i.quantity > 0);
  const outOfStock = inventory.filter(i => i.quantity === 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Inventory</h1>
          <p className="text-muted-foreground">Stock management</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4" /> Add to Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add to Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <select 
                  value={formData.product_id}
                  onChange={(e) => setFormData(p => ({ ...p, product_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select product</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    value={formData.sku}
                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input 
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData(p => ({ ...p, reorder_level: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (MWK)</Label>
                  <Input 
                    type="number"
                    value={formData.cost_price_mwk}
                    onChange={(e) => setFormData(p => ({ ...p, cost_price_mwk: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                    placeholder="Warehouse A"
                  />
                </div>
              </div>
              <Button onClick={handleSaveNew} className="w-full" disabled={!formData.product_id}>
                Add Inventory
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium">{products.find(p => p.id === editingItem?.product_id)?.name || editingItem?.product_id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    value={formData.sku}
                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input 
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData(p => ({ ...p, reorder_level: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (MWK)</Label>
                  <Input 
                    type="number"
                    value={formData.cost_price_mwk}
                    onChange={(e) => setFormData(p => ({ ...p, cost_price_mwk: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleUpdate} className="w-full">
                Update Inventory
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="font-display font-bold text-3xl">{inventory.length}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Total Stock</p>
          <p className="font-display font-bold text-3xl">
            {inventory.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="font-display font-bold text-3xl text-yellow-500">{lowStock.length}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="font-display font-bold text-3xl text-red-500">{outOfStock.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/60">
          <Warehouse className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No inventory yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">SKU</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Qty</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Cost</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const product = products.find(p => p.id === item.product_id);
                const isLow = item.quantity <= item.reorder_level && item.quantity > 0;
                const isOut = item.quantity === 0;
                
                return (
                  <tr key={item.id} className="border-t border-border/50">
                    <td className="p-4">
                      <p className="font-medium">{product?.name || item.product_id}</p>
                      {item.last_restocked && (
                        <p className="text-xs text-muted-foreground">
                          Restocked: {format(new Date(item.last_restocked), "PP")}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-secondary rounded text-xs">{item.sku}</span>
                    </td>
                    <td className="p-4 text-sm">{item.location || "-"}</td>
                    <td className="p-4 font-bold">{item.quantity}</td>
                    <td className="p-4">
                      {isOut ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive">Out of Stock</span>
                      ) : isLow ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">In Stock</span>
                      )}
                    </td>
                    <td className="p-4">{formatMWK(item.cost_price_mwk)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => updateQuantity(item, 10, "restock")}
                          title="Add 10"
                        >
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => updateQuantity(item, -1, "sale")}
                          title="Remove 1"
                        >
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(item)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;