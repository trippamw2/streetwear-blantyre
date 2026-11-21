import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import LFImageGalleryInput from "@/components/admin/LFImageGalleryInput";
import LFFileManager from "@/components/admin/LFFileManager";
import LakeFreshImage from "@/components/lf/LakeFreshImage";
import { lfGalleryImages } from "@/lib/lfImages";
import { deleteLfStorageAsset, isLfProofPath, lfProofSignedUrl } from "@/lib/lfStorage";
import { BRANDS } from "@/lib/brands";
import { LeafletMap } from "@/components/lf/LeafletMap";
import { formatMWK } from "@/data/products";
import {
  Fish,
  Package,
  CalendarDays,
  ClipboardList,
  Truck,
  MapPin,
  Users,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  MessageCircle,
} from "lucide-react";

const LF_BRAND_ID = BRANDS["lake-fresh"].id;

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });

type Tab = "catalog" | "spices" | "recipes" | "media" | "pro" | "subscriptions" | "analytics" | "batches" | "slots" | "orders" | "preparation" | "delivery" | "route" | "support" | "customers" | "settings";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "catalog", label: "Catalog", icon: Fish },
  { key: "settings", label: "Settings", icon: ClipboardList },
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
  { key: "support", label: "Support", icon: MessageCircle },
  { key: "customers", label: "Customers", icon: Users },
];

const uploadLfAsset = async (file: File, folder: string): Promise<string> => {
  const extension = (file.name.split(".").pop() || "").toLowerCase() ||
    (file.type === "application/pdf" ? "pdf" : file.type.startsWith("image/") ? file.type.split("/")[1] : "jpg");
  const safeExt = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const uuid =
    (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function")
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `lf/${folder}/${uuid}.${safeExt}`;
  const contentType = file.type || (safeExt === "pdf" ? "application/pdf" : `image/${safeExt}`);
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false, contentType });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};

