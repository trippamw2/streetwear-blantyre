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
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BRANDS = [
  { id: "sb-original", name: "SB Original", color: "#FF6B00" },
  { id: "sb-street", name: "SB Street", color: "#1a1a1a" },
];
  { id: "oppo", name: "OPPO", color: "#00B5AD" },
  { id: "vivo", name: "Vivo", color: "#415FFF" },
  { id: "realme", name: "realme", color: "#FFB700" },
  { id: "infinix", name: "Infinix", color: "#E83E35" },
  { id: "tecno", name: "Tecno", color: "#0D8AE5" },
  { id: "itel", name: "Itel", color: "#00A0E9" },
  { id: "generic", name: "Generic", color: "#888888" },
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

interface Supplier {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  benefit: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  brand?: string;
  types: ProductType[];
  supplier_id?: string;
  stock_quantity?: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    benefit: "",
    price: 0,
    category: "t-shirts",
    images: [""],
    is_featured: false,
    is_best_seller: false,
    is_on_sale: false,
    discount_percent: 0,
    brand: "generic",
    types: [] as { id: string; name: string }[],
    supplier_id: "",
    stock_quantity: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const [{ data: productsData }, { data: allTypes }, { data: suppliersData }] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("product_types").select("*").order("sort_order", { ascending: true }),
      supabase.from("suppliers").select("id, name").order("name")
    ]);

    if (productsData) {
      const typeMap = new Map<string, ProductType[]>();
      (allTypes || []).forEach(t => {
        const existing = typeMap.get(t.product_id) || [];
        typeMap.set(t.product_id, [...existing, t]);
      });
      
      const productsWithTypes = productsData.map(p => ({
        ...p,
        types: typeMap.get(p.id) || []
      }));
      setProducts(productsWithTypes);
    }
    setSuppliers(suppliersData || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validImages = formData.images.filter(img => img.trim() !== "");
      const productData = {
        name: formData.name,
        benefit: formData.benefit,
        price: formData.price,
        category: formData.category,
        image: validImages[0] || "",
        images: validImages,
        is_featured: formData.is_featured,
        is_best_seller: formData.is_best_seller,
        is_on_sale: formData.is_on_sale,
        discount_percent: formData.discount_percent || 0,
        brand: formData.brand,
        is_active: true,
        sort_order: 0,
        supplier_id: formData.supplier_id || null,
        stock_quantity: formData.stock_quantity || 0,
      };

      if (editingProduct) {
        await supabase.from("products").update(productData).eq("id", editingProduct.id);
        
        // Delete old types
        const { error: deleteError } = await supabase.from("product_types").delete().eq("product_id", editingProduct.id);
        if (deleteError) {
          toast({ title: "Error updating types", variant: "destructive" });
          return;
        }
        
        // Insert new types
        for (let i = 0; i < formData.types.length; i++) {
          const { error: insertError } = await supabase.from("product_types").insert({
            product_id: editingProduct.id,
            name: formData.types[i].name,
            sort_order: i,
          });
          if (insertError) {
            toast({ title: "Error saving types", description: insertError.message, variant: "destructive" });
            return;
          }
        }
        
        toast({ title: "Product updated!" });
      } else {
        const { data: newProduct } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        
        if (newProduct) {
          for (let i = 0; i < formData.types.length; i++) {
            await supabase.from("product_types").insert({
              product_id: newProduct.id,
              name: formData.types[i].name,
              sort_order: i,
            });
          }
        }
        
        toast({ title: "Product created!" });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast({ title: "Error saving product", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this product?")) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
      toast({ title: "Product deleted" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      benefit: product.benefit || "",
      price: product.price,
      category: product.category,
      images: product.images && product.images.length > 0 ? product.images : [product.image || ""],
      is_featured: product.is_featured || false,
      is_best_seller: product.is_best_seller || false,
      is_on_sale: (product as any).is_on_sale || false,
      discount_percent: (product as any).discount_percent || 0,
      brand: product.brand || "generic",
      types: product.types,
      supplier_id: product.supplier_id || "",
      stock_quantity: product.stock_quantity || 0,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      benefit: "",
      price: 0,
      category: "t-shirts",
      images: [""],
      is_featured: false,
      is_best_seller: false,
      is_on_sale: false,
      discount_percent: 0,
      brand: "generic",
      types: [],
      supplier_id: "",
      stock_quantity: 0,
    });
  };

  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...formData.images];
    newImages[index] = url;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addType = () => {
    setFormData((prev) => ({
      ...prev,
      types: [...prev.types, { id: `t${Date.now()}`, name: "" }],
    }));
  };

  const updateType = (index: number, name: string) => {
    const newTypes = [...formData.types];
    newTypes[index] = { ...newTypes[index], name };
    setFormData((prev) => ({ ...prev, types: newTypes }));
  };

  const removeType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      types: prev.types.filter((_, i) => i !== index),
    }));
  };

  const getBrandName = (id: string) => BRANDS.find(b => b.id === id)?.name || "Generic";
  const getSupplierName = (id: string | undefined) => suppliers.find(s => s.id === id)?.name || "-";

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
          <h1 className="font-display font-bold text-3xl">Products</h1>
          <p className="text-gray-500">Manage your product catalog</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., SB Classic Logo Tee"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Product Images (URLs)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addImage}>
                    <Plus className="h-3 w-3" /> Add Image
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={img}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.images.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.images[0] && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formData.images.filter(i => i).map((img, i) => (
                        <img key={i} src={img} alt={`Preview ${i}`} className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Benefit/Description</Label>
                <Textarea
                  value={formData.benefit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefit: e.target.value }))}
                  placeholder="e.g., True wireless freedom..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (MWK) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {BRANDS.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_best_seller: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_on_sale}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_on_sale: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">On Sale</span>
                </label>
                {formData.is_on_sale && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Discount %</Label>
                    <Input
                      type="number"
                      className="w-20 h-9"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discount_percent: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      min={1}
                      max={99}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Product Variants (Types)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addType}>
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.types.map((type, index) => (
                    <div key={type.id} className="flex gap-2">
                      <Input
                        value={type.name}
                        onChange={(e) => updateType(index, e.target.value)}
                        placeholder="e.g., Black, White, 64GB..."
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeType(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {formData.types.length === 0 && (
                    <p className="text-sm text-gray-400">No variants. Click "Add" to add options like color/size.</p>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleSave} 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={saving || !formData.name}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Product</th>
              <th className="text-left p-4 font-medium">Brand</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Supplier</th>
              <th className="text-left p-4 font-medium">Stock</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-gray-100">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{product.benefit}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                    {getBrandName(product.brand || "generic")}
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-semibold">MK {product.price.toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {getSupplierName(product.supplier_id)}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (product.stock_quantity ?? 0) > 10 ? "bg-green-50 text-green-700" :
                    (product.stock_quantity ?? 0) > 0 ? "bg-yellow-50 text-yellow-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {product.stock_quantity ?? 0}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No products yet. Add your first product!
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;