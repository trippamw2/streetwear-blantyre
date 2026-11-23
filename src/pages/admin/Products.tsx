import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Download, Printer } from "lucide-react";
import { AIWritingButton } from "@/components/admin/AIWritingButton";
import { toast } from "@/hooks/use-toast";
import { useWearableCategories } from "@/hooks/useWearableCategories";
import { SB_BRAND_ID, SB_PRODUCT_TYPE_LABELS } from "@/data/sbArchitecture";
import { useSbMerchandising } from "@/hooks/useSbMerchandising";
import { generateProductBarcode, downloadBarcodeLabel, printBarcodeLabel } from "@/lib/barcode";

const BRANDS = [
  { id: "sb-original", name: "Original", color: "#2563eb" },
  { id: "sb-street", name: "Street", color: "#1a1a1a" },
  { id: "oppo", name: "OPPO", color: "#00B5AD" },
  { id: "vivo", name: "Vivo", color: "#415FFF" },
  { id: "realme", name: "realme", color: "#FFB700" },
  { id: "infinix", name: "Infinix", color: "#E83E35" },
  { id: "tecno", name: "Tecno", color: "#0D8AE5" },
  { id: "itel", name: "Itel", color: "#00A0E9" },
  { id: "generic", name: "Generic", color: "#888888" },
];

// Categories are now loaded dynamically from the database (wearable_categories)

const CULTURE_PILLARS = [
  { id: "", label: "None" },
  { id: "music", label: "Music Culture" },
  { id: "sports", label: "Sports Culture" },
  { id: "faith", label: "Faith Culture" },
  { id: "hustle", label: "Hustle Culture" },
];

interface Supplier {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  name: string;
}

interface AdminVariant {
  id?: string;
  sku: string;
  size_label: string;
  color: string;
  price_mwk: number;
  compare_at_price_mwk: number | null;
  cost_price_mwk: number | null;
  stock_qty: number;
  weight_grams: number | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  benefit: string;
  price: number;
  category: string;
  subcategory?: string;
  product_type_code?: string;
  collection_name?: string;
  fit?: string;
  material?: string;
  gender_classification?: string;
  status?: string;
  compare_at_price?: number;
  cost_price?: number;
  limited_drop?: boolean;
  release_date?: string;
  care_instructions?: string;
  model_fit_note?: string;
  tags: string[];
  image: string;
  images: string[];
  gallery_images?: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_on_sale?: boolean;
  discount_percent?: number;
  culture_pillar?: string;
  culture_story?: string;
  culture_context?: string;
  brand?: string;
  types: ProductType[];
  variants: AdminVariant[];
  relatedIds: string[];
  completeLookIds: string[];
  supplier_id?: string;
  stock_quantity?: number;
  barcode?: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { collections, relations } = useSbMerchandising();
  const { categories: wearableCats } = useWearableCategories();
  const CATEGORIES = wearableCats.map((c) => ({ id: c.slug, label: c.name }));
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [subcategories, setSubcategories] = useState<{ name: string; product_type_code: string }[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    benefit: "",
    price: 0,
    compare_at_price: 0,
    cost_price: 0,
    category: "t-shirts",
    subcategory: "",
    product_type_code: "TEE",
    collection_name: "",
    fit: "Relaxed fit",
    material: "Cotton blend",
    gender_classification: "unisex",
    status: "active",
    limited_drop: false,
    release_date: "",
    care_instructions: "",
    model_fit_note: 'Model is 6\'0" and wears size L',
    tags: [] as string[],
    images: [""],
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: false,
    is_on_sale: false,
    discount_percent: 0,
    brand: "generic",
    types: [] as { id: string; name: string }[],
    variants: [] as AdminVariant[],
    relatedIds: [] as string[],
    completeLookIds: [] as string[],
    supplier_id: "",
    stock_quantity: 0,
    culture_pillar: "",
    culture_story: "",
    culture_context: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const [
      { data: productsData },
      { data: allTypes },
      { data: suppliersData },
      { data: variantRows },
      { data: tagRows },
      { data: subcategoryRows },
    ] = await Promise.all([
      supabase.from("products").select("*").eq("brand_id", SB_BRAND_ID).order("sort_order", { ascending: true }),
      supabase.from("product_types").select("*").order("sort_order", { ascending: true }),
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("sb_product_variants").select("*").eq("brand_id", SB_BRAND_ID).order("size_label"),
      supabase.from("sb_product_tags").select("*").eq("brand_id", SB_BRAND_ID).order("sort_order"),
      supabase.from("sb_product_subcategories").select("name, product_type_code").eq("brand_id", SB_BRAND_ID).order("sort_order"),
    ]);

    setSubcategories(subcategoryRows || []);

    if (productsData) {
      const typeMap = new Map<string, ProductType[]>();
      (allTypes || []).forEach(t => {
        const existing = typeMap.get(t.product_id) || [];
        typeMap.set(t.product_id, [...existing, t]);
      });
      
      const variantMap = new Map<string, AdminVariant[]>();
      (variantRows || []).forEach((variant) => {
        const list = variantMap.get(variant.product_id) || [];
        list.push({
          id: variant.id,
          sku: variant.sku,
          size_label: variant.size_label,
          color: variant.color,
          price_mwk: variant.price_mwk,
          compare_at_price_mwk: variant.compare_at_price_mwk,
          cost_price_mwk: variant.cost_price_mwk,
          stock_qty: variant.stock_qty,
          weight_grams: variant.weight_grams,
          is_active: variant.is_active,
        });
        variantMap.set(variant.product_id, list);
      });

      const tagMap = new Map<string, string[]>();
      (tagRows || []).forEach((tag) => {
        const tags = tagMap.get(tag.product_id) || [];
        tags.push(tag.tag);
        tagMap.set(tag.product_id, tags);
      });

      const productsWithTypes = productsData.map(p => ({
        ...p,
        types: typeMap.get(p.id) || [],
        variants: variantMap.get(p.id) || [],
        tags: tagMap.get(p.id) || [],
        relatedIds: relations
          .filter((relation) => relation.productId === p.id && relation.relationType === "related")
          .map((relation) => relation.relatedProductId),
        completeLookIds: relations
          .filter((relation) => relation.productId === p.id && relation.relationType === "complete_look")
          .map((relation) => relation.relatedProductId),
      }));
      setProducts(productsWithTypes);
    }
    setSuppliers(suppliersData || []);
    setLoading(false);
  };

