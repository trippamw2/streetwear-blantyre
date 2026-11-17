import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { LeafletMap } from "@/components/lf/LeafletMap";
import { formatMWK } from "@/data/products";
import {
  Fish,
  Package,
  CalendarDays,
  ClipboardList,
  Truck,
  MapPin,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";

type Tab = "catalog" | "spices" | "recipes" | "media" | "pro" | "subscriptions" | "analytics" | "batches" | "slots" | "orders" | "preparation" | "delivery" | "route";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "catalog", label: "Catalog", icon: Fish },
  { key: "spices", label: "Spices", icon: Package },
  { key: "recipes", label: "Recipes", icon: Package },
  { key: "media", label: "Photos & Files", icon: ImageIcon },
  { key: "pro", label: "PRO", icon: Package },
  { key: "subscriptions", label: "Subs", icon: Package },
  { key: "analytics", label: "Analytics", icon: Package },
  { key: "batches", label: "Batches", icon: Package },
  { key: "slots", label: "Slots", icon: CalendarDays },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "preparation", label: "Preparation", icon: Package },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "route", label: "Route Map", icon: MapPin },
];

const uploadLfAsset = async (file: File, folder: string): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
  const path = `lf/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};

const AssetField = ({
  label,
  value,
  onChange,
  folder,
  accept = "image/*",
  kind = "image",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (next: string) => void | Promise<void>;
  folder: string;
  accept?: string;
  kind?: "image" | "pdf";
}) => {
  const [draft, setDraft] = useState(value || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadLfAsset(file, folder);
      setDraft(url);
      await onChange(url);
      toast({ title: kind === "pdf" ? "PDF attached" : "Photo updated" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={kind === "pdf" ? "PDF link" : "Image link"}
          className="h-8 min-w-0 flex-1 rounded border border-gray-300 px-2 text-xs"
        />
        <button
          type="button"
          onClick={() => void onChange(draft)}
          className="h-8 shrink-0 rounded border border-gray-300 px-2 text-[10px] font-bold uppercase"
        >
          Save
        </button>
        <label className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded bg-[#073B78] px-2 text-[10px] font-bold uppercase text-white">
          {busy ? "..." : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
      </div>
      {kind === "image" && draft ? (
        <img src={draft} alt={label} className="mt-2 h-16 w-full rounded object-cover" />
      ) : null}
      {kind === "pdf" && draft ? (
        <a href={draft} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#073B78] underline">
          <FileText className="h-3.5 w-3.5" /> Open PDF
        </a>
      ) : null}
    </div>
  );
};

const VALID_TABS: Tab[] = ["catalog", "spices", "recipes", "media", "pro", "subscriptions", "analytics", "batches", "slots", "orders", "preparation", "delivery", "route"];

const AdminLakeFresh = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "catalog";
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  // ---- Catalog state ----
  const [species, setSpecies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    species_id: "",
    name: "",
    price_per_kg_mwk: "",
    min_order_qty_kg: "0.5",
    preparation_options: "whole",
    availability_status: "available",
    is_active: true,
    image: "",
    description: "",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    species_id: "",
    name: "",
    price_per_kg_mwk: "",
    min_order_qty_kg: "0.5",
    preparation_options: "whole",
    availability_status: "available",
    image: "",
    description: "",
  });

  // ---- Batches state ----
  const [batches, setBatches] = useState<any[]>([]);
  const [batchForm, setBatchForm] = useState({
    species_id: "",
    received_date: new Date().toISOString().slice(0, 10),
    expiry_date: "",
    weight_kg_received: "",
    freshness_grade: "A",
    notes: "",
  });

  // ---- Slots state ----
  const [slots, setSlots] = useState<any[]>([]);
  const [genDays, setGenDays] = useState("14");
  const [genOrders, setGenOrders] = useState("20");
  const [genWeight, setGenWeight] = useState("50");

  // ---- Orders state ----
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
  const [routeOrders, setRouteOrders] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // ---- Preparation state ----
  const [preparations, setPreparations] = useState<any[]>([]);

  // ---- Delivery zones state ----
  const [zones, setZones] = useState<any[]>([]);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    slug: "",
    base_fee_mwk: "2000",
    min_order_mwk: "0",
  });
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneForm, setEditZoneForm] = useState({
    name: "",
    slug: "",
    base_fee_mwk: "0",
    min_order_mwk: "0",
  });

  // ---- Spices state ----
  const [spices, setSpices] = useState<any[]>([]);
  const [spiceForm, setSpiceForm] = useState({ name: "", price_mwk: "", size_label: "", stock_qty: "", ingredients: "", description: "", recommended_species: "", image: "" });
  const [editingSpiceId, setEditingSpiceId] = useState<string | null>(null);
  const [editSpiceForm, setEditSpiceForm] = useState({
    name: "",
    price_mwk: "",
    size_label: "",
    stock_qty: "",
    ingredients: "",
    description: "",
    recommended_species: "",
  });

  // ---- Recipes state ----
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeForm, setRecipeForm] = useState({
    title: "", slug: "", species_id: "", prep_time_min: "", cook_time_min: "", servings: "",
    cooking_method: "", recommended_spice: "", safety_notes: "",
    ingredients: "", steps: "", image: "", pdf_url: "",
  });

  // ---- PRO state ----
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  // ---- Analytics state ----
  const [analytics, setAnalytics] = useState<any>(null);

  // ---- Subscriptions state ----
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const loadSpecies = async () => {
    const { data } = await supabase
      .from("fish_species")
      .select("id, name, slug, image")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    setSpecies(data || []);
  };

  const updateSpeciesImage = async (id: string, image: string) => {
    const { error } = await supabase.from("fish_species").update({ image }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      setSpecies((prev) => prev.map((s: any) => (s.id === id ? { ...s, image } : s)));
      toast({ title: "Species photo saved" });
    }
  };

  const updateProductImage = async (id: string, image: string) => {
    const { error } = await supabase.from("fish_products").update({ image }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      setProducts((prev) => prev.map((p: any) => (p.id === id ? { ...p, image } : p)));
      toast({ title: "Product photo saved" });
    }
  };

  const updateSpiceImage = async (id: string, image: string) => {
    const { error } = await supabase.from("lf_spices").update({ image }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      setSpices((prev) => prev.map((s: any) => (s.id === id ? { ...s, image } : s)));
      toast({ title: "Spice photo saved" });
    }
  };

  const updateRecipeMedia = async (id: string, patch: { image?: string; pdf_url?: string }) => {
    const { error } = await supabase.from("lf_recipes").update(patch).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      setRecipes((prev) => prev.map((r: any) => (r.id === id ? { ...r, ...patch } : r)));
      toast({ title: "Recipe updated" });
    }
  };

  const toggleRecommendedSpecies = (value: string, id: string, onChange: (next: string) => void) => {
    const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange(next.join(","));
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("fish_products")
      .select("*, fish_species(name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    setProducts(data || []);
  };

  const loadSpices = async () => {
    const { data } = await supabase.from("lf_spices").select("*").eq("brand_id", LF_BRAND_ID).order("sort_order");
    setSpices(data || []);
  };

  const loadRecipes = async () => {
    const { data } = await supabase.from("lf_recipes").select("*, fish_species(name)").eq("brand_id", LF_BRAND_ID).order("sort_order");
    setRecipes(data || []);
  };

  const loadBusinessAccounts = async () => {
    const { data } = await supabase.from("business_accounts").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    setBusinessAccounts(data || []);
  };

  const loadQuotes = async () => {
    const { data } = await supabase.from("lf_quotes").select("*, lf_quote_items(*)").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    setQuotes(data || []);
  };

  const loadAnalytics = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_mwk, payment_status, status")
      .eq("brand_id", LF_BRAND_ID);
    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const revenue = paidOrders.reduce((s: number, o: any) => s + (o.total_mwk || 0), 0);
    const aov = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length) : 0;

    const orderIds = paidOrders.map((o: any) => o.id);
    const { data: items } = orderIds.length
      ? await supabase
          .from("order_items")
          .select("order_id, product_key, unit_price_mwk, quantity, recipe_title")
          .in("order_id", orderIds)
      : { data: [] };

    const ordersWithRecipes = new Set<string>();
    const ordersWithSpices = new Set<string>();
    const revenueByCategory: Record<string, number> = {};

    (items || []).forEach((it: any) => {
      const key = String(it.product_key || "");
      const cat = key.includes(":") ? key.split(":")[0] : "fish";
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (it.unit_price_mwk || 0) * (Number(it.quantity) || 1);
      if (it.recipe_title) ordersWithRecipes.add(it.order_id);
      if (cat === "spice") ordersWithSpices.add(it.order_id);
    });

    const eligible = paidOrders.length || 1;
    const recipeAttachment = Math.round((ordersWithRecipes.size / eligible) * 100);
    const spiceAttachment = Math.round((ordersWithSpices.size / eligible) * 100);

    // stock levels
    const { data: spices } = await supabase.from("lf_spices").select("stock_qty").eq("brand_id", LF_BRAND_ID);
    const { data: batches } = await supabase.from("fish_inventory_batches").select("weight_kg_available").eq("brand_id", LF_BRAND_ID);

    const stock = {
      spices: (spices || []).reduce((s: number, r: any) => s + (r.stock_qty || 0), 0),
      fishKg: (batches || []).reduce((s: number, r: any) => s + Number(r.weight_kg_available || 0), 0),
    };

    setAnalytics({
      totalOrders: orders?.length || 0,
      paidOrders: paidOrders.length,
      revenue,
      aov,
      recipeAttachment,
      spiceAttachment,
      revenueByCategory,
      stock,
    });
  };

  const loadSubscriptions = async () => {
    const { data } = await supabase.from("lf_subscriptions").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    setSubscriptions(data || []);
  };

  const loadBatches = async () => {
    const { data } = await supabase
      .from("fish_inventory_batches")
      .select("*, fish_species(name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("received_date", { ascending: false });
    setBatches(data || []);
  };

  const loadSlots = async () => {
    const { data } = await supabase
      .from("delivery_slots")
      .select("*, delivery_zones(name)")
      .eq("brand_id", LF_BRAND_ID)
      .gte("delivery_date", new Date().toISOString().slice(0, 10))
      .order("delivery_date")
      .limit(200);
    setSlots(data || []);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders(data || []);
  };

  const loadRouteOrders = async () => {
    setRouteLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .eq("delivery_date", routeDate)
      .not("status", "in", "(cancelled)")
      .order("created_at", { ascending: true });
    const ords = data || [];
    // fetch items for each
    const ids = ords.map((o: any) => o.id);
    let itemsByOrder: Record<string, any[]> = {};
    if (ids.length) {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, product_name, quantity, unit_price_mwk")
        .in("order_id", ids);
      for (const it of items || []) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      }
    }
    const enriched = ords.map((o: any) => ({ ...o, items: itemsByOrder[o.id] || [] }));
    setRouteOrders(enriched);
    setRouteLoading(false);
  };

  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const optimizeRoute = (ords: any[]) => {
    const withCoords = ords.filter((o) => o.delivery_lat != null && o.delivery_lng != null);
    const without = ords.filter((o) => o.delivery_lat == null || o.delivery_lng == null);
    if (withCoords.length === 0) return [...ords];
    // start from centroid-ish depot (Blantyre center) then nearest neighbor
    let current = { lat: -15.7861, lng: 35.0058 };
    const remaining = [...withCoords];
    const ordered: any[] = [];
    while (remaining.length) {
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((o, i) => {
        const d = haversineKm(current, { lat: o.delivery_lat, lng: o.delivery_lng });
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      current = { lat: next.delivery_lat, lng: next.delivery_lng };
    }
    return [...ordered, ...without];
  };

  const printRouteSheet = () => {
    const ordered = optimizeRoute(routeOrders);
    const rows = ordered
      .map((o, i) => {
        const items = (o.items || [])
          .map((it: any) => `${it.product_name} x ${it.quantity}`)
          .join(", ");
        return `<tr>
          <td>${i + 1}</td>
          <td>${o.customer_name || ""}</td>
          <td>${o.customer_phone || ""}</td>
          <td>${o.house_number || ""}</td>
          <td>${o.street_name || ""}</td>
          <td>${o.customer_location || ""}</td>
          <td>${o.delivery_place || ""}</td>
          <td>${items}</td>
          <td>${o.delivery_window || ""}</td>
          <td></td>
        </tr>`;
      })
      .join("");
    const html = `<!doctype html><html><head><title>Delivery route ${routeDate}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#111}
        h1{font-size:18px;margin-bottom:4px}
        .meta{font-size:12px;color:#555;margin-bottom:12px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #999;padding:6px;vertical-align:top}
        th{background:#073B78;color:#fff}
        .sign{height:40px}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Lake Fresh Fish Mart - Delivery Route Sheet</h1>
      <div class="meta">Date: ${routeDate} · ${ordered.length} stops · Driver signature: ____________</div>
      <table>
        <thead><tr>
          <th>#</th><th>Customer</th><th>Phone</th><th>House no.</th><th>Street</th><th>Area</th><th>Pinned place</th><th>Items</th><th>Window</th><th>Delivered (sign)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px;font-size:11px;color:#555">Keep this sheet with you. Tick each stop as delivered. Report any failed delivery with reason.</p>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data: items } = await supabase
      .from("order_items")
      .select("id, product_name, unit_price_mwk, quantity, recipe_title")
      .eq("order_id", orderId);
    const ids = (items || []).map((i: any) => i.id);
    const { data: prep } = ids.length
      ? await supabase.from("order_preparation").select("*").in("order_item_id", ids)
      : { data: [] };
    const prepByItem = new Map((prep || []).map((p: any) => [p.order_item_id, p]));
    setOrderItems((prev) => ({
      ...prev,
      [orderId]: (items || []).map((i: any) => ({ ...i, preparation: prepByItem.get(i.id) || null })),
    }));
  };

  const loadPreparations = async () => {
    const { data: items } = await supabase
      .from("order_items")
      .select("id, order_id, product_name, quantity")
      .eq("brand_id", LF_BRAND_ID);
    const itemIds = (items || []).map((i: any) => i.id);
    const { data: prep } = itemIds.length
      ? await supabase.from("order_preparation").select("*").in("order_item_id", itemIds)
      : { data: [] };
    const itemMap = new Map((items || []).map((i: any) => [i.id, i]));
    const orderIds = [...new Set((items || []).map((i: any) => i.order_id))];
    const { data: orders } = orderIds.length
      ? await supabase.from("orders").select("id, customer_name, payment_status, status").in("id", orderIds)
      : { data: [] };
    const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));
    setPreparations(
      (prep || []).map((p: any) => {
        const item = itemMap.get(p.order_item_id) as any;
        const order = item ? orderMap.get(item.order_id) : null;
        return { ...p, item, order };
      }),
    );
  };

  const loadZones = async () => {
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    setZones(data || []);
  };

  useEffect(() => {
    loadSpecies();
    loadProducts();
    loadSpices();
    loadRecipes();
    loadBusinessAccounts();
    loadQuotes();
    loadAnalytics();
    loadSubscriptions();
    loadBatches();
    loadSlots();
    loadOrders();
    loadPreparations();
    loadZones();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      loadSpecies(),
      loadProducts(),
      loadSpices(),
      loadRecipes(),
      loadBusinessAccounts(),
      loadQuotes(),
      loadAnalytics(),
      loadSubscriptions(),
      loadBatches(),
      loadSlots(),
      loadOrders(),
      loadPreparations(),
      loadZones(),
    ]);
    setLoading(false);
    toast({ title: "Refreshed" });
  };

  // ---- Catalog actions ----
  const handleCreateProduct = async () => {
    if (!productForm.species_id || !productForm.name || !productForm.price_per_kg_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("fish_products").insert({
      brand_id: LF_BRAND_ID,
      species_id: productForm.species_id,
      name: productForm.name,
      price_per_kg_mwk: Number(productForm.price_per_kg_mwk),
      min_order_qty_kg: Number(productForm.min_order_qty_kg),
      preparation_options: productForm.preparation_options.split(",").map((s) => s.trim()),
      availability_status: productForm.availability_status,
      is_active: productForm.is_active,
      image: productForm.image || null,
      description: productForm.description || null,
    });
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product created" });
    setProductForm({ ...productForm, name: "", price_per_kg_mwk: "", image: "", description: "" });
    await loadProducts();
  };

  const startEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setEditProductForm({
      species_id: product.fish_species?.id || product.species_id || "",
      name: product.name || "",
      price_per_kg_mwk: String(product.price_per_kg_mwk ?? ""),
      min_order_qty_kg: String(product.min_order_qty_kg ?? "0.5"),
      preparation_options: Array.isArray(product.preparation_options) ? product.preparation_options.join(", ") : "whole",
      availability_status: product.availability_status || "available",
      image: product.image || "",
      description: product.description || "",
    });
  };

  const saveEditedProduct = async () => {
    if (!editingProductId) return;
    if (!editProductForm.name || !editProductForm.price_per_kg_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("fish_products").update({
      brand_id: LF_BRAND_ID,
      species_id: editProductForm.species_id || undefined,
      name: editProductForm.name,
      price_per_kg_mwk: Number(editProductForm.price_per_kg_mwk),
      min_order_qty_kg: Number(editProductForm.min_order_qty_kg),
      preparation_options: editProductForm.preparation_options.split(",").map((s) => s.trim()).filter(Boolean),
      availability_status: editProductForm.availability_status,
      image: editProductForm.image || null,
      description: editProductForm.description || null,
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product updated" });
    setEditingProductId(null);
    await loadProducts();
  };

  const handleCreateSpice = async () => {
    if (!spiceForm.name || !spiceForm.price_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lf_spices").insert({
      brand_id: LF_BRAND_ID,
      name: spiceForm.name,
      description: spiceForm.description || null,
      price_mwk: Number(spiceForm.price_mwk),
      size_label: spiceForm.size_label || null,
      stock_qty: Number(spiceForm.stock_qty || 0),
      ingredients: spiceForm.ingredients || null,
      is_active: true,
      recommended_species: spiceForm.recommended_species.split(",").map((s) => s.trim()).filter(Boolean),
      image: spiceForm.image || null,
    });
    if (error) toast({ title: "Create failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Spice created" });
      setSpiceForm({ name: "", price_mwk: "", size_label: "", stock_qty: "", ingredients: "", description: "", recommended_species: "", image: "" });
      await loadSpices();
    }
  };

  const handleCreateRecipe = async () => {
    if (!recipeForm.title || !recipeForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lf_recipes").insert({
      brand_id: LF_BRAND_ID,
      title: recipeForm.title,
      slug: recipeForm.slug,
      species_id: recipeForm.species_id || null,
      prep_time_min: recipeForm.prep_time_min ? Number(recipeForm.prep_time_min) : null,
      cook_time_min: recipeForm.cook_time_min ? Number(recipeForm.cook_time_min) : null,
      servings: recipeForm.servings ? Number(recipeForm.servings) : null,
      cooking_method: recipeForm.cooking_method || null,
      recommended_spice: recipeForm.recommended_spice || null,
      safety_notes: recipeForm.safety_notes || null,
      ingredients: recipeForm.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: recipeForm.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      is_active: true,
      image: recipeForm.image || null,
      pdf_url: recipeForm.pdf_url || null,
    });
    if (error) toast({ title: "Create failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Recipe created" });
      setRecipeForm({ title: "", slug: "", species_id: "", prep_time_min: "", cook_time_min: "", servings: "", cooking_method: "", recommended_spice: "", safety_notes: "", ingredients: "", steps: "", image: "", pdf_url: "" });
      await loadRecipes();
    }
  };

  const toggleRecipeActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("lf_recipes").update({ is_active: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadRecipes();
  };

  const approveBusiness = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("business_accounts")
      .update({ approval_status: status, approved_at: new Date().toISOString(), approved_by: null })
      .eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: `Account ${status}` }); await loadBusinessAccounts(); }
  };

  const updateSubscriptionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("lf_subscriptions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Updated" }); await loadSubscriptions(); }
  };

  const toggleSpiceActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("lf_spices").update({ is_active: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadSpices();
  };

  const startEditSpice = (spice: any) => {
    setEditingSpiceId(spice.id);
    setEditSpiceForm({
      name: spice.name || "",
      price_mwk: String(spice.price_mwk ?? ""),
      size_label: spice.size_label || "",
      stock_qty: String(spice.stock_qty ?? "0"),
      ingredients: spice.ingredients || "",
      description: spice.description || "",
      recommended_species: (spice.recommended_species || []).join(", "),
    });
  };

  const saveEditedSpice = async () => {
    if (!editingSpiceId) return;
    if (!editSpiceForm.name || !editSpiceForm.price_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lf_spices").update({
      name: editSpiceForm.name,
      price_mwk: Number(editSpiceForm.price_mwk),
      size_label: editSpiceForm.size_label || null,
      stock_qty: Number(editSpiceForm.stock_qty || 0),
      ingredients: editSpiceForm.ingredients || null,
      description: editSpiceForm.description || null,
      recommended_species: editSpiceForm.recommended_species.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Spice updated" });
    setEditingSpiceId(null);
    await loadSpices();
  };

  const toggleProductActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("fish_products").update({ is_active: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadProducts();
  };

  // ---- Delivery zone actions ----
  const startEditZone = (zone: any) => {
    setEditingZoneId(zone.id);
    setEditZoneForm({
      name: zone.name || "",
      slug: zone.slug || "",
      base_fee_mwk: String(zone.base_fee_mwk ?? "0"),
      min_order_mwk: String(zone.min_order_mwk ?? "0"),
    });
  };

  const saveEditedZone = async () => {
    if (!editingZoneId) return;
    if (!editZoneForm.name || !editZoneForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("delivery_zones").update({
      name: editZoneForm.name,
      slug: editZoneForm.slug,
      base_fee_mwk: Number(editZoneForm.base_fee_mwk),
      min_order_mwk: Number(editZoneForm.min_order_mwk),
    }).eq("id", editingZoneId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Zone updated" });
    setEditingZoneId(null);
    await loadZones();
  };

  // ---- Batch actions ----
  const handleCreateBatch = async () => {
    if (!batchForm.species_id || !batchForm.weight_kg_received) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("fish_inventory_batches").insert({
      brand_id: LF_BRAND_ID,
      species_id: batchForm.species_id,
      received_date: batchForm.received_date,
      expiry_date: batchForm.expiry_date || null,
      weight_kg_received: Number(batchForm.weight_kg_received),
      weight_kg_available: Number(batchForm.weight_kg_received),
      weight_kg_reserved: 0,
      weight_kg_sold: 0,
      freshness_grade: batchForm.freshness_grade,
      notes: batchForm.notes || null,
    });
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Batch added" });
    setBatchForm({ ...batchForm, weight_kg_received: "", notes: "" });
    await loadBatches();
  };

  // ---- Slot actions ----
  const handleGenerateSlots = async () => {
    const { error } = await supabase.rpc("lf_generate_delivery_slots", {
      p_days: Number(genDays),
      p_capacity_orders: Number(genOrders),
      p_capacity_weight_kg: Number(genWeight),
    });
    if (error) toast({ title: "Generate failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Slots generated" });
      await loadSlots();
    }
  };

  const toggleSlotOpen = async (id: string, next: boolean) => {
    const { error } = await supabase.from("delivery_slots").update({ is_open: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadSlots();
  };

  // ---- Order actions ----
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Status updated" });
      await loadOrders();
    }
  };

  const markOrderPaid = async (orderId: string) => {
    const { data, error } = await supabase.rpc("mark_order_paid", { p_order_id: orderId });
    if (error) {
      toast({ title: "Mark paid failed", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.ok) {
      toast({ title: "Order marked paid" });
      await loadOrders();
    } else {
      toast({ title: "Not marked paid", description: (data as any)?.outcome, variant: "destructive" });
    }
  };

  // ---- Preparation actions ----
  const savePreparation = async (prepId: string, packedWeight: string, finalPrice: string) => {
    const { error } = await supabase
      .from("order_preparation")
      .update({
        packed_weight_kg: packedWeight ? Number(packedWeight) : null,
        final_price_mwk: finalPrice ? Number(finalPrice) : null,
        reconciled_at: new Date().toISOString(),
        reconciled_by: user?.id || null,
      })
      .eq("id", prepId);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Preparation saved" });
      await loadPreparations();
    }
  };

  // ---- Zone actions ----
  const handleCreateZone = async () => {
    if (!zoneForm.name || !zoneForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("delivery_zones").insert({
      brand_id: LF_BRAND_ID,
      name: zoneForm.name,
      slug: zoneForm.slug,
      base_fee_mwk: Number(zoneForm.base_fee_mwk),
      min_order_mwk: Number(zoneForm.min_order_mwk),
      is_active: true,
    });
    if (error) toast({ title: "Create failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Zone created" });
      setZoneForm({ name: "", slug: "", base_fee_mwk: "2000", min_order_mwk: "0" });
      await loadZones();
    }
  };

  const toggleZoneActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("delivery_zones").update({ is_active: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadZones();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Lake Fresh Admin</h1>
          <p className="text-sm text-muted-foreground">
            Fish mart only. Manage catalog, photos, recipes, slots, orders, preparation and delivery.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.key ? "bg-[#073B78] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* CATALOG */}
      {tab === "catalog" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Add fish product</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Species</Label>
                <select
                  value={productForm.species_id}
                  onChange={(e) => setProductForm({ ...productForm, species_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {species.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Price / kg (MWK)</Label>
                <Input type="number" value={productForm.price_per_kg_mwk} onChange={(e) => setProductForm({ ...productForm, price_per_kg_mwk: e.target.value })} />
              </div>
              <div>
                <Label>Min order (kg)</Label>
                <Input type="number" step="0.1" value={productForm.min_order_qty_kg} onChange={(e) => setProductForm({ ...productForm, min_order_qty_kg: e.target.value })} />
              </div>
              <div>
                <Label>Preparation (comma separated)</Label>
                <Input value={productForm.preparation_options} onChange={(e) => setProductForm({ ...productForm, preparation_options: e.target.value })} />
              </div>
              <div>
                <Label>Availability</Label>
                <select
                  value={productForm.availability_status}
                  onChange={(e) => setProductForm({ ...productForm, availability_status: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="sold_out">Sold out</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <AssetField
                  label="Product photo"
                  value={productForm.image}
                  folder="fish"
                  onChange={(next) => setProductForm((prev) => ({ ...prev, image: next }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-2" /> Add product
            </Button>
          </div>

          {editingProductId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit fish product</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Species</Label>
                  <select
                    value={editProductForm.species_id}
                    onChange={(e) => setEditProductForm({ ...editProductForm, species_id: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {species.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={editProductForm.name} onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Price / kg (MWK)</Label>
                  <Input type="number" value={editProductForm.price_per_kg_mwk} onChange={(e) => setEditProductForm({ ...editProductForm, price_per_kg_mwk: e.target.value })} />
                </div>
                <div>
                  <Label>Min order (kg)</Label>
                  <Input type="number" step="0.1" value={editProductForm.min_order_qty_kg} onChange={(e) => setEditProductForm({ ...editProductForm, min_order_qty_kg: e.target.value })} />
                </div>
                <div>
                  <Label>Preparation (comma separated)</Label>
                  <Input value={editProductForm.preparation_options} onChange={(e) => setEditProductForm({ ...editProductForm, preparation_options: e.target.value })} />
                </div>
                <div>
                  <Label>Availability</Label>
                  <select
                    value={editProductForm.availability_status}
                    onChange={(e) => setEditProductForm({ ...editProductForm, availability_status: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="sold_out">Sold out</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Short description</Label>
                  <Textarea
                    value={editProductForm.description}
                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedProduct()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingProductId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Species</th>
                  <th className="px-4 py-3 text-right">Price/kg</th>
                  <th className="px-4 py-3 text-right">Min kg</th>
                  <th className="px-4 py-3 text-left">Prep</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.fish_species?.name || "N/A"}</td>
                    <td className="px-4 py-3 text-right">{formatMWK(p.price_per_kg_mwk)}</td>
                    <td className="px-4 py-3 text-right">{p.min_order_qty_kg}</td>
                    <td className="px-4 py-3">{(p.preparation_options || []).join(", ")}</td>
                    <td className="px-4 py-3">{p.availability_status}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEditProduct(p)}
                          className="text-xs font-bold text-[#073B78] underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleProductActive(p.id, !p.is_active)}
                          className={`text-xs font-bold ${p.is_active ? "text-[#39B54A]" : "text-gray-400"}`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No products yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SPICES */}
      {tab === "spices" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Add spice</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Name</Label>
                <Input value={spiceForm.name} onChange={(e) => setSpiceForm({ ...spiceForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Price (MWK)</Label>
                <Input type="number" value={spiceForm.price_mwk} onChange={(e) => setSpiceForm({ ...spiceForm, price_mwk: e.target.value })} />
              </div>
              <div>
                <Label>Size label</Label>
                <Input value={spiceForm.size_label} onChange={(e) => setSpiceForm({ ...spiceForm, size_label: e.target.value })} placeholder="100g" />
              </div>
              <div>
                <Label>Stock qty</Label>
                <Input type="number" value={spiceForm.stock_qty} onChange={(e) => setSpiceForm({ ...spiceForm, stock_qty: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Ingredients</Label>
                <Input value={spiceForm.ingredients} onChange={(e) => setSpiceForm({ ...spiceForm, ingredients: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Pairs with fish</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {species.map((sp) => {
                    const checked = spiceForm.recommended_species
                      .split(",")
                      .map((value) => value.trim())
                      .includes(sp.id);
                    return (
                      <label
                        key={sp.id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          checked
                            ? "border-[#39B54A] bg-[#7ED321]/10 text-[#073B78]"
                            : "border-gray-300 text-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleRecommendedSpecies(spiceForm.recommended_species, sp.id, (next) =>
                              setSpiceForm({ ...spiceForm, recommended_species: next })
                            )
                          }
                          className="h-3.5 w-3.5 accent-[#39B54A]"
                        />
                        {sp.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-3">
                <Label>Description</Label>
                <Textarea value={spiceForm.description} onChange={(e) => setSpiceForm({ ...spiceForm, description: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <AssetField
                  label="Spice photo"
                  value={spiceForm.image}
                  folder="spices"
                  onChange={(next) => setSpiceForm((prev) => ({ ...prev, image: next }))}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateSpice}>
              <Plus className="h-4 w-4 mr-2" /> Add spice
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-left">Pairs with</th>
                  <th className="px-4 py-3 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {spices.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.size_label || "N/A"}</td>
                    <td className="px-4 py-3 text-right">{formatMWK(s.price_mwk)}</td>
                    <td className="px-4 py-3 text-right">{s.stock_qty}</td>
                    <td className="px-4 py-3 text-xs">{(s.recommended_species || []).map((id: string) => species.find((sp: any) => sp.id === id)?.name).filter(Boolean).join(", ") || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEditSpice(s)} className="text-xs font-bold text-[#073B78] underline">
                          Edit
                        </button>
                        <button onClick={() => toggleSpiceActive(s.id, !s.is_active)} className={`text-xs font-bold ${s.is_active ? "text-[#39B54A]" : "text-gray-400"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spices.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No spices yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECIPES */}
      {tab === "recipes" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Add recipe</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Title</Label>
                <Input value={recipeForm.title} onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={recipeForm.slug} onChange={(e) => setRecipeForm({ ...recipeForm, slug: e.target.value })} />
              </div>
              <div>
                <Label>Species</Label>
                <select value={recipeForm.species_id} onChange={(e) => setRecipeForm({ ...recipeForm, species_id: e.target.value, recommended_spice: "" })} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm">
                  <option value="">Select...</option>
                  {species.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <Label>Prep time (min)</Label>
                <Input type="number" value={recipeForm.prep_time_min} onChange={(e) => setRecipeForm({ ...recipeForm, prep_time_min: e.target.value })} />
              </div>
              <div>
                <Label>Cook time (min)</Label>
                <Input type="number" value={recipeForm.cook_time_min} onChange={(e) => setRecipeForm({ ...recipeForm, cook_time_min: e.target.value })} />
              </div>
              <div>
                <Label>Servings</Label>
                <Input type="number" value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })} />
              </div>
              <div>
                <Label>Cooking method</Label>
                <Input value={recipeForm.cooking_method} onChange={(e) => setRecipeForm({ ...recipeForm, cooking_method: e.target.value })} />
              </div>
              <div>
                <Label>Recommended spice</Label>
                <select
                  value={recipeForm.recommended_spice}
                  onChange={(e) => setRecipeForm({ ...recipeForm, recommended_spice: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option value="">None</option>
                  {spices
                    .filter(
                      (s: any) =>
                        !recipeForm.species_id ||
                        (s.recommended_species || []).includes(recipeForm.species_id)
                    )
                    .map((s: any) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <Label>Ingredients (one per line)</Label>
                <Textarea value={recipeForm.ingredients} onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <Label>Steps (one per line)</Label>
                <Textarea value={recipeForm.steps} onChange={(e) => setRecipeForm({ ...recipeForm, steps: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <Label>Safety notes</Label>
                <Textarea value={recipeForm.safety_notes} onChange={(e) => setRecipeForm({ ...recipeForm, safety_notes: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <AssetField
                  label="Recipe photo"
                  value={recipeForm.image}
                  folder="recipes"
                  onChange={(next) => setRecipeForm((prev) => ({ ...prev, image: next }))}
                />
              </div>
              <div className="sm:col-span-2">
                <AssetField
                  label="Recipe PDF"
                  value={recipeForm.pdf_url}
                  folder="recipes"
                  accept="application/pdf"
                  kind="pdf"
                  onChange={(next) => setRecipeForm((prev) => ({ ...prev, pdf_url: next }))}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateRecipe}>
              <Plus className="h-4 w-4 mr-2" /> Add recipe
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Species</th>
                  <th className="px-4 py-3 text-right">Prep</th>
                  <th className="px-4 py-3 text-right">Cook</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Pairs with</th>
                  <th className="px-4 py-3 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3">{r.fish_species?.name || "N/A"}</td>
                    <td className="px-4 py-3 text-right">{r.prep_time_min ?? "N/A"}</td>
                    <td className="px-4 py-3 text-right">{r.cook_time_min ?? "N/A"}</td>
                    <td className="px-4 py-3">{r.cooking_method || "N/A"}</td>
                    <td className="px-4 py-3 text-xs">{r.recommended_spice || "N/A"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRecipeActive(r.id, !r.is_active)} className={`text-xs font-bold ${r.is_active ? "text-[#39B54A]" : "text-gray-400"}`}>
                        {r.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
                {recipes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No recipes yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDIA */}
      {tab === "media" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Fish species photos</h2>
            <p className="mb-4 text-sm text-gray-500">
              These photos appear on the Lake Fresh home page and filter chips.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {species.map((s) => (
                <AssetField
                  key={s.id}
                  label={s.name}
                  value={s.image}
                  folder="species"
                  onChange={(next) => updateSpeciesImage(s.id, next)}
                />
              ))}
              {species.length === 0 && <p className="text-sm text-gray-500">No species yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Fish product photos</h2>
            <p className="mb-4 text-sm text-gray-500">Used on catalog cards and the product page.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <AssetField
                  key={p.id}
                  label={p.name}
                  value={p.image}
                  folder="fish"
                  onChange={(next) => updateProductImage(p.id, next)}
                />
              ))}
              {products.length === 0 && <p className="text-sm text-gray-500">No fish products yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Spice photos</h2>
            <p className="mb-4 text-sm text-gray-500">Each spice gets a clean pack photo.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spices.map((s) => (
                <AssetField
                  key={s.id}
                  label={s.name}
                  value={s.image}
                  folder="spices"
                  onChange={(next) => updateSpiceImage(s.id, next)}
                />
              ))}
              {spices.length === 0 && <p className="text-sm text-gray-500">No spices yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Recipe photos and PDFs</h2>
            <p className="mb-4 text-sm text-gray-500">
              The PDF attached to a recipe is emailed to the customer when their order is confirmed.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r) => (
                <div key={r.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-bold">{r.title}</p>
                  <AssetField
                    label="Photo"
                    value={r.image}
                    folder="recipes"
                    onChange={(next) => updateRecipeMedia(r.id, { image: next })}
                  />
                  <AssetField
                    label="PDF"
                    value={r.pdf_url}
                    folder="recipes"
                    accept="application/pdf"
                    kind="pdf"
                    onChange={(next) => updateRecipeMedia(r.id, { pdf_url: next })}
                  />
                </div>
              ))}
              {recipes.length === 0 && <p className="text-sm text-gray-500">No recipes yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* PRO */}
      {tab === "pro" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Business accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businessAccounts.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{b.company_name}</td>
                      <td className="px-4 py-3">{b.business_type || "N/A"}</td>
                      <td className="px-4 py-3">{b.contact_name || "N/A"}</td>
                      <td className="px-4 py-3">{b.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${b.approval_status === "approved" ? "text-[#39B54A]" : b.approval_status === "rejected" ? "text-red-600" : "text-amber-600"}`}>
                          {b.approval_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {b.approval_status !== "approved" && (
                          <button onClick={() => approveBusiness(b.id, "approved")} className="text-xs font-bold text-[#39B54A]">Approve</button>
                        )}
                        {b.approval_status !== "rejected" && (
                          <button onClick={() => approveBusiness(b.id, "rejected")} className="text-xs font-bold text-red-600">Reject</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {businessAccounts.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No business accounts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Quote requests</h2>
            <div className="space-y-4">
              {quotes.map((q) => (
                <div key={q.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#073B78]">{q.requester_name}</p>
                      <p className="text-xs text-gray-500">{q.requester_email || "N/A"} · {q.requester_phone || "N/A"}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600">{q.status}</span>
                  </div>
                  {q.notes ? <p className="mt-2 text-sm text-gray-600">{q.notes}</p> : null}
                  {Array.isArray(q.lf_quote_items) && q.lf_quote_items.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      {q.lf_quote_items.map((it: any) => (
                        <li key={it.id}>• {it.product_name} × {it.quantity} {it.unit || ""}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {quotes.length === 0 && (
                <p className="text-sm text-gray-500">No quote requests yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {!analytics ? (
            <p className="text-sm text-gray-500">Loading analytics...</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Paid orders</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{analytics.paidOrders}</p>
                  <p className="mt-1 text-xs text-gray-500">of {analytics.totalOrders} total</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Revenue (MWK)</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{analytics.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AOV (MWK)</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{analytics.aov.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Attachment rates</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{analytics.recipeAttachment}%</p>
                  <p className="mt-1 text-xs text-gray-500">Free recipe · spices {analytics.spiceAttachment}%</p>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5">
                <h2 className="font-display text-lg font-bold mb-4">Revenue by category</h2>
                <div className="space-y-2">
                  {Object.entries(analytics.revenueByCategory).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-600">{cat}</span>
                      <span className="font-semibold text-[#073B78]">{Number(val).toLocaleString()} MWK</span>
                    </div>
                  ))}
                  {Object.keys(analytics.revenueByCategory).length === 0 && (
                    <p className="text-sm text-gray-500">No paid orders yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5">
                <h2 className="font-display text-lg font-bold mb-4">Stock levels</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Fish (kg available)</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#073B78]">{analytics.stock.fishKg.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Spices (units)</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#073B78]">{analytics.stock.spices}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {tab === "subscriptions" && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-right">Qty (kg)</th>
                <th className="px-4 py-3 text-left">Prep</th>
                <th className="px-4 py-3 text-left">Consent</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.customer_name}</div>
                    <div className="text-xs text-gray-500">{s.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">{s.plan}</td>
                  <td className="px-4 py-3 text-right">{s.quantity_kg}</td>
                  <td className="px-4 py-3">{s.preparation}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${s.consent_given ? "text-[#39B54A]" : "text-red-600"}`}>
                      {s.consent_given ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={(e) => updateSubscriptionStatus(s.id, e.target.value)}
                      className="h-8 rounded border border-gray-300 px-2 text-xs"
                    >
                      <option value="pending_consent">pending_consent</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No subscriptions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* BATCHES */}
      {tab === "batches" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Add inventory batch</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Species</Label>
                <select
                  value={batchForm.species_id}
                  onChange={(e) => setBatchForm({ ...batchForm, species_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {species.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Received date</Label>
                <Input type="date" value={batchForm.received_date} onChange={(e) => setBatchForm({ ...batchForm, received_date: e.target.value })} />
              </div>
              <div>
                <Label>Expiry date</Label>
                <Input type="date" value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
              </div>
              <div>
                <Label>Weight received (kg)</Label>
                <Input type="number" step="0.1" value={batchForm.weight_kg_received} onChange={(e) => setBatchForm({ ...batchForm, weight_kg_received: e.target.value })} />
              </div>
              <div>
                <Label>Freshness grade</Label>
                <Input value={batchForm.freshness_grade} onChange={(e) => setBatchForm({ ...batchForm, freshness_grade: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateBatch}>
              <Plus className="h-4 w-4 mr-2" /> Add batch
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Species</th>
                  <th className="px-4 py-3 text-left">Received</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-right">Received kg</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Sold</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.fish_species?.name || "N/A"}</td>
                    <td className="px-4 py-3">{b.received_date}</td>
                    <td className="px-4 py-3">{b.expiry_date || "N/A"}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_received).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_available).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_reserved).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_sold).toFixed(2)}</td>
                    <td className="px-4 py-3">{b.freshness_grade || "N/A"}</td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No batches yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLOTS */}
      {tab === "slots" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Generate delivery slots</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <Label>Days</Label>
                <Input type="number" value={genDays} onChange={(e) => setGenDays(e.target.value)} className="w-24" />
              </div>
              <div>
                <Label>Capacity orders</Label>
                <Input type="number" value={genOrders} onChange={(e) => setGenOrders(e.target.value)} className="w-28" />
              </div>
              <div>
                <Label>Capacity weight (kg)</Label>
                <Input type="number" value={genWeight} onChange={(e) => setGenWeight(e.target.value)} className="w-28" />
              </div>
              <Button onClick={handleGenerateSlots}>Generate</Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Zone</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Booked orders</th>
                  <th className="px-4 py-3 text-right">Cap orders</th>
                  <th className="px-4 py-3 text-right">Booked kg</th>
                  <th className="px-4 py-3 text-right">Cap kg</th>
                  <th className="px-4 py-3 text-left">Open</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{s.delivery_zones?.name || "N/A"}</td>
                    <td className="px-4 py-3">{s.delivery_date}</td>
                    <td className="px-4 py-3 text-right">{s.booked_orders}</td>
                    <td className="px-4 py-3 text-right">{s.capacity_orders}</td>
                    <td className="px-4 py-3 text-right">{Number(s.booked_weight_kg).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">{Number(s.capacity_weight_kg).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSlotOpen(s.id, !s.is_open)}
                        className={`text-xs font-bold ${s.is_open ? "text-[#39B54A]" : "text-gray-400"}`}
                      >
                        {s.is_open ? "Open" : "Closed"}
                      </button>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No slots. Generate above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Delivery</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <>
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs">{o.payment_reference}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.customer_name}</div>
                        <div className="text-xs text-gray-500">{o.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {o.delivery_date || "N/A"}<br />{o.delivery_window || ""}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMWK(o.total_mwk)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                          className="h-8 rounded border border-gray-300 px-2 text-xs"
                        >
                          {["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${o.payment_status === "paid" ? "text-[#39B54A]" : "text-amber-600"}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            if (expandedOrder === o.id) setExpandedOrder(null);
                            else { setExpandedOrder(o.id); loadOrderItems(o.id); }
                          }}
                          className="text-xs font-bold text-[#073B78]"
                        >
                          {expandedOrder === o.id ? "Hide" : "Items"}
                        </button>
                        {o.payment_status !== "paid" && (
                          <button
                            onClick={() => markOrderPaid(o.id)}
                            className="text-xs font-bold text-[#39B54A]"
                          >
                            Mark paid
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedOrder === o.id && (
                      <tr key={`${o.id}-items`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          {(orderItems[o.id] || []).map((item: any) => (
                            <div key={item.id} className="flex justify-between text-xs py-1">
                              <span>
                                {item.product_name} - {item.preparation
                                  ? `${Number(item.preparation.requested_weight_kg).toFixed(1)} kg · ${item.preparation.preparation_type}`
                                  : `${item.quantity} item(s)`}
                                {item.recipe_title ? (
                                  <span className="ml-1 text-[#39B54A]">· free recipe: {item.recipe_title}</span>
                                ) : null}
                              </span>
                              <span>{formatMWK(item.unit_price_mwk)}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No Lake Fresh orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREPARATION */}
      {tab === "preparation" && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Requested kg</th>
                <th className="px-4 py-3 text-right">Packed kg</th>
                <th className="px-4 py-3 text-right">Price/kg</th>
                <th className="px-4 py-3 text-right">Final price</th>
                <th className="px-4 py-3 text-left">Reconciled</th>
                <th className="px-4 py-3 text-left">Save</th>
              </tr>
            </thead>
            <tbody>
              {preparations.map((p) => (
                <PreparationRow key={p.id} prep={p} onSave={savePreparation} />
              ))}
              {preparations.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No preparation records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DELIVERY */}
      {tab === "delivery" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-4">Add delivery zone</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Name</Label>
                <Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={zoneForm.slug} onChange={(e) => setZoneForm({ ...zoneForm, slug: e.target.value })} />
              </div>
              <div>
                <Label>Base fee (MWK)</Label>
                <Input type="number" value={zoneForm.base_fee_mwk} onChange={(e) => setZoneForm({ ...zoneForm, base_fee_mwk: e.target.value })} />
              </div>
              <div>
                <Label>Min order (MWK)</Label>
                <Input type="number" value={zoneForm.min_order_mwk} onChange={(e) => setZoneForm({ ...zoneForm, min_order_mwk: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateZone}>
              <Plus className="h-4 w-4 mr-2" /> Add zone
            </Button>
          </div>

          {editingZoneId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit delivery zone</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editZoneForm.name} onChange={(e) => setEditZoneForm({ ...editZoneForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editZoneForm.slug} onChange={(e) => setEditZoneForm({ ...editZoneForm, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Base fee (MWK)</Label>
                  <Input type="number" value={editZoneForm.base_fee_mwk} onChange={(e) => setEditZoneForm({ ...editZoneForm, base_fee_mwk: e.target.value })} />
                </div>
                <div>
                  <Label>Min order (MWK)</Label>
                  <Input type="number" value={editZoneForm.min_order_mwk} onChange={(e) => setEditZoneForm({ ...editZoneForm, min_order_mwk: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedZone()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingZoneId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-right">Base fee</th>
                  <th className="px-4 py-3 text-right">Min order</th>
                  <th className="px-4 py-3 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{z.name}</td>
                    <td className="px-4 py-3">{z.slug}</td>
                    <td className="px-4 py-3 text-right">{formatMWK(z.base_fee_mwk)}</td>
                    <td className="px-4 py-3 text-right">{formatMWK(z.min_order_mwk)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEditZone(z)}
                          className="text-xs font-bold text-[#073B78] underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleZoneActive(z.id, !z.is_active)}
                          className={`text-xs font-bold ${z.is_active ? "text-[#39B54A]" : "text-gray-400"}`}
                        >
                          {z.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No zones yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROUTE MAP */}
      {tab === "route" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>Delivery date</Label>
                <Input
                  type="date"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={() => void loadRouteOrders()} disabled={routeLoading}>
                {routeLoading ? "Loading..." : "Load orders"}
              </Button>
              <Button
                variant="outline"
                onClick={printRouteSheet}
                disabled={routeOrders.length === 0}
              >
                Print route sheet
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Orders for this date are mapped and ordered into the fastest route. Print the sheet for the delivery driver.
            </p>
          </div>

          {routeOrders.length > 0 && (
            <>
              <div className="rounded-xl border bg-white overflow-hidden">
                <LeafletMap
                  center={
                    routeOrders.find((o) => o.delivery_lat && o.delivery_lng)
                      ? [routeOrders.find((o) => o.delivery_lat && o.delivery_lng).delivery_lat, routeOrders.find((o) => o.delivery_lat && o.delivery_lng).delivery_lng]
                      : [-15.7861, 35.0058]
                  }
                  zoom={12}
                  markers={routeOrders
                    .filter((o) => o.delivery_lat != null && o.delivery_lng != null)
                    .map((o, i) => ({
                      lat: o.delivery_lat,
                      lng: o.delivery_lng,
                      label: `${i + 1}. ${o.customer_name} · ${o.customer_phone}`,
                      color: "#073B78",
                    }))}
                  polyline={optimizeRoute(routeOrders)
                    .filter((o) => o.delivery_lat != null && o.delivery_lng != null)
                    .map((o) => [o.delivery_lat, o.delivery_lng] as [number, number])}
                  height={420}
                />
              </div>

              <div className="rounded-xl border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left">House no.</th>
                      <th className="px-4 py-3 text-left">Street</th>
                      <th className="px-4 py-3 text-left">Area</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-left">Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimizeRoute(routeOrders).map((o, i) => (
                      <tr key={o.id} className="border-t">
                        <td className="px-4 py-3 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                        <td className="px-4 py-3">{o.customer_phone}</td>
                        <td className="px-4 py-3">{o.house_number || "—"}</td>
                        <td className="px-4 py-3">{o.street_name || "—"}</td>
                        <td className="px-4 py-3">{o.customer_location || "—"}</td>
                        <td className="px-4 py-3 text-xs">
                          {(o.items || []).map((it: any) => `${it.product_name} x ${it.quantity}`).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3">{o.delivery_window || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {routeOrders.length === 0 && !routeLoading && (
            <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
              No orders loaded. Choose a date and click "Load orders".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLakeFresh;

const PreparationRow = ({ prep, onSave }: { prep: any; onSave: (id: string, packed: string, final: string) => void }) => {
  const [packed, setPacked] = useState(prep.packed_weight_kg ? String(prep.packed_weight_kg) : "");
  const [finalPrice, setFinalPrice] = useState(prep.final_price_mwk ? String(prep.final_price_mwk) : "");
  return (
    <tr className="border-t">
      <td className="px-4 py-3 text-xs font-mono">{prep.order?.customer_name || prep.item?.order_id?.slice(0, 8)}</td>
      <td className="px-4 py-3 text-xs">{prep.item?.product_name || "N/A"}</td>
      <td className="px-4 py-3 text-right">{Number(prep.requested_weight_kg || 0).toFixed(2)}</td>
      <td className="px-4 py-3">
        <Input className="h-8 w-20" type="number" step="0.01" value={packed} onChange={(e) => setPacked(e.target.value)} />
      </td>
      <td className="px-4 py-3 text-right">{prep.price_per_kg_mwk ? formatMWK(prep.price_per_kg_mwk) : "N/A"}</td>
      <td className="px-4 py-3">
        <Input className="h-8 w-24" type="number" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
      </td>
      <td className="px-4 py-3 text-xs">
        {prep.reconciled_at ? (
          <span className="inline-flex items-center gap-1 text-[#39B54A]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" /> Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <Button size="sm" onClick={() => onSave(prep.id, packed, finalPrice)}>Save</Button>
      </td>
    </tr>
  );
};