const AssetField = ({
  label,
  value,
  onChange,
  onRemove,
  folder,
  accept = "image/*",
  kind = "image",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (next: string) => void | boolean | Promise<void | boolean>;
  /** Use this when the value is still only in a form and is saved elsewhere. */
  onRemove?: (url: string) => void | boolean | Promise<void | boolean>;
  folder: string;
  accept?: string;
  kind?: "image" | "pdf";
}) => {
  const [draft, setDraft] = useState(value || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const commit = async (next: string, previous: string) => {
    setBusy(true);
    try {
      const saved = await onChange(next);
      if (saved === false) return false;
      if (previous && previous !== next) {
        if (onRemove) await onRemove(previous);
        else await deleteLfStorageAsset(previous);
      }
      setDraft(next);
      return true;
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const previous = draft;
      const url = await uploadLfAsset(file, folder);
      setDraft(url);
      const saved = await commit(url, previous);
      if (saved === false) {
        await deleteLfStorageAsset(url).catch(() => false);
        setDraft(previous);
        return;
      }
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

  const remove = async () => {
    const previous = draft;
    if (!previous) return;
    const removed = await commit("", previous);
    if (removed) toast({ title: kind === "pdf" ? "PDF removed" : "Photo removed" });
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
          onClick={() => void commit(draft, value || "")}
          disabled={busy}
          className="h-8 shrink-0 rounded border border-gray-300 px-2 text-[10px] font-bold uppercase disabled:opacity-50"
        >
          Use link
        </button>
        <label className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded bg-[#073B78] px-2 text-[10px] font-bold uppercase text-white">
          {busy ? "..." : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void upload(file);
            }}
          />
        </label>
        {draft ? (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            aria-label={`Remove ${label}`}
            className="inline-flex h-8 shrink-0 items-center rounded border border-red-200 px-2 text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {kind === "image" && draft ? (
        <LakeFreshImage
          src={draft}
          alt={label}
          className="mt-2 h-16 w-full rounded object-cover"
        />
      ) : null}
      {kind === "pdf" && draft ? (
        <a href={draft} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#073B78] underline">
          <FileText className="h-3.5 w-3.5" /> Open PDF
        </a>
      ) : null}
    </div>
  );
};

const VALID_TABS: Tab[] = ["catalog", "settings", "spices", "recipes", "media", "pro", "subscriptions", "analytics", "batches", "slots", "orders", "preparation", "delivery", "route", "support", "customers"];

const SETTING_FIELDS: { key: string; label: string; defaultValue: string; kind: "time" | "number" }[] = [
  { key: "delivery.cutoff", label: "Order cutoff", defaultValue: "20:00", kind: "time" },
  { key: "delivery.delivery_days", label: "Days until first delivery", defaultValue: "1", kind: "number" },
  { key: "delivery.max_advance_days", label: "Days customers can choose", defaultValue: "7", kind: "number" },
  { key: "delivery.fee_mwk", label: "Base delivery fee (MWK)", defaultValue: "2000", kind: "number" },
  { key: "delivery.free_threshold_mwk", label: "Free delivery from (MWK)", defaultValue: "15000", kind: "number" },
];

const AdminLakeFresh = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [speciesForm, setSpeciesForm] = useState({ name: "", slug: "", description: "", image: "" });
  const [editingSpeciesId, setEditingSpeciesId] = useState<string | null>(null);
  const [editSpeciesForm, setEditSpeciesForm] = useState({ name: "", slug: "", description: "", image: "" });
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
    images: [] as string[],
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
    images: [] as string[],
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
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotForm, setEditSlotForm] = useState({
    delivery_date: "",
    capacity_orders: "20",
    capacity_weight_kg: "50",
    cutoff_time: "20:00",
    is_open: true,
  });

  // ---- Orders state ----
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
  const [routeOrders, setRouteOrders] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [centerZoneId, setCenterZoneId] = useState("");
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);

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
  const [spiceForm, setSpiceForm] = useState({ name: "", price_mwk: "", size_label: "", stock_qty: "", ingredients: "", description: "", recommended_species: "", image: "", images: [] as string[] });
  const [editingSpiceId, setEditingSpiceId] = useState<string | null>(null);
  const [editSpiceForm, setEditSpiceForm] = useState({
    name: "",
    price_mwk: "",
    size_label: "",
    stock_qty: "",
    ingredients: "",
    description: "",
    recommended_species: "",
    image: "",
    images: [] as string[],
  });

  // ---- Recipes state ----
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeForm, setRecipeForm] = useState({
    title: "", slug: "", species_id: "", prep_time_min: "", cook_time_min: "", servings: "",
    cooking_method: "", recommended_spice: "", safety_notes: "",
    ingredients: "", steps: "", image: "", pdf_url: "",
  });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editRecipeForm, setEditRecipeForm] = useState({
    title: "", slug: "", species_id: "", prep_time_min: "", cook_time_min: "", servings: "",
    cooking_method: "", recommended_spice: "", safety_notes: "",
    ingredients: "", steps: "", image: "", pdf_url: "",
  });

  // ---- PRO state ----
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  // ---- Analytics state ----
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsFrom, setAnalyticsFrom] = useState("");
  const [analyticsTo, setAnalyticsTo] = useState("");

  // ---- Subscriptions state ----
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionCharges, setSubscriptionCharges] = useState<any[]>([]);

  // ---- Settings and reconciliation state ----
  const [brandSettings, setBrandSettings] = useState<Record<string, string>>({});
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);

  // ---- Support state ----
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const pendingAssetDeletes = useRef<Set<string>>(new Set());

  const queueAssetDelete = (url: string) => {
    if (url) pendingAssetDeletes.current.add(url);
  };

  const flushAssetDeletes = async () => {
    const urls = Array.from(pendingAssetDeletes.current);
    pendingAssetDeletes.current.clear();
    const failed: string[] = [];
    for (const url of urls) {
      try {
        await deleteLfStorageAsset(url);
      } catch (error) {
        failed.push(url);
        console.error("Lake Fresh asset delete failed", error);
      }
    }
    if (failed.length > 0) {
      toast({
        title: "Some photos were kept",
        description: "They are still stored. Try again after the record is saved.",
        variant: "destructive",
      });
    }
  };

  const loadFailed = (label: string, error: any) => {
    console.error(`${label} load failed`, error);
    toast({
      title: `${label} did not load`,
      description: error?.message || "Please refresh and try again.",
      variant: "destructive",
    });
  };

  const invalidateStorefront = () => {
    void queryClient.invalidateQueries({ queryKey: ["lf"] });
  };

  const finishWrite = async (reload: () => Promise<unknown>) => {
    invalidateStorefront();
    await reload();
  };

  const loadSpecies = async () => {
    const { data, error } = await supabase
      .from("fish_species")
      .select("id, name, slug, description, image, is_active")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    if (error) {
      loadFailed("Species", error);
      return false;
    }
    setSpecies(data || []);
    return true;
  };

  const updateSpeciesImage = async (id: string, image: string) => {
    const { error } = await supabase.from("fish_species").update({ image: image || null }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setSpecies((prev) => prev.map((s: any) => (s.id === id ? { ...s, image } : s)));
    invalidateStorefront();
    return true;
  };

  const handleCreateSpecies = async () => {
    if (!speciesForm.name || !speciesForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("fish_species").insert({
      brand_id: LF_BRAND_ID,
      name: speciesForm.name,
      slug: speciesForm.slug,
      description: speciesForm.description || null,
      image: speciesForm.image || null,
      is_active: true,
    });
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fish guide added" });
    setSpeciesForm({ name: "", slug: "", description: "", image: "" });
    await finishWrite(loadSpecies);
  };

  const startEditSpecies = (item: any) => {
    setEditingSpeciesId(item.id);
    setEditSpeciesForm({
      name: item.name || "",
      slug: item.slug || "",
      description: item.description || "",
      image: item.image || "",
    });
  };

  const saveEditedSpecies = async () => {
    if (!editingSpeciesId) return;
    if (!editSpeciesForm.name || !editSpeciesForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("fish_species")
      .update({
        name: editSpeciesForm.name,
        slug: editSpeciesForm.slug,
        description: editSpeciesForm.description || null,
        image: editSpeciesForm.image || null,
      })
      .eq("id", editingSpeciesId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fish guide updated" });
    setEditingSpeciesId(null);
    await finishWrite(loadSpecies);
  };

  const toggleSpeciesActive = async (item: any) => {
    const { error } = await supabase
      .from("fish_species")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await finishWrite(loadSpecies);
  };

  const deleteSpeciesRecord = async (item: any) => {
    if (!window.confirm(`Remove ${item.name} from the fish guide? This cannot be undone.`)) return;
    // Recipes keep their title and steps. They simply lose this guide label.
    const { error: recipeError } = await supabase
      .from("lf_recipes")
      .update({ species_id: null })
      .eq("species_id", item.id)
      .eq("brand_id", LF_BRAND_ID);
    if (recipeError) {
      toast({ title: "Could not remove", description: recipeError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("fish_species")
      .delete()
      .eq("id", item.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    if (item.image) await deleteLfStorageAsset(item.image).catch(() => false);
    toast({ title: "Fish guide removed" });
    await finishWrite(async () => {
      await Promise.all([loadSpecies(), loadProducts(), loadRecipes()]);
    });
  };

  const updateProductGallery = async (id: string, gallery: string[]) => {
    const images = lfGalleryImages(null, gallery);
    const image = images[0] || null;
    const { error } = await supabase
      .from("fish_products")
      .update({ image, images })
      .eq("id", id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setProducts((prev) => prev.map((p: any) => (p.id === id ? { ...p, image, images } : p)));
    invalidateStorefront();
    return true;
  };

  const updateSpiceGallery = async (id: string, gallery: string[]) => {
    const images = lfGalleryImages(null, gallery);
    const image = images[0] || null;
    const { error } = await supabase
      .from("lf_spices")
      .update({ image, images })
      .eq("id", id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setSpices((prev) => prev.map((s: any) => (s.id === id ? { ...s, image, images } : s)));
    invalidateStorefront();
    return true;
  };

  const updateRecipeMedia = async (id: string, patch: { image?: string; pdf_url?: string }) => {
    const cleanPatch = { image: patch.image || null, pdf_url: patch.pdf_url || null };
    const { error } = await supabase.from("lf_recipes").update(cleanPatch).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setRecipes((prev) => prev.map((r: any) => (r.id === id ? { ...r, ...cleanPatch } : r)));
    invalidateStorefront();
    return true;
  };

  const toggleRecommendedSpecies = (value: string, id: string, onChange: (next: string) => void) => {
    const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange(next.join(","));
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("fish_products")
      .select("*, fish_species(name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    if (error) {
      loadFailed("Products", error);
      return false;
    }
    setProducts(data || []);
    return true;
  };

  const loadSpices = async () => {
    const { data, error } = await supabase.from("lf_spices").select("*").eq("brand_id", LF_BRAND_ID).order("sort_order");
    if (error) {
      loadFailed("Spices", error);
      return false;
    }
    setSpices(data || []);
    return true;
  };

  const loadRecipes = async () => {
    const { data, error } = await supabase.from("lf_recipes").select("*, fish_species(name)").eq("brand_id", LF_BRAND_ID).order("sort_order");
    if (error) {
      loadFailed("Recipes", error);
      return false;
    }
    setRecipes(data || []);
    return true;
  };

  const loadBusinessAccounts = async () => {
    const { data, error } = await supabase.from("business_accounts").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    if (error) {
      loadFailed("Business accounts", error);
      return false;
    }
    setBusinessAccounts(data || []);
    return true;
  };

  const loadQuotes = async () => {
    const { data, error } = await supabase.from("lf_quotes").select("*, lf_quote_items(*)").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    if (error) {
      loadFailed("Quotes", error);
      return false;
    }
    setQuotes(data || []);
    return true;
  };

  const loadAnalytics = async (from?: string, to?: string) => {
    let query = supabase.from("orders").select("id, total_mwk, payment_status, status, created_at").eq("brand_id", LF_BRAND_ID);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to + "T23:59:59");
    const { data: orders, error: ordersError } = await query;
    if (ordersError) {
      loadFailed("Analytics", ordersError);
      return false;
    }
    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const revenue = paidOrders.reduce((s: number, o: any) => s + (o.total_mwk || 0), 0);
    const aov = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length) : 0;

    const orderIds = paidOrders.map((o: any) => o.id);
    const { data: items, error: itemsError } = orderIds.length
      ? await supabase
          .from("order_items")
          .select("order_id, product_key, product_name, unit_price_mwk, quantity, recipe_title")
          .in("order_id", orderIds)
      : { data: [], error: null };
    if (itemsError) loadFailed("Analytics items", itemsError);

    const ordersWithRecipes = new Set<string>();
    const ordersWithSpices = new Set<string>();
    const revenueByCategory: Record<string, number> = {};
    const bestsellers: Record<string, { name: string; qty: number; revenue: number }> = {};

    (items || []).forEach((it: any) => {
      const key = String(it.product_key || "");
      const cat = key.includes(":") ? key.split(":")[0] : "fish";
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (it.unit_price_mwk || 0) * (Number(it.quantity) || 1);
      if (it.recipe_title) ordersWithRecipes.add(it.order_id);
      if (cat === "spice") ordersWithSpices.add(it.order_id);

      const name = it.product_name || key;
      if (!bestsellers[name]) bestsellers[name] = { name, qty: 0, revenue: 0 };
      bestsellers[name].qty += Number(it.quantity) || 1;
      bestsellers[name].revenue += (it.unit_price_mwk || 0) * (Number(it.quantity) || 1);
    });

    const eligible = paidOrders.length || 1;
    const recipeAttachment = Math.round((ordersWithRecipes.size / eligible) * 100);
    const spiceAttachment = Math.round((ordersWithSpices.size / eligible) * 100);

    const { data: spices, error: spicesError } = await supabase.from("lf_spices").select("stock_qty").eq("brand_id", LF_BRAND_ID);
    const { data: batches, error: batchesError } = await supabase.from("fish_inventory_batches").select("weight_kg_available").eq("brand_id", LF_BRAND_ID);
    if (spicesError) loadFailed("Spice stock", spicesError);
    if (batchesError) loadFailed("Fish stock", batchesError);

    const stock = {
      spices: (spices || []).reduce((s: number, r: any) => s + (r.stock_qty || 0), 0),
      fishKg: (batches || []).reduce((s: number, r: any) => s + Number(r.weight_kg_available || 0), 0),
    };

    const topBestsellers = Object.values(bestsellers)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    setAnalytics({
      totalOrders: orders?.length || 0,
      paidOrders: paidOrders.length,
      revenue,
      aov,
      recipeAttachment,
      spiceAttachment,
      revenueByCategory,
      stock,
      bestsellers: topBestsellers,
      from: from || null,
      to: to || null,
    });
    return true;
  };

  const loadSubscriptions = async () => {
    const { data, error } = await supabase.from("lf_subscriptions").select("*, fish_products(name, fish_species(name))").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false });
    if (error) {
      loadFailed("Subscriptions", error);
      return false;
    }
    setSubscriptions(data || []);
    return true;
  };

  const loadBatches = async () => {
    const { data, error } = await supabase
      .from("fish_inventory_batches")
      .select("*, fish_species(name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("received_date", { ascending: false });
    if (error) {
      loadFailed("Batches", error);
      return false;
    }
    setBatches(data || []);
    return true;
  };

  const loadSlots = async () => {
    const { data, error } = await supabase
      .from("delivery_slots")
      .select("*, delivery_zones(name)")
      .eq("brand_id", LF_BRAND_ID)
      .gte("delivery_date", new Date().toISOString().slice(0, 10))
      .order("delivery_date")
      .limit(200);
    if (error) {
      loadFailed("Delivery slots", error);
      return false;
    }
    setSlots(data || []);
    return true;
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadFailed("Orders", error);
      return false;
    }
    setOrders(data || []);
    return true;
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) {
      loadFailed("Customers", error);
      return false;
    }
    setCustomers(data || []);
    return true;
  };

  const saveZoneCenter = async () => {
    if (!centerZoneId || centerLat == null || centerLng == null) {
      toast({ title: "Pick a zone and tap the map", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("delivery_zones")
      .update({ center_lat: centerLat, center_lng: centerLng })
      .eq("id", centerZoneId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Zone center saved" });
      await finishWrite(loadZones);
    }
  };

  const loadRouteOrders = async () => {
    setRouteLoading(true);
    // If the selected date has no orders, jump to the next date that does.
    const { data: dateRows, error: dateError } = await supabase
      .from("orders")
      .select("delivery_date")
      .eq("brand_id", LF_BRAND_ID)
      .not("status", "in", "(cancelled)")
      .gte("delivery_date", routeDate)
      .order("delivery_date", { ascending: true })
      .limit(1);
    if (dateError) {
      loadFailed("Route dates", dateError);
      setRouteLoading(false);
      return;
    }
    if (dateRows && dateRows.length > 0 && dateRows[0].delivery_date && dateRows[0].delivery_date !== routeDate) {
      setRouteDate(dateRows[0].delivery_date);
      setRouteLoading(false);
      setTimeout(() => void loadRouteOrders(), 0);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .eq("delivery_date", routeDate)
      .not("status", "in", "(cancelled)")
      .order("created_at", { ascending: true });
    if (error) {
      loadFailed("Route orders", error);
      setRouteLoading(false);
      return;
    }
    const ords = data || [];
    const ids = ords.map((o: any) => o.id);
    const itemsByOrder: Record<string, any[]> = {};
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
    const zoneMap = new Map((zones || []).map((z: any) => [z.id, z]));
    const enriched = ords.map((o: any) => {
      let lat = o.delivery_lat;
      let lng = o.delivery_lng;
      if (lat == null || lng == null) {
        const z = zoneMap.get(o.delivery_zone_id);
        if (z && z.center_lat != null && z.center_lng != null) {
          lat = z.center_lat;
          lng = z.center_lng;
        }
      }
      return { ...o, delivery_lat: lat, delivery_lng: lng, items: itemsByOrder[o.id] || [] };
    });
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
          .map((it: any) => `${it.product_name || ""} x ${it.quantity ?? ""}`)
          .join(", ");
        return `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(o.customer_name)}</td>
          <td>${escapeHtml(o.customer_phone)}</td>
          <td>${escapeHtml(o.house_number)}</td>
          <td>${escapeHtml(o.street_name)}</td>
          <td>${escapeHtml(o.customer_location)}</td>
          <td>${escapeHtml(o.delivery_place)}</td>
          <td>${escapeHtml(items)}</td>
          <td>${escapeHtml(o.delivery_window)}</td>
          <td></td>
        </tr>`;
      })
      .join("");
    const safeDate = escapeHtml(routeDate);
    const html = `<!doctype html><html><head><title>Delivery route ${safeDate}</title>
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
      <div class="meta">Date: ${safeDate} | ${ordered.length} stops | Driver sign: ____________</div>
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
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_name, unit_price_mwk, quantity, recipe_title")
      .eq("order_id", orderId);
    if (itemsError) {
      loadFailed("Order items", itemsError);
      return;
    }
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
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, product_name, quantity")
      .eq("brand_id", LF_BRAND_ID);
    if (itemsError) {
      loadFailed("Preparation items", itemsError);
      return false;
    }
    const itemIds = (items || []).map((i: any) => i.id);
    const { data: prep, error: prepError } = itemIds.length
      ? await supabase.from("order_preparation").select("*").in("order_item_id", itemIds)
      : { data: [], error: null };
    if (prepError) loadFailed("Preparation details", prepError);
    const itemMap = new Map((items || []).map((i: any) => [i.id, i]));
    const orderIds = [...new Set((items || []).map((i: any) => i.order_id))];
    const { data: orders, error: ordersError } = orderIds.length
      ? await supabase.from("orders").select("id, customer_name, payment_status, status").in("id", orderIds)
      : { data: [], error: null };
    if (ordersError) loadFailed("Preparation orders", ordersError);
    const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));
    setPreparations(
      (prep || []).map((p: any) => {
        const item = itemMap.get(p.order_item_id) as any;
        const order = item ? orderMap.get(item.order_id) : null;
        return { ...p, item, order };
      }),
    );
    return true;
  };

  const loadZones = async () => {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .order("sort_order");
    if (error) {
      loadFailed("Delivery areas", error);
      return false;
    }
    setZones(data || []);
    return true;
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("brand_settings")
      .select("setting_key, setting_value")
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      loadFailed("Settings", error);
      return false;
    }
    const next: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      const value = row.setting_value;
      next[row.setting_key] = typeof value === "string" ? value : String(value ?? "");
    });
    setBrandSettings(next);
    return true;
  };

  const loadSubscriptionCharges = async () => {
    const { data, error } = await supabase
      .from("lf_subscription_charges")
      .select("*, lf_subscriptions(customer_name, customer_phone, plan)")
      .eq("brand_id", LF_BRAND_ID)
      .order("period_date", { ascending: false })
      .limit(100);
    if (error) {
      loadFailed("Subscription payments", error);
      return false;
    }
    setSubscriptionCharges(data || []);
    return true;
  };

  const loadReconciliations = async () => {
    const { data, error } = await supabase
      .from("price_reconciliation")
      .select("*, orders(payment_reference, customer_name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadFailed("Price checks", error);
      return false;
    }
    setReconciliations(data || []);
    return true;
  };

  const loadRefunds = async () => {
    const { data, error } = await supabase
      .from("lf_refund_audit")
      .select("*, orders(payment_reference, customer_name)")
      .eq("brand_id", LF_BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadFailed("Refund record", error);
      return false;
    }
    setRefunds(data || []);
    return true;
  };

  const loadSupportTickets = async () => {
    const { data, error } = await supabase
      .from("lf_support_tickets")
      .select("*, lf_support_messages(id, actor_role, body, created_at)")
      .eq("brand_id", LF_BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadFailed("Support requests", error);
      return false;
    }
    setSupportTickets(data || []);
    return true;
  };

  const replyToTicket = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("lf_staff_reply_ticket", {
        p_ticket_id: ticketId,
        p_body: ticketReply.trim(),
      });
      if (error) throw error;
      const result = data as { ok?: boolean; reason?: string };
      if (!result?.ok) throw new Error(result?.reason || "We could not save that reply.");
      setTicketReply("");
      await loadSupportTickets();
      toast({ title: "Reply saved", description: "The customer can now see it on their help page." });
    } catch (error: any) {
      toast({
        title: "Reply not saved",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeTicketStatus = async (ticketId: string, status: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("lf_set_ticket_status", {
        p_ticket_id: ticketId,
        p_status: status,
      });
      if (error) throw error;
      const result = data as { ok?: boolean; reason?: string };
      if (!result?.ok) throw new Error(result?.reason || "We could not change that status.");
      await loadSupportTickets();
      toast({ title: "Status updated" });
    } catch (error: any) {
      toast({
        title: "Status not changed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDeliveryProof = async (order: any) => {
    if (!isLfProofPath(order?.delivery_proof_url)) {
      toast({
        title: "Old proof photo",
        description: "This order uses an older photo link. Open it from the order record.",
      });
      if (order?.delivery_proof_url) window.open(order.delivery_proof_url, "_blank", "noopener");
      return;
    }
    try {
      const url = proofUrls[order.id] || (await lfProofSignedUrl(order.delivery_proof_url, 60));
      setProofUrls((current) => ({ ...current, [order.id]: url }));
      window.open(url, "_blank", "noopener");
    } catch (error: any) {
      toast({
        title: "Photo not available",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
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
    loadCustomers();
    loadSettings();
    loadSubscriptionCharges();
    loadReconciliations();
    loadRefunds();
    loadSupportTickets();
  }, []);

  useEffect(() => {
    if (tab === "route") void loadRouteOrders();
  }, [tab, routeDate]);

  const refreshAll = async () => {
    setLoading(true);
    const results = await Promise.all([
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
      loadCustomers(),
      loadSettings(),
      loadSubscriptionCharges(),
      loadReconciliations(),
      loadRefunds(),
      loadSupportTickets(),
    ]);
    setLoading(false);
    const failed = results.filter((result) => result === false).length;
    if (failed > 0) {
      toast({
        title: `Refreshed with ${failed} problem${failed === 1 ? "" : "s"}`,
        description: "Some sections did not load. Look for the error messages above.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Refreshed" });
    }
  };

  // ---- Catalog actions ----
  const handleCreateProduct = async () => {
    if (!productForm.species_id || !productForm.name || !productForm.price_per_kg_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const images = lfGalleryImages(null, productForm.images);
    const { error } = await supabase.from("fish_products").insert({
      brand_id: LF_BRAND_ID,
      species_id: productForm.species_id,
      name: productForm.name,
      price_per_kg_mwk: Number(productForm.price_per_kg_mwk),
      min_order_qty_kg: Number(productForm.min_order_qty_kg),
      preparation_options: productForm.preparation_options.split(",").map((s) => s.trim()),
      availability_status: productForm.availability_status,
      is_active: productForm.is_active,
      image: images[0] || null,
      images,
      description: productForm.description || null,
    });
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product created" });
    setProductForm({ ...productForm, name: "", price_per_kg_mwk: "", image: "", images: [], description: "" });
    await finishWrite(loadProducts);
  };

  const startEditProduct = (product: any) => {
    const images = lfGalleryImages(product.image, product.images);
    pendingAssetDeletes.current.clear();
    setEditingProductId(product.id);
    setEditProductForm({
      species_id: product.fish_species?.id || product.species_id || "",
      name: product.name || "",
      price_per_kg_mwk: String(product.price_per_kg_mwk ?? ""),
      min_order_qty_kg: String(product.min_order_qty_kg ?? "0.5"),
      preparation_options: Array.isArray(product.preparation_options) ? product.preparation_options.join(", ") : "whole",
      availability_status: product.availability_status || "available",
      image: images[0] || "",
      images,
      description: product.description || "",
    });
  };

  const saveEditedProduct = async () => {
    if (!editingProductId) return;
    if (!editProductForm.name || !editProductForm.price_per_kg_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const images = lfGalleryImages(null, editProductForm.images);
    const { error } = await supabase.from("fish_products").update({
      species_id: editProductForm.species_id || undefined,
      name: editProductForm.name,
      price_per_kg_mwk: Number(editProductForm.price_per_kg_mwk),
      min_order_qty_kg: Number(editProductForm.min_order_qty_kg),
      preparation_options: editProductForm.preparation_options.split(",").map((s) => s.trim()).filter(Boolean),
      availability_status: editProductForm.availability_status,
      image: images[0] || null,
      images,
      description: editProductForm.description || null,
    })
      .eq("id", editingProductId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product updated" });
    setEditingProductId(null);
    await finishWrite(loadProducts);
    await flushAssetDeletes();
  };

  const handleCreateSpice = async () => {
    if (!spiceForm.name || !spiceForm.price_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const images = lfGalleryImages(null, spiceForm.images);
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
      image: images[0] || null,
      images,
    });
    if (error) toast({ title: "Create failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Spice created" });
      setSpiceForm({ name: "", price_mwk: "", size_label: "", stock_qty: "", ingredients: "", description: "", recommended_species: "", image: "", images: [] });
      await finishWrite(loadSpices);
    }
  };

  const handleCreateRecipe = async () => {
    if (!recipeForm.title || !recipeForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    pendingAssetDeletes.current.clear();
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
      await finishWrite(loadRecipes);
      await flushAssetDeletes();
    }
  };

  const toggleRecipeActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("lf_recipes").update({ is_active: next }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await finishWrite(loadRecipes);
  };

  const startEditRecipe = (recipe: any) => {
    pendingAssetDeletes.current.clear();
    setEditingRecipeId(recipe.id);
    setEditRecipeForm({
      title: recipe.title || "",
      slug: recipe.slug || "",
      species_id: recipe.species_id || "",
      prep_time_min: String(recipe.prep_time_min ?? ""),
      cook_time_min: String(recipe.cook_time_min ?? ""),
      servings: String(recipe.servings ?? ""),
      cooking_method: recipe.cooking_method || "",
      recommended_spice: recipe.recommended_spice || "",
      safety_notes: recipe.safety_notes || "",
      ingredients: (recipe.ingredients || []).join("\n"),
      steps: (recipe.steps || []).join("\n"),
      image: recipe.image || "",
      pdf_url: recipe.pdf_url || "",
    });
  };

  const saveEditedRecipe = async () => {
    if (!editingRecipeId) return;
    if (!editRecipeForm.title || !editRecipeForm.slug) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("lf_recipes")
      .update({
        title: editRecipeForm.title,
        slug: editRecipeForm.slug,
        species_id: editRecipeForm.species_id || null,
        prep_time_min: editRecipeForm.prep_time_min ? Number(editRecipeForm.prep_time_min) : null,
        cook_time_min: editRecipeForm.cook_time_min ? Number(editRecipeForm.cook_time_min) : null,
        servings: editRecipeForm.servings ? Number(editRecipeForm.servings) : null,
        cooking_method: editRecipeForm.cooking_method || null,
        recommended_spice: editRecipeForm.recommended_spice || null,
        safety_notes: editRecipeForm.safety_notes || null,
        ingredients: editRecipeForm.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        steps: editRecipeForm.steps.split("\n").map((s) => s.trim()).filter(Boolean),
        image: editRecipeForm.image || null,
        pdf_url: editRecipeForm.pdf_url || null,
      })
      .eq("id", editingRecipeId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Recipe updated" });
    setEditingRecipeId(null);
    await finishWrite(loadRecipes);
    await flushAssetDeletes();
  };

  const approveBusiness = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("business_accounts")
      .update({ approval_status: status, approved_at: new Date().toISOString(), approved_by: user?.id || null })
      .eq("id", id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: `Account ${status}` }); await loadBusinessAccounts(); }
  };

  const updateSubscriptionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("lf_subscriptions").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Updated" }); await finishWrite(loadSubscriptions); }
  };

  const toggleSpiceActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("lf_spices").update({ is_active: next }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await finishWrite(loadSpices);
  };

  const startEditSpice = (spice: any) => {
    const images = lfGalleryImages(spice.image, spice.images);
    pendingAssetDeletes.current.clear();
    setEditingSpiceId(spice.id);
    setEditSpiceForm({
      name: spice.name || "",
      price_mwk: String(spice.price_mwk ?? ""),
      size_label: spice.size_label || "",
      stock_qty: String(spice.stock_qty ?? "0"),
      ingredients: spice.ingredients || "",
      description: spice.description || "",
      recommended_species: (spice.recommended_species || []).join(", "),
      image: images[0] || "",
      images,
    });
  };

  const saveEditedSpice = async () => {
    if (!editingSpiceId) return;
    if (!editSpiceForm.name || !editSpiceForm.price_mwk) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const images = lfGalleryImages(null, editSpiceForm.images);
    const { error } = await supabase.from("lf_spices").update({
      name: editSpiceForm.name,
      price_mwk: Number(editSpiceForm.price_mwk),
      size_label: editSpiceForm.size_label || null,
      stock_qty: Number(editSpiceForm.stock_qty || 0),
      ingredients: editSpiceForm.ingredients || null,
      description: editSpiceForm.description || null,
      recommended_species: editSpiceForm.recommended_species.split(",").map((s) => s.trim()).filter(Boolean),
      image: images[0] || null,
      images,
    })
      .eq("id", editingSpiceId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Spice updated" });
    setEditingSpiceId(null);
    await finishWrite(loadSpices);
    await flushAssetDeletes();
  };

  const toggleProductActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("fish_products").update({ is_active: next }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await finishWrite(loadProducts);
  };

  const deleteProductRecord = async (product: any) => {
    if (!window.confirm(`Remove ${product.name} from the catch? This cannot be undone.`)) return;
    const { error: subscriptionError } = await supabase
      .from("lf_subscriptions")
      .update({ fish_product_id: null })
      .eq("fish_product_id", product.id)
      .eq("brand_id", LF_BRAND_ID);
    if (subscriptionError) {
      toast({ title: "Could not remove", description: subscriptionError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("fish_products")
      .delete()
      .eq("id", product.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    const urls = lfGalleryImages(product.image, product.images);
    for (const url of urls) await deleteLfStorageAsset(url).catch(() => false);
    if (editingProductId === product.id) setEditingProductId(null);
    toast({ title: "Catch removed" });
    await finishWrite(async () => {
      await Promise.all([loadProducts(), loadSubscriptions()]);
    });
  };

  const deleteSpiceRecord = async (spice: any) => {
    if (!window.confirm(`Remove ${spice.name} from seasonings? This cannot be undone.`)) return;
    const { error } = await supabase
      .from("lf_spices")
      .delete()
      .eq("id", spice.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    const urls = lfGalleryImages(spice.image, spice.images);
    for (const url of urls) await deleteLfStorageAsset(url).catch(() => false);
    if (editingSpiceId === spice.id) setEditingSpiceId(null);
    toast({ title: "Seasoning removed" });
    await finishWrite(loadSpices);
  };

  const deleteRecipeRecord = async (recipe: any) => {
    if (!window.confirm(`Remove ${recipe.title}? This cannot be undone.`)) return;
    const { error } = await supabase
      .from("lf_recipes")
      .delete()
      .eq("id", recipe.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    await deleteLfStorageAsset(recipe.image).catch(() => false);
    await deleteLfStorageAsset(recipe.pdf_url).catch(() => false);
    if (editingRecipeId === recipe.id) setEditingRecipeId(null);
    toast({ title: "Recipe removed" });
    await finishWrite(loadRecipes);
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
    }).eq("id", editingZoneId).eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Zone updated" });
    setEditingZoneId(null);
    await finishWrite(loadZones);
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
    await finishWrite(loadBatches);
  };

  // ---- Slot actions ----
  const handleGenerateSlots = async () => {
    const { data, error } = await supabase.rpc("lf_generate_delivery_slots", {
      p_days: Number(genDays),
      p_capacity_orders: Number(genOrders),
      p_capacity_weight_kg: Number(genWeight),
    });
    if (error) {
      toast({ title: "Generate failed", description: error.message, variant: "destructive" });
      return;
    }
    const count = Number(data || 0);
    toast({
      title: count > 0 ? `Generated ${count} new slot${count === 1 ? "" : "s"}` : "No new slots needed",
      description: count === 0 ? "Slots for these days already exist." : undefined,
    });
    invalidateStorefront();
    await finishWrite(loadSlots);
  };

  const toggleSlotOpen = async (id: string, next: boolean) => {
    const { error } = await supabase.from("delivery_slots").update({ is_open: next }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else await finishWrite(loadSlots);
  };

  const startEditSlot = (slot: any) => {
    const cutoff = slot.cutoff_at
      ? new Date(slot.cutoff_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Blantyre" })
      : "20:00";
    setEditingSlotId(slot.id);
    setEditSlotForm({
      delivery_date: slot.delivery_date,
      capacity_orders: String(slot.capacity_orders ?? 20),
      capacity_weight_kg: String(slot.capacity_weight_kg ?? 50),
      cutoff_time: cutoff,
      is_open: Boolean(slot.is_open),
    });
  };

  const saveEditedSlot = async () => {
    if (!editingSlotId) return;
    const [year, month, day] = editSlotForm.delivery_date.split("-").map(Number);
    const [hour, minute] = editSlotForm.cutoff_time.split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
      toast({ title: "Check the cutoff time", variant: "destructive" });
      return;
    }
    // Blantyre is UTC+2 all year, so this saves the chosen local clock time.
    const cutoffAt = new Date(Date.UTC(year, month - 1, day, hour - 2, minute)).toISOString();
    const { error } = await supabase
      .from("delivery_slots")
      .update({
        capacity_orders: Number(editSlotForm.capacity_orders),
        capacity_weight_kg: Number(editSlotForm.capacity_weight_kg),
        cutoff_at: cutoffAt,
        is_open: editSlotForm.is_open,
      })
      .eq("id", editingSlotId)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Delivery slot updated" });
    setEditingSlotId(null);
    await finishWrite(loadSlots);
  };

  // ---- Order actions ----
  const callSetOrderStatus = async (
    orderId: string,
    status: string,
    reason: string | null = null,
    gatewayReference: string | null = null
  ) => {
    const { data, error } = await supabase.rpc("lf_set_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_reason: reason,
      p_gateway_reference: gatewayReference,
      p_gateway_response: { source: "admin", at: new Date().toISOString() },
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    const result = data as any;
    if (!result?.ok) {
      const reasons: Record<string, string> = {
        invalid_transition: "That status change is not allowed for this order.",
        confirmation_required: "Wait for the customer to agree to the final total first.",
        lot_required: "Link the reserved batch to a lot before dispatch.",
        qa_required: "Save a passing quality check before dispatch.",
        qa_hold: "A quality check is holding this fish. Review it before dispatch.",
        recall_hold: "A lot in this order is on recall. Review it before dispatch.",
        reason_required: "Add a reason before refunding.",
        no_access: "You do not have access to this order.",
        order_not_found: "That order was not found.",
      };
      toast({
        title: "Status not changed",
        description: reasons[result?.reason] || result?.reason || "Please try again.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const finishOrderStatus = async (orderId: string, status: string) => {
    toast({ title: status === "refunded" ? "Refund recorded" : "Status updated" });
    if (status === "dispatched" || status === "delivered") {
      try {
        const { data: ord } = await supabase
          .from("orders")
          .select("customer_name, customer_email, customer_phone, total_mwk, customer_location, delivery_window, payment_reference")
          .eq("id", orderId)
          .maybeSingle();
        if (ord?.customer_email) {
          const { sendDispatchedEmail, sendDeliveredEmail } = await import("@/lib/brevo");
          const emailOrder = {
            to: ord.customer_email,
            toName: ord.customer_name || "Customer",
            orderId,
            brand: "lake-fresh" as const,
            adminAction: "transactional" as const,
            total: Number(ord.total_mwk || 0),
            location: ord.customer_location || "",
            items: [],
            deliveryMethod: "Next day delivery",
            type: status === "dispatched" ? "dispatched" : "delivered" as "dispatched" | "delivered",
            eta: ord.delivery_window || undefined,
            trackingUrl: `${window.location.origin}/lf/track?ref=${ord.payment_reference || orderId}`,
          };
          if (status === "dispatched") await sendDispatchedEmail(emailOrder as any);
          else await sendDeliveredEmail(emailOrder as any);
        }
      } catch (e) {
        console.warn("status email failed", e);
      }
    }
    await finishWrite(async () => {
      await Promise.all([loadOrders(), loadRefunds(), loadReconciliations()]);
    });
    if (tab === "route") void loadRouteOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === "refunded") {
      await cancelOrRefundOrder(orderId, "refunded");
      return;
    }
    const changed = await callSetOrderStatus(orderId, newStatus);
    if (changed) await finishOrderStatus(orderId, newStatus);
  };

  const markOrderPaid = async (orderId: string) => {
    const { data, error } = await supabase.rpc("mark_order_paid", { p_order_id: orderId });
    if (error) {
      toast({ title: "Mark paid failed", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.ok) {
      toast({ title: "Order marked paid" });
      await finishWrite(loadOrders);
    } else {
      toast({ title: "Not marked paid", description: (data as any)?.outcome, variant: "destructive" });
    }
  };

  const cancelOrRefundOrder = async (orderId: string, status: "cancelled" | "refunded") => {
    const reason = window.prompt(
      status === "refunded" ? "Why is this order refunded?" : "Why is this order cancelled?"
    );
    if (reason === null) return;
    const gatewayReference = status === "refunded"
      ? window.prompt("PayChangu refund reference, if you have one.")
      : null;
    if (gatewayReference === null && status === "refunded") return;
    const changed = await callSetOrderStatus(
      orderId,
      status,
      reason.trim() || (status === "refunded" ? "Refund requested by customer" : "Cancelled by admin"),
      gatewayReference
    );
    if (changed) await finishOrderStatus(orderId, status);
  };

  const dispatchOrder = async (orderId: string) => {
    const { error: aErr } = await supabase.from("delivery_assignments").insert({
      brand_id: LF_BRAND_ID,
      order_id: orderId,
      driver_name: "Unassigned",
      status: "assigned",
    });
    if (aErr) {
      toast({ title: "Dispatch failed", description: aErr.message, variant: "destructive" });
      return;
    }
    const changed = await callSetOrderStatus(orderId, "dispatched");
    if (changed) await finishOrderStatus(orderId, "dispatched");
  };

  // ---- Preparation actions ----
  const savePreparation = async (prepId: string, packedWeight: string) => {
    const { data, error } = await supabase.rpc("lf_admin_save_preparation", {
      p_preparation_id: prepId,
      p_packed_weight_kg: packedWeight ? Number(packedWeight) : null,
    });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    const result = data as any;
    if (!result?.ok) {
      const reasons: Record<string, string> = {
        invalid_weight: "Enter a packed weight above zero.",
        no_access: "You do not have access to this order.",
        order_not_editable: "This order can no longer be changed.",
        price_missing: "This item has no price per kilogram.",
        reconciliation_missing: "The price check for this order is missing.",
      };
      toast({
        title: "Save failed",
        description: reasons[result?.reason] || result?.reason || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    const prepRow = preparations.find((item: any) => item.id === prepId);
    const orderId = prepRow?.item?.order_id as string | undefined;
    let shouldNotify = false;
    let notified = false;

    if (orderId) {
      const related = preparations.filter((item: any) => item.item?.order_id === orderId);
      shouldNotify = related.every(
        (item: any) => item.id === prepId || item.final_price_mwk != null,
      );
      if (shouldNotify) {
        try {
          const { sendLfFinalTotalEmail } = await import("@/lib/brevo");
          notified = await sendLfFinalTotalEmail({
            orderId,
            finalTotalMwk: Number(result.final_total_mwk || 0),
          });
        } catch (emailError) {
          console.warn("final total email failed", emailError);
        }
      }
    }

    toast({
      title: "Final weight saved",
      description: !shouldNotify
        ? "We will ask the customer to agree once all fish is weighed."
        : notified
          ? "The customer can now agree to this total."
          : "The customer can agree, but the email did not send.",
    });
    await loadPreparations();
    await loadReconciliations();
  };

  // ---- Zone actions ----
  const generateZoneSlots = async () => {
    const { error } = await supabase.rpc("lf_generate_delivery_slots", {
      p_days: Number(genDays),
      p_capacity_orders: Number(genOrders),
      p_capacity_weight_kg: Number(genWeight),
    });
    if (error) throw error;
  };

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
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    try {
      await generateZoneSlots();
    } catch (slotError) {
      toast({
        title: "Area added",
        description: "Slots could not be generated. Open Slots and generate them.",
        variant: "destructive",
      });
      console.error("LF slot generation failed", slotError);
    }
    toast({ title: "Area added and shared with the store" });
    setZoneForm({ name: "", slug: "", base_fee_mwk: "2000", min_order_mwk: "0" });
    await finishWrite(async () => {
      await Promise.all([loadZones(), loadSlots()]);
    });
  };

  const deleteZoneRecord = async (zone: any) => {
    if (!window.confirm(`Remove ${zone.name}? Orders already using it will keep their address.`)) return;
    const { error: subscriptionError } = await supabase
      .from("lf_subscriptions")
      .update({ delivery_zone_id: null })
      .eq("delivery_zone_id", zone.id)
      .eq("brand_id", LF_BRAND_ID);
    if (subscriptionError) {
      toast({ title: "Could not remove", description: subscriptionError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", zone.id)
      .eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Delivery area removed" });
    await finishWrite(async () => {
      await Promise.all([loadZones(), loadSlots()]);
    });
  };

  const toggleZoneActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("delivery_zones").update({ is_active: next }).eq("id", id).eq("brand_id", LF_BRAND_ID);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    if (next) {
      try {
        await generateZoneSlots();
      } catch (slotError) {
        toast({
          title: "Area is active",
          description: "Slots could not be generated. Open Slots and generate them.",
          variant: "destructive",
        });
        console.error("LF slot generation failed", slotError);
      }
    }
    await finishWrite(async () => {
      await Promise.all([loadZones(), loadSlots()]);
    });
  };

  const settingValue = (key: string, fallback: string) => brandSettings[key] || fallback;

  const saveBrandSettings = async () => {
    const rows = SETTING_FIELDS.map((field) => {
      const raw = settingValue(field.key, field.defaultValue).trim();
      if (field.kind === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
        throw new Error(`${field.label} must look like 20:00`);
      }
      if (field.kind === "number" && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) {
        throw new Error(`${field.label} must be zero or more`);
      }
      return {
        brand_id: LF_BRAND_ID,
        setting_key: field.key,
        setting_value: field.kind === "number" ? Number(raw) : raw,
      };
    });
    if (Number(rows[1].setting_value) < 1 || Number(rows[2].setting_value) < 1) {
      toast({ title: "Check the delivery days", description: "Both must be at least one.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("brand_settings").upsert(rows, { onConflict: "brand_id,setting_key" });
    if (error) {
      toast({ title: "Settings not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved for the store" });
    await finishWrite(async () => {
      await Promise.all([loadSettings(), loadSlots()]);
    });
  };

  const handleSaveBrandSettings = async () => {
    try {
      await saveBrandSettings();
    } catch (error) {
      toast({
        title: "Check your settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmSubscriptionCharge = async (charge: any) => {
    const gatewayReference = window.prompt("PayChangu reference for this payment, if you have one.");
    const { data, error } = await supabase.rpc("lf_confirm_subscription_charge", {
      p_charge_id: charge.id,
      p_gateway_reference: gatewayReference || null,
    });
    if (error) {
      toast({ title: "Payment not confirmed", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as any;
    if (!result?.ok) {
      toast({ title: "Payment not confirmed", description: result?.reason || "Please try again.", variant: "destructive" });
      return;
    }
    toast({
      title: "Payment confirmed",
      description: `Order created. Next charge ${result.next_charge_date || "updated"}.`,
    });
    await finishWrite(async () => {
      await Promise.all([loadSubscriptionCharges(), loadSubscriptions(), loadOrders()]);
    });
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

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Store rules</h2>
            <p className="mt-1 text-sm text-gray-500">
              These values flow to the store, checkout, subscriptions and delivery slots.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SETTING_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Input
                    type={field.kind === "number" ? "number" : "time"}
                    value={settingValue(field.key, field.defaultValue)}
                    onChange={(e) =>
                      setBrandSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={() => void handleSaveBrandSettings()}>
              Save store rules
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Subscription payments</h2>
            <p className="mt-1 text-sm text-gray-500">
              The planned charge is created automatically. Confirm only after the money reaches PayChangu.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionCharges.map((charge) => (
                    <tr key={charge.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs">{charge.payment_reference}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{charge.lf_subscriptions?.customer_name || "Customer"}</div>
                        <div className="text-xs text-gray-500">{charge.lf_subscriptions?.customer_phone || ""}</div>
                      </td>
                      <td className="px-4 py-3">{charge.lf_subscriptions?.plan || charge.plan || "N/A"}</td>
                      <td className="px-4 py-3">{charge.period_date}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMWK(charge.amount_mwk)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${charge.status === "paid" ? "text-[#39B54A]" : charge.status === "cancelled" ? "text-red-600" : "text-amber-600"}`}>
                          {charge.status}
                        </span>
                        {charge.reminded_at ? <p className="text-[10px] text-gray-400">Reminder sent</p> : null}
                      </td>
                      <td className="px-4 py-3">
                        {charge.status === "due" ? (
                          <button
                            onClick={() => void confirmSubscriptionCharge(charge)}
                            className="text-xs font-bold text-[#073B78] underline"
                          >
                            Confirm paid
                          </button>
                        ) : charge.order_id ? (
                          <span className="text-xs text-gray-500">Order created</span>
                        ) : (
                          <span className="text-xs text-gray-500">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subscriptionCharges.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No planned payments yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG */}
      {tab === "catalog" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold mb-1">Fish guide</h2>
            <p className="mb-4 text-xs text-gray-500">
              These names help customers learn about each fish. Removing a guide does not remove the fish for sale.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Name</Label>
                <Input value={speciesForm.name} onChange={(e) => setSpeciesForm({ ...speciesForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={speciesForm.slug} onChange={(e) => setSpeciesForm({ ...speciesForm, slug: e.target.value })} placeholder="chambo" />
              </div>
              <div className="sm:col-span-2">
                <AssetField
                  label="Guide photo"
                  value={speciesForm.image}
                  folder="species"
                  onChange={(next) => setSpeciesForm((prev) => ({ ...prev, image: next }))}
                />
              </div>
              <div className="sm:col-span-4">
                <Label>Short note</Label>
                <Textarea value={speciesForm.description} onChange={(e) => setSpeciesForm({ ...speciesForm, description: e.target.value })} rows={2} />
              </div>
            </div>
            <Button className="mt-4" onClick={() => void handleCreateSpecies()}>
              <Plus className="h-4 w-4 mr-2" /> Add fish guide
            </Button>
          </div>

          {editingSpeciesId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit fish guide</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editSpeciesForm.name} onChange={(e) => setEditSpeciesForm({ ...editSpeciesForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editSpeciesForm.slug} onChange={(e) => setEditSpeciesForm({ ...editSpeciesForm, slug: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <AssetField
                    label="Guide photo"
                    value={editSpeciesForm.image}
                    folder="species"
                    onChange={(next) => setEditSpeciesForm((prev) => ({ ...prev, image: next }))}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Label>Short note</Label>
                  <Textarea value={editSpeciesForm.description} onChange={(e) => setEditSpeciesForm({ ...editSpeciesForm, description: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedSpecies()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingSpeciesId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Guide</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Shown</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {species.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.slug}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void toggleSpeciesActive(s)}
                        className={`text-xs font-bold ${s.is_active ? "text-[#39B54A]" : "text-gray-400"}`}
                      >
                        {s.is_active ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => startEditSpecies(s)} className="text-xs font-bold text-[#073B78] underline">Edit</button>
                        <button onClick={() => void deleteSpeciesRecord(s)} className="text-xs font-bold text-red-600 underline">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {species.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No fish guides yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

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
              <div className="sm:col-span-3">
                <LFImageGalleryInput
                  label="Catch photos"
                  folder="fish"
                  value={productForm.images}
                  onChange={(next) => setProductForm((prev) => ({ ...prev, images: next, image: next[0] || "" }))}
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
                <div className="sm:col-span-3">
                  <LFImageGalleryInput
                    label="Catch photos"
                    folder="fish"
                    value={editProductForm.images}
                    onChange={(next) => setEditProductForm((prev) => ({ ...prev, images: next, image: next[0] || "" }))}
                    onRemove={queueAssetDelete}
                  />
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
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
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
                        <button
                          onClick={() => void deleteProductRecord(p)}
                          className="text-xs font-bold text-red-600 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No products yet.</td></tr>
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
                <LFImageGalleryInput
                  label="Seasoning photos"
                  folder="spices"
                  value={spiceForm.images}
                  onChange={(next) => setSpiceForm((prev) => ({ ...prev, images: next, image: next[0] || "" }))}
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
                  <th className="px-4 py-3 text-left">Actions</th>
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
                        <button onClick={() => void deleteSpiceRecord(s)} className="text-xs font-bold text-red-600 underline">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spices.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No spices yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {editingSpiceId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit seasoning</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editSpiceForm.name} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Price (MWK)</Label>
                  <Input type="number" value={editSpiceForm.price_mwk} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, price_mwk: e.target.value })} />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input value={editSpiceForm.size_label} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, size_label: e.target.value })} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={editSpiceForm.stock_qty} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, stock_qty: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Ingredients</Label>
                  <Input value={editSpiceForm.ingredients} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, ingredients: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Description</Label>
                  <Textarea value={editSpiceForm.description} onChange={(e) => setEditSpiceForm({ ...editSpiceForm, description: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Pairs with fish</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {species.map((sp) => {
                      const checked = editSpiceForm.recommended_species
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
                              toggleRecommendedSpecies(editSpiceForm.recommended_species, sp.id, (next) =>
                                setEditSpiceForm({ ...editSpiceForm, recommended_species: next })
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
                  <LFImageGalleryInput
                    label="Seasoning photos"
                    folder="spices"
                    value={editSpiceForm.images}
                    onChange={(next) => setEditSpiceForm((prev) => ({ ...prev, images: next, image: next[0] || "" }))}
                    onRemove={queueAssetDelete}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedSpice()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingSpiceId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
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
                  <th className="px-4 py-3 text-left">Actions</th>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEditRecipe(r)} className="text-xs font-bold text-[#073B78] underline">
                          Edit
                        </button>
                        <button onClick={() => void deleteRecipeRecord(r)} className="text-xs font-bold text-red-600 underline">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recipes.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No recipes yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {editingRecipeId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit recipe</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Title</Label>
                  <Input value={editRecipeForm.title} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, title: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editRecipeForm.slug} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Species</Label>
                  <select
                    value={editRecipeForm.species_id}
                    onChange={(e) => setEditRecipeForm({ ...editRecipeForm, species_id: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {species.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div>
                  <Label>Prep time (min)</Label>
                  <Input type="number" value={editRecipeForm.prep_time_min} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, prep_time_min: e.target.value })} />
                </div>
                <div>
                  <Label>Cook time (min)</Label>
                  <Input type="number" value={editRecipeForm.cook_time_min} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, cook_time_min: e.target.value })} />
                </div>
                <div>
                  <Label>Servings</Label>
                  <Input type="number" value={editRecipeForm.servings} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, servings: e.target.value })} />
                </div>
                <div>
                  <Label>Cooking method</Label>
                  <Input value={editRecipeForm.cooking_method} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, cooking_method: e.target.value })} />
                </div>
                <div>
                  <Label>Recommended spice</Label>
                  <Input value={editRecipeForm.recommended_spice} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, recommended_spice: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Ingredients (one per line)</Label>
                  <Textarea value={editRecipeForm.ingredients} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, ingredients: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Steps (one per line)</Label>
                  <Textarea value={editRecipeForm.steps} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, steps: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Safety notes</Label>
                  <Textarea value={editRecipeForm.safety_notes} onChange={(e) => setEditRecipeForm({ ...editRecipeForm, safety_notes: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <AssetField
                    label="Recipe photo"
                    value={editRecipeForm.image}
                    folder="recipes"
                    onChange={(next) => setEditRecipeForm((prev) => ({ ...prev, image: next }))}
                    onRemove={queueAssetDelete}
                  />
                </div>
                <div className="sm:col-span-2">
                  <AssetField
                    label="Recipe PDF"
                    value={editRecipeForm.pdf_url}
                    folder="recipes"
                    accept="application/pdf"
                    kind="pdf"
                    onChange={(next) => setEditRecipeForm((prev) => ({ ...prev, pdf_url: next }))}
                    onRemove={queueAssetDelete}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedRecipe()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingRecipeId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
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
            <p className="mb-4 text-sm text-gray-500">
              Cards show the cover photo. Each product page shows every photo in a slide viewer.
            </p>
            <div className="grid gap-5 lg:grid-cols-2">
              {products.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-gray-200 p-4">
                  <LFImageGalleryInput
                    label={p.name}
                    folder="fish"
                    value={lfGalleryImages(p.image, p.images)}
                    onChange={(next) => updateProductGallery(p.id, next)}
                  />
                </div>
              ))}
              {products.length === 0 && <p className="text-sm text-gray-500">No fish products yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Seasoning photos</h2>
            <p className="mb-4 text-sm text-gray-500">
              Seasoning cards show the cover photo. Each seasoning page shows every photo in a slide viewer.
            </p>
            <div className="grid gap-5 lg:grid-cols-2">
              {spices.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-200 p-4">
                  <LFImageGalleryInput
                    label={s.name}
                    folder="spices"
                    value={lfGalleryImages(s.image, s.images)}
                    onChange={(next) => updateSpiceGallery(s.id, next)}
                  />
                </div>
              ))}
              {spices.length === 0 && <p className="text-sm text-gray-500">No seasonings yet.</p>}
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

          <LFFileManager />
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
                      <p className="text-xs text-gray-500">{q.requester_email || "N/A"} | {q.requester_phone || "N/A"}</p>
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
          <div className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>From</Label>
                <Input type="date" value={analyticsFrom} onChange={(e) => setAnalyticsFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={analyticsTo} onChange={(e) => setAnalyticsTo(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={() => void loadAnalytics(analyticsFrom || undefined, analyticsTo || undefined)}>Apply</Button>
              <Button variant="outline" onClick={() => { setAnalyticsFrom(""); setAnalyticsTo(""); void loadAnalytics(); }}>Reset</Button>
            </div>
          </div>
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
                  <p className="mt-1 text-xs text-gray-500">Free recipe | spices {analytics.spiceAttachment}%</p>
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
                <h2 className="font-display text-lg font-bold mb-4">Bestsellers</h2>
                <div className="space-y-2">
                  {(analytics.bestsellers || []).map((b: any) => (
                    <div key={b.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{b.name}</span>
                      <span className="font-semibold text-[#073B78]">{b.qty} sold | {Number(b.revenue).toLocaleString()} MWK</span>
                    </div>
                  ))}
                  {(!analytics.bestsellers || analytics.bestsellers.length === 0) && (
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
                <th className="px-4 py-3 text-left">Catch</th>
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
                  <td className="px-4 py-3">
                    {s.fish_products?.fish_species?.name || s.fish_products?.name || "Not set"}
                  </td>
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
                      <option value="pending_payment">pending_payment</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No subscriptions yet.</td></tr>
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
                  <th className="px-4 py-3 text-left">Cutoff</th>
                  <th className="px-4 py-3 text-left">Open</th>
                  <th className="px-4 py-3 text-left">Actions</th>
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
                    <td className="px-4 py-3 text-xs">
                      {s.cutoff_at
                        ? new Date(s.cutoff_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Blantyre" })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSlotOpen(s.id, !s.is_open)}
                        className={`text-xs font-bold ${s.is_open ? "text-[#39B54A]" : "text-gray-400"}`}
                      >
                        {s.is_open ? "Open" : "Closed"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => startEditSlot(s)}
                        className="text-xs font-bold text-[#073B78] underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No slots. Generate above.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {editingSlotId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit delivery slot</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Delivery date</Label>
                  <Input type="date" value={editSlotForm.delivery_date} onChange={(e) => setEditSlotForm({ ...editSlotForm, delivery_date: e.target.value })} />
                </div>
                <div>
                  <Label>Cutoff time</Label>
                  <Input type="time" value={editSlotForm.cutoff_time} onChange={(e) => setEditSlotForm({ ...editSlotForm, cutoff_time: e.target.value })} />
                </div>
                <div>
                  <Label>Capacity orders</Label>
                  <Input type="number" value={editSlotForm.capacity_orders} onChange={(e) => setEditSlotForm({ ...editSlotForm, capacity_orders: e.target.value })} />
                </div>
                <div>
                  <Label>Capacity weight (kg)</Label>
                  <Input type="number" value={editSlotForm.capacity_weight_kg} onChange={(e) => setEditSlotForm({ ...editSlotForm, capacity_weight_kg: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={editSlotForm.is_open}
                      onChange={(e) => setEditSlotForm({ ...editSlotForm, is_open: e.target.checked })}
                      className="h-4 w-4 accent-[#39B54A]"
                    />
                    Open for orders
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void saveEditedSlot()}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditingSlotId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
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
                          {(() => {
                            const next: Record<string, string[]> = {
                              new: ["confirmed"],
                              confirmed: ["processing"],
                              processing: ["dispatched"],
                              dispatched: ["delivered"],
                              delivered: [],
                              cancelled: [],
                              refunded: [],
                            };
                            const options = [o.status, ...(next[o.status] || [])];
                            if (
                              (o.status === "delivered" || o.status === "cancelled") &&
                              o.payment_status === "paid"
                            ) {
                              options.push("refunded");
                            }
                            return Array.from(new Set(options)).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ));
                          })()}
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
                        {o.delivery_proof_url && (
                          <button
                            onClick={() => void viewDeliveryProof(o)}
                            className="text-xs font-bold text-[#08A9E8]"
                          >
                            Proof
                          </button>
                        )}
                        {o.payment_status !== "paid" && (
                          <button
                            onClick={() => markOrderPaid(o.id)}
                            className="text-xs font-bold text-[#39B54A]"
                          >
                            Mark paid
                          </button>
                        )}
                        {!["cancelled", "refunded", "delivered"].includes(o.status) && (
                          <button
                            onClick={() => void cancelOrRefundOrder(o.id, "cancelled")}
                            className="text-xs font-bold text-red-600"
                          >
                            Cancel
                          </button>
                        )}
                        {(o.status === "delivered" || o.status === "cancelled") &&
                          o.payment_status === "paid" && (
                          <button
                            onClick={() => void cancelOrRefundOrder(o.id, "refunded")}
                            className="text-xs font-bold text-red-600"
                          >
                            Record refund
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
                                  ? `${Number(item.preparation.requested_weight_kg).toFixed(1)} kg | ${item.preparation.preparation_type}`
                                  : `${item.quantity} item(s)`}
                                {item.recipe_title ? (
                                  <span className="ml-1 text-[#39B54A]"> | free recipe: {item.recipe_title}</span>
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

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Price checks</h2>
            <p className="mt-1 text-sm text-gray-500">
              Estimated total compared with the final packed weight. The customer sees this on their order page.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Estimated</th>
                    <th className="px-4 py-3 text-right">Final</th>
                    <th className="px-4 py-3 text-right">Difference</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs">{r.orders?.payment_reference || r.order_id}</td>
                      <td className="px-4 py-3">{r.orders?.customer_name || "Customer"}</td>
                      <td className="px-4 py-3 text-right">{formatMWK(r.estimated_total_mwk)}</td>
                      <td className="px-4 py-3 text-right">{r.final_total_mwk == null ? "N/A" : formatMWK(r.final_total_mwk)}</td>
                      <td className="px-4 py-3 text-right">{r.difference_mwk == null ? "N/A" : formatMWK(r.difference_mwk)}</td>
                      <td className="px-4 py-3 text-xs font-bold">{r.status}</td>
                      <td className="px-4 py-3 text-xs">
                        {r.customer_confirmed_at ? "Agreed" : "Waiting"}
                      </td>
                    </tr>
                  ))}
                  {reconciliations.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No price checks yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">Refund record</h2>
            <p className="mt-1 text-sm text-gray-500">
              Every refund is recorded here with its reason and gateway reference. No gateway refund is sent automatically.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Gateway reference</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.orders?.payment_reference || r.order_id}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMWK(r.amount_mwk)}</td>
                      <td className="px-4 py-3 text-xs">{r.reason}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.gateway_reference || "N/A"}</td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No refunds recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
            <h2 className="font-display text-lg font-bold mb-1">Add delivery location</h2>
            <p className="mb-4 text-xs text-gray-500">
              Active locations appear on the home page and in checkout and subscriptions.
            </p>
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
              <Plus className="h-4 w-4 mr-2" /> Add location
            </Button>
          </div>

          {editingZoneId ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold mb-4">Edit delivery location</h2>
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
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-right">Base fee</th>
                  <th className="px-4 py-3 text-right">Min order</th>
                  <th className="px-4 py-3 text-left">Active</th>
                  <th className="px-4 py-3 text-left">Actions</th>
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
                        <button
                          onClick={() => void deleteZoneRecord(z)}
                          className="text-xs font-bold text-red-600 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No zones yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ZONE CENTERS (map) */}
      {tab === "delivery" && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-display text-lg font-bold mb-4">Set zone center on map</h2>
          <p className="text-xs text-gray-500 mb-3">Choose a zone, then tap the map to set its center. Used as a fallback pin for orders without a precise location.</p>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div>
              <Label>Zone</Label>
              <select
                value={centerZoneId}
                onChange={(e) => {
                  setCenterZoneId(e.target.value);
                  const z = (zones || []).find((x: any) => x.id === e.target.value);
                  if (z) { setCenterLat(z.center_lat ?? null); setCenterLng(z.center_lng ?? null); }
                }}
                className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
              >
                <option value="">Select zone...</option>
                {(zones || []).map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => void saveZoneCenter()} disabled={!centerZoneId || centerLat == null || centerLng == null}>
              Save center
            </Button>
            {centerLat != null && centerLng != null && (
              <span className="text-xs text-gray-600">{centerLat.toFixed(5)}, {centerLng.toFixed(5)}</span>
            )}
          </div>
          <LeafletMap
            center={centerLat != null && centerLng != null ? [centerLat, centerLng] : [-15.7861, 35.0058]}
            zoom={centerLat != null ? 14 : 12}
            marker={centerLat != null && centerLng != null ? { lat: centerLat, lng: centerLng } : null}
            onClick={(lat, lng) => { setCenterLat(lat); setCenterLng(lng); }}
            height={320}
          />
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
                      label: `${i + 1}. ${o.customer_name} | ${o.customer_phone}`,
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
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimizeRoute(routeOrders).map((o, i) => (
                      <tr key={o.id} className="border-t">
                        <td className="px-4 py-3 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                        <td className="px-4 py-3">{o.customer_phone}</td>
                        <td className="px-4 py-3">{o.house_number || "-"}</td>
                        <td className="px-4 py-3">{o.street_name || "-"}</td>
                        <td className="px-4 py-3">{o.customer_location || "-"}</td>
                        <td className="px-4 py-3 text-xs">
                          {(o.items || []).map((it: any) => `${it.product_name} x ${it.quantity}`).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3">{o.delivery_window || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${o.payment_status === "paid" ? "text-[#39B54A]" : "text-amber-600"}`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {o.status === "processing" && (
                            <button
                              onClick={() => dispatchOrder(o.id)}
                              className="text-xs font-bold text-[#08A9E8] underline mr-2"
                            >
                              Dispatch
                            </button>
                          )}
                          {o.status === "dispatched" && (
                            <button
                              onClick={() => void updateOrderStatus(o.id, "delivered")}
                              className="text-xs font-bold text-[#39B54A] underline"
                            >
                              Mark delivered
                            </button>
                          )}
                          {o.status === "delivered" && (
                            <span className="text-xs font-bold text-[#39B54A]">Delivered</span>
                          )}
                          {o.status === "dispatched" && (
                            <span className="text-xs font-bold text-[#08A9E8]">Dispatched</span>
                          )}
                        </td>
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

      {/* SUPPORT */}
      {tab === "support" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Request</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Opened</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`cursor-pointer border-t ${selectedTicketId === ticket.id ? "bg-[#EAF6FB]" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{ticket.customer_name}</div>
                      <div className="text-xs text-gray-500">{ticket.customer_phone || ticket.customer_email || "Guest"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-xs text-gray-500">{ticket.category} | {ticket.priority}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${ticket.sla_breached_at ? "text-red-600" : ticket.status === "waiting" ? "text-amber-600" : "text-[#39B54A]"}`}>
                        {ticket.sla_breached_at ? "Late" : ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(ticket.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {supportTickets.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No help requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border bg-white p-5">
            {selectedTicketId ? (
              (() => {
                const ticket = supportTickets.find((item) => item.id === selectedTicketId);
                if (!ticket) return <p className="text-sm text-gray-500">Choose a request.</p>;
                return (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-lg font-bold">{ticket.subject}</h2>
                      <p className="text-xs text-gray-500">
                        {ticket.customer_name} | {ticket.category} | {ticket.priority}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Reply due {new Date(ticket.sla_due_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3">
                      {(ticket.lf_support_messages || []).map((message: any) => (
                        <div
                          key={message.id}
                          className={`rounded-lg p-2 text-xs ${message.actor_role === "staff" ? "bg-[#073B78] text-white" : "bg-white text-gray-700"}`}
                        >
                          <p className="font-bold opacity-70">{message.actor_role === "staff" ? "You" : "Customer"}</p>
                          <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["open", "waiting", "resolved", "closed"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={ticket.status === status ? "default" : "outline"}
                          disabled={loading}
                          onClick={() => void changeTicketStatus(ticket.id, status)}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>

                    <div>
                      <Label>Your reply</Label>
                      <Textarea
                        value={ticketReply}
                        onChange={(event) => setTicketReply(event.target.value)}
                        rows={4}
                        maxLength={4000}
                        placeholder="Write a clear answer"
                        className="mt-1"
                      />
                      <Button className="mt-3" disabled={loading || !ticketReply.trim()} onClick={() => void replyToTicket(ticket.id)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Send reply
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-10 text-center text-sm text-gray-500">
                Choose a help request to read and answer it.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMERS */}
      {tab === "customers" && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Consent</th>
                <th className="px-4 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.full_name || "N/A"}</td>
                  <td className="px-4 py-3">{c.phone || "N/A"}</td>
                  <td className="px-4 py-3">{c.location || "N/A"}</td>
                  <td className="px-4 py-3">{c.marketing_consent ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-xs">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "N/A"}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLakeFresh;

const PreparationRow = ({ prep, onSave }: { prep: any; onSave: (id: string, packed: string) => void }) => {
  const [packed, setPacked] = useState(prep.packed_weight_kg ? String(prep.packed_weight_kg) : "");
  return (
    <tr className="border-t">
      <td className="px-4 py-3 text-xs font-mono">{prep.order?.customer_name || prep.item?.order_id?.slice(0, 8)}</td>
      <td className="px-4 py-3 text-xs">{prep.item?.product_name || "N/A"}</td>
      <td className="px-4 py-3 text-right">{Number(prep.requested_weight_kg || 0).toFixed(2)}</td>
      <td className="px-4 py-3">
        <Input className="h-8 w-20" type="number" step="0.01" value={packed} onChange={(e) => setPacked(e.target.value)} />
      </td>
      <td className="px-4 py-3 text-right">{prep.price_per_kg_mwk ? formatMWK(prep.price_per_kg_mwk) : "N/A"}</td>
      <td className="px-4 py-3 text-right">
        {packed && prep.price_per_kg_mwk
          ? formatMWK(Number(packed) * Number(prep.price_per_kg_mwk))
          : prep.final_price_mwk
            ? formatMWK(prep.final_price_mwk)
            : "N/A"}
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
        <Button size="sm" onClick={() => onSave(prep.id, packed)}>Save</Button>
      </td>
    </tr>
  );
};