  const syncArchitecture = async (productId: string) => {
    const validVariants = formData.variants.filter((variant) =>
      variant.size_label.trim() && variant.sku.trim(),
    );

    const { error: variantDeleteError } = await supabase
      .from("sb_product_variants")
      .delete()
      .eq("brand_id", SB_BRAND_ID)
      .eq("product_id", productId);
    if (variantDeleteError) throw variantDeleteError;

    if (validVariants.length > 0) {
      const { error: variantInsertError } = await supabase.from("sb_product_variants").insert(
        validVariants.map((variant) => ({
          brand_id: SB_BRAND_ID,
          product_id: productId,
          sku: variant.sku.trim(),
          size_label: variant.size_label.trim(),
          color: variant.color.trim() || "Black",
          price_mwk: variant.price_mwk || formData.price,
          compare_at_price_mwk: variant.compare_at_price_mwk || null,
          cost_price_mwk: variant.cost_price_mwk || null,
          stock_qty: Math.max(0, variant.stock_qty),
          weight_grams: variant.weight_grams || null,
          is_active: variant.is_active,
        })),
      );
      if (variantInsertError) throw variantInsertError;
    }

    const { error: relationDeleteError } = await supabase
      .from("sb_product_relations")
      .delete()
      .eq("brand_id", SB_BRAND_ID)
      .eq("product_id", productId);
    if (relationDeleteError) throw relationDeleteError;

    const relationRows = [
      ...formData.relatedIds.map((id) => ({ relation_type: "related", id })),
      ...formData.completeLookIds.map((id) => ({ relation_type: "complete_look", id })),
    ].filter((row) => row.id !== productId);
    if (relationRows.length > 0) {
      const { error: relationInsertError } = await supabase.from("sb_product_relations").insert(
        relationRows.map((row, index) => ({
          brand_id: SB_BRAND_ID,
          product_id: productId,
          related_product_id: row.id,
          relation_type: row.relation_type,
          sort_order: index,
        })),
      );
      if (relationInsertError) throw relationInsertError;
    }

    const { error: tagDeleteError } = await supabase
      .from("sb_product_tags")
      .delete()
      .eq("brand_id", SB_BRAND_ID)
      .eq("product_id", productId);
    if (tagDeleteError) throw tagDeleteError;

    const cleanTags = [...new Set(formData.tags.map((tag) => tag.trim()).filter(Boolean))];
    if (cleanTags.length > 0) {
      const { error: tagInsertError } = await supabase.from("sb_product_tags").insert(
        cleanTags.map((tag, index) => ({
          brand_id: SB_BRAND_ID,
          product_id: productId,
          tag,
          sort_order: index,
        })),
      );
      if (tagInsertError) throw tagInsertError;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validImages = formData.images.filter(img => img.trim() !== "");
      const productId = editingProduct ? editingProduct.id : `sb-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const slug = (formData.slug || formData.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const productData = {
        id: productId,
        name: formData.name,
        slug: slug || `${productId}-${Date.now().toString(36)}`,
        benefit: formData.benefit,
        description: formData.benefit,
        price: formData.price,
        compare_at_price: formData.compare_at_price || null,
        cost_price: formData.cost_price || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        product_type_code: formData.product_type_code,
        collection_name: formData.collection_name || null,
        fit: formData.fit || null,
        material: formData.material || null,
        gender_classification: formData.gender_classification,
        status: formData.status,
        limited_drop: formData.limited_drop,
        release_date: formData.release_date || null,
        care_instructions: formData.care_instructions || null,
        model_fit_note: formData.model_fit_note || null,
        image: validImages[0] || "",
        images: validImages,
        gallery_images: validImages,
        is_featured: formData.is_featured,
        is_best_seller: formData.is_best_seller,
        is_new_arrival: formData.is_new_arrival,
        featured: formData.is_featured,
        bestseller: formData.is_best_seller,
        new_arrival: formData.is_new_arrival,
        is_on_sale: formData.is_on_sale,
        discount_percent: formData.discount_percent || 0,
        brand: formData.brand,
        is_active: true,
        sort_order: 0,
        supplier_id: formData.supplier_id || null,
        stock_quantity: formData.stock_quantity || 0,
        culture_pillar: formData.culture_pillar || null,
        culture_story: formData.culture_story || null,
        culture_context: formData.culture_context || null,
        barcode: editingProduct?.barcode || generateProductBarcode(`sb-${Date.now().toString(36)}`),
      };

      if (editingProduct) {
        const { error: updateError } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
        if (updateError) {
          toast({ title: "Error updating product", description: updateError.message, variant: "destructive" });
          return;
        }
        
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
        
        await syncArchitecture(productId);
        toast({ title: "Product updated!" });
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        
        if (insertError) {
          toast({ title: "Error creating product", description: insertError.message, variant: "destructive" });
          return;
        }
        
        if (newProduct) {
          for (let i = 0; i < formData.types.length; i++) {
            const { error: typeError } = await supabase.from("product_types").insert({
              product_id: newProduct.id,
              name: formData.types[i].name,
              sort_order: i,
            });
            if (typeError) {
              toast({ title: "Error saving types", description: typeError.message, variant: "destructive" });
            }
          }
        }
        
        await syncArchitecture(productId);
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
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
        return;
      }
      fetchProducts();
      toast({ title: "Product deleted" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug || "",
      benefit: product.benefit || "",
      price: product.price,
      compare_at_price: product.compare_at_price || 0,
      cost_price: product.cost_price || 0,
      category: product.category,
      subcategory: product.subcategory || "",
      product_type_code: product.product_type_code || "TEE",
      collection_name: product.collection_name || "",
      fit: product.fit || "Relaxed fit",
      material: product.material || "Cotton blend",
      gender_classification: product.gender_classification || "unisex",
      status: product.status || "active",
      limited_drop: product.limited_drop || false,
      release_date: product.release_date || "",
      care_instructions: product.care_instructions || "",
      model_fit_note: product.model_fit_note || 'Model is 6\'0" and wears size L',
      tags: product.tags || [],
      images: product.gallery_images && product.gallery_images.length > 0
        ? product.gallery_images
        : product.images && product.images.length > 0 ? product.images : [product.image || ""],
      is_featured: product.is_featured || false,
      is_best_seller: product.is_best_seller || false,
      is_new_arrival: product.is_new_arrival || false,
      is_on_sale: product.is_on_sale || false,
      discount_percent: product.discount_percent || 0,
      brand: product.brand || "generic",
      types: product.types,
      variants: product.variants || [],
      relatedIds: product.relatedIds || [],
      completeLookIds: product.completeLookIds || [],
      supplier_id: product.supplier_id || "",
      stock_quantity: product.stock_quantity || 0,
      culture_pillar: product.culture_pillar || "",
      culture_story: product.culture_story || "",
      culture_context: product.culture_context || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      benefit: "",
      price: 0,
      compare_at_price: 0,
      cost_price: 0,
      category: "t-shirts",
      subcategory: "",
      product_type_code: "TEE",
      collection_name: "",
      fit: "Relaxed fit",
      material: "Cotton blend",
      gender_classification: "unisex",
      status: "active",
      limited_drop: false,
      release_date: "",
      care_instructions: "",
      model_fit_note: 'Model is 6\'0" and wears size L',
      tags: [],
      images: [""],
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: false,
      is_on_sale: false,
      discount_percent: 0,
      brand: "generic",
      types: [],
      variants: [],
      relatedIds: [],
      completeLookIds: [],
      supplier_id: "",
      stock_quantity: 0,
      culture_pillar: "",
      culture_story: "",
      culture_context: "",
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

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImage(index);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      if (urlData?.publicUrl) {
        updateImage(index, urlData.publicUrl);
        toast({ title: "Image uploaded successfully" });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(null);
    }
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

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: `STB-${Date.now().toString(36).toUpperCase()}`,
          size_label: "M",
          color: "Black",
          price_mwk: prev.price,
          compare_at_price_mwk: null,
          cost_price_mwk: null,
          stock_qty: 0,
          weight_grams: null,
          is_active: true,
        },
      ],
    }));
  };

  const updateVariant = (index: number, patch: Partial<AdminVariant>) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
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
            <Button className="">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Classic Logo Tee"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="auto-from-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <select
                    value={formData.product_type_code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, product_type_code: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {Object.entries(SB_PRODUCT_TYPE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory / Style</Label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No subcategory</option>
                    {subcategories
                      .filter((sub) => sub.product_type_code === formData.product_type_code)
                      .map((sub) => (
                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <select
                    value={formData.collection_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, collection_name: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.name}>{collection.name}</option>
                    ))}
                  </select>
                </div>
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
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={img}
                          onChange={(e) => updateImage(index, e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        <label className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index, file);
                            }}
                          />
                          {uploadingImage === index ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </label>
                        {formData.images.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      {img && (
                        <div className="flex gap-2 flex-wrap">
                          <img 
                            key={index}
                            src={img} 
                            alt={`Preview ${index}`} 
                            className="h-20 w-20 rounded-lg object-cover border border-gray-200" 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Benefit/Description</Label>
                  <AIWritingButton
                    contentTypes={["product_benefit"]}
                    variables={{ name: formData.name, category: formData.category, pillar: formData.culture_pillar }}
                    onGenerated={(_type, content) => setFormData(prev => ({ ...prev, benefit: content }))}
                  />
                </div>
                <Textarea
                  value={formData.benefit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefit: e.target.value }))}
                  placeholder="e.g., True wireless freedom..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                  <Label>Compare-at Price</Label>
                  <Input
                    type="number"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, compare_at_price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price</Label>
                  <Input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cost_price: parseInt(e.target.value) || 0 }))}
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

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Fit</Label>
                  <Input value={formData.fit} onChange={(e) => setFormData((prev) => ({ ...prev, fit: e.target.value }))} placeholder="Relaxed fit" />
                </div>
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input value={formData.material} onChange={(e) => setFormData((prev) => ({ ...prev, material: e.target.value }))} placeholder="Cotton blend" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={formData.gender_classification}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gender_classification: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Release Date</Label>
                  <Input type="date" value={formData.release_date} onChange={(e) => setFormData((prev) => ({ ...prev, release_date: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Model Fit Note</Label>
                  <Input value={formData.model_fit_note} onChange={(e) => setFormData((prev) => ({ ...prev, model_fit_note: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Care Instructions</Label>
                  <Input value={formData.care_instructions} onChange={(e) => setFormData((prev) => ({ ...prev, care_instructions: e.target.value }))} placeholder="Machine wash cold, inside out" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                  }))}
                  placeholder="graphic, oversized, limited drop"
                />
                <p className="text-xs text-gray-500">Comma-separated. Tags can be used for merchandising and campaigns.</p>
              </div>

              <div className="space-y-2">
                <Label>Culture Pillar</Label>
                <select
                  value={formData.culture_pillar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, culture_pillar: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {CULTURE_PILLARS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Culture Story</Label>
                  <AIWritingButton
                    contentTypes={["culture_story", "culture_context"]}
                    variables={{ name: formData.name, category: formData.category, pillar: formData.culture_pillar }}
                    onGenerated={(type, content) => {
                      if (type === "culture_story") setFormData(prev => ({ ...prev, culture_story: content }));
                      else setFormData(prev => ({ ...prev, culture_context: content }));
                    }}
                  />
                </div>
                <Textarea
                  value={formData.culture_story}
                  onChange={(e) => setFormData((prev) => ({ ...prev, culture_story: e.target.value }))}
                  placeholder="Editorial narrative about this piece, the story behind the culture..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Culture Context</Label>
                <Textarea
                  value={formData.culture_context}
                  onChange={(e) => setFormData((prev) => ({ ...prev, culture_context: e.target.value }))}
                  placeholder="Brief context, how this piece connects to the culture pillar..."
                  rows={2}
                />
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
                    checked={formData.is_new_arrival}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_new_arrival: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">New Arrival</span>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.limited_drop}
                    onChange={(e) => setFormData((prev) => ({ ...prev, limited_drop: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Limited Drop</span>
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
                  <Label>Structured Variants (Size / Color / SKU / Stock)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="h-3 w-3" /> Add Variant
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div key={variant.id || index} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-4">
                      <Input value={variant.size_label} onChange={(e) => updateVariant(index, { size_label: e.target.value })} placeholder="Size (M)" />
                      <Input value={variant.color} onChange={(e) => updateVariant(index, { color: e.target.value })} placeholder="Color" />
                      <Input value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} placeholder="SKU" />
                      <Input type="number" value={variant.price_mwk} onChange={(e) => updateVariant(index, { price_mwk: parseInt(e.target.value) || 0 })} placeholder="Price" />
                      <Input type="number" value={variant.stock_qty} onChange={(e) => updateVariant(index, { stock_qty: parseInt(e.target.value) || 0 })} placeholder="Stock" />
                      <Input type="number" value={variant.weight_grams || 0} onChange={(e) => updateVariant(index, { weight_grams: parseInt(e.target.value) || null })} placeholder="Weight (g)" />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={variant.is_active} onChange={(e) => updateVariant(index, { is_active: e.target.checked })} /> Active
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {formData.variants.length === 0 && (
                    <p className="text-sm text-gray-500">No structured variants yet. Add at least one size with SKU and stock.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Related Products</Label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {products.filter((p) => p.id !== editingProduct?.id).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.relatedIds.includes(p.id)}
                          onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            relatedIds: e.target.checked
                              ? [...prev.relatedIds, p.id]
                              : prev.relatedIds.filter((id) => id !== p.id),
                          }))}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Complete-the-Look Products</Label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {products.filter((p) => p.id !== editingProduct?.id).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.completeLookIds.includes(p.id)}
                          onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            completeLookIds: e.target.checked
                              ? [...prev.completeLookIds, p.id]
                              : prev.completeLookIds.filter((id) => id !== p.id),
                          }))}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Editorial and campaign placements for this product are managed in{" "}
                <Link to="/admin/campaigns" className="font-semibold text-primary hover:underline">
                  Campaigns → Placements
                </Link>
                .
              </p>
              
              <Button 
                onClick={handleSave} 
                className="w-full "
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
              <th className="text-left p-4 font-medium">Barcode</th>
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
                          <ImageIcon className="h-5 w-5 text-gray-600" />
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
                  {product.barcode ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-gray-600">{product.barcode}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Download barcode label"
                        onClick={() => downloadBarcodeLabel({
                          productName: product.name,
                          barcode: product.barcode!,
                          price: product.price,
                          category: CATEGORIES.find(c => c.id === product.category)?.label,
                          brand: getBrandName(product.brand || "generic"),
                        })}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Print barcode label"
                        onClick={() => printBarcodeLabel({
                          productName: product.name,
                          barcode: product.barcode!,
                          price: product.price,
                          category: CATEGORIES.find(c => c.id === product.category)?.label,
                          brand: getBrandName(product.brand || "generic"),
                        })}
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No barcode</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
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
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
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