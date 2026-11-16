import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatMWK } from "@/data/products";
import {
  Fish,
  Package,
  CalendarDays,
  ClipboardList,
  Truck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";

type Tab = "catalog" | "batches" | "slots" | "orders" | "preparation" | "delivery";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "catalog", label: "Catalog", icon: Fish },
  { key: "batches", label: "Batches", icon: Package },
  { key: "slots", label: "Slots", icon: CalendarDays },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "preparation", label: "Preparation", icon: Package },
  { key: "delivery", label: "Delivery", icon: Truck },
];

const AdminLakeFresh = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const brand = searchParams.get("brand") || "lake-fresh";
  const [tab, setTab] = useState<Tab>("catalog");

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

  const [loading, setLoading] = useState(false);

  const loadSpecies = async () => {
    const { data } = await supabase
      .from("fish_species")
      .select("id, name")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    setSpecies(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("fish_products")
      .select("*, fish_species(name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    setProducts(data || []);
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

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data: items } = await supabase
      .from("order_items")
      .select("id, product_name, unit_price_mwk, quantity")
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
    });
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product created" });
    setProductForm({ ...productForm, name: "", price_per_kg_mwk: "" });
    await loadProducts();
  };

  const toggleProductActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("fish_products").update({ is_active: next }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await loadProducts();
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
            Brand: {brand} · Manage catalog, batches, slots, orders, preparation and delivery.
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
              tab === t.key ? "bg-[#0a2540] text-white" : "text-gray-600 hover:bg-gray-100"
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
                  <option value="">Select…</option>
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
            </div>
            <Button className="mt-4" onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-2" /> Add product
            </Button>
          </div>

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
                    <td className="px-4 py-3">{p.fish_species?.name || "—"}</td>
                    <td className="px-4 py-3 text-right">{formatMWK(p.price_per_kg_mwk)}</td>
                    <td className="px-4 py-3 text-right">{p.min_order_qty_kg}</td>
                    <td className="px-4 py-3">{(p.preparation_options || []).join(", ")}</td>
                    <td className="px-4 py-3">{p.availability_status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleProductActive(p.id, !p.is_active)}
                        className={`text-xs font-bold ${p.is_active ? "text-emerald-600" : "text-gray-400"}`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
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
                  <option value="">Select…</option>
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
                    <td className="px-4 py-3 font-medium">{b.fish_species?.name || "—"}</td>
                    <td className="px-4 py-3">{b.received_date}</td>
                    <td className="px-4 py-3">{b.expiry_date || "—"}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_received).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_available).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_reserved).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.weight_kg_sold).toFixed(2)}</td>
                    <td className="px-4 py-3">{b.freshness_grade || "—"}</td>
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
                    <td className="px-4 py-3 font-medium">{s.delivery_zones?.name || "—"}</td>
                    <td className="px-4 py-3">{s.delivery_date}</td>
                    <td className="px-4 py-3 text-right">{s.booked_orders}</td>
                    <td className="px-4 py-3 text-right">{s.capacity_orders}</td>
                    <td className="px-4 py-3 text-right">{Number(s.booked_weight_kg).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">{Number(s.capacity_weight_kg).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSlotOpen(s.id, !s.is_open)}
                        className={`text-xs font-bold ${s.is_open ? "text-emerald-600" : "text-gray-400"}`}
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
                        {o.delivery_date || "—"}<br />{o.delivery_window || ""}
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
                        <span className={`text-xs font-bold ${o.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            if (expandedOrder === o.id) setExpandedOrder(null);
                            else { setExpandedOrder(o.id); loadOrderItems(o.id); }
                          }}
                          className="text-xs font-bold text-[#0a2540]"
                        >
                          {expandedOrder === o.id ? "Hide" : "Items"}
                        </button>
                        {o.payment_status !== "paid" && (
                          <button
                            onClick={() => markOrderPaid(o.id)}
                            className="text-xs font-bold text-emerald-600"
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
                                {item.product_name} — {item.preparation
                                  ? `${Number(item.preparation.requested_weight_kg).toFixed(1)} kg · ${item.preparation.preparation_type}`
                                  : `${item.quantity} item(s)`}
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
                      <button
                        onClick={() => toggleZoneActive(z.id, !z.is_active)}
                        className={`text-xs font-bold ${z.is_active ? "text-emerald-600" : "text-gray-400"}`}
                      >
                        {z.is_active ? "Active" : "Inactive"}
                      </button>
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
    </div>
  );
};

const PreparationRow = ({ prep, onSave }: { prep: any; onSave: (id: string, packed: string, final: string) => void }) => {
  const [packed, setPacked] = useState(prep.packed_weight_kg ? String(prep.packed_weight_kg) : "");
  const [finalPrice, setFinalPrice] = useState(prep.final_price_mwk ? String(prep.final_price_mwk) : "");
  return (
    <tr className="border-t">
      <td className="px-4 py-3 text-xs font-mono">{prep.order?.customer_name || prep.item?.order_id?.slice(0, 8)}</td>
      <td className="px-4 py-3 text-xs">{prep.item?.product_name || "—"}</td>
      <td className="px-4 py-3 text-right">{Number(prep.requested_weight_kg || 0).toFixed(2)}</td>
      <td className="px-4 py-3">
        <Input className="h-8 w-20" type="number" step="0.01" value={packed} onChange={(e) => setPacked(e.target.value)} />
      </td>
      <td className="px-4 py-3 text-right">{prep.price_per_kg_mwk ? formatMWK(prep.price_per_kg_mwk) : "—"}</td>
      <td className="px-4 py-3">
        <Input className="h-8 w-24" type="number" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
      </td>
      <td className="px-4 py-3 text-xs">
        {prep.reconciled_at ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
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

export default AdminLakeFresh;
