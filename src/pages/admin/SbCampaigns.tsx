import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SB_BRAND_ID, SB_CAMPAIGN_IMAGE_MIX, SB_COLLECTION_SECTIONS } from "@/data/sbArchitecture";
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
import { Edit, LayoutDashboard, Loader2, Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type CampaignRow = Database["public"]["Tables"]["sb_campaigns"]["Row"];
type PlacementRow = Database["public"]["Tables"]["sb_editorial_placements"]["Row"];
type ProductOption = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "name" | "sku">;
type LookOption = Pick<Database["public"]["Tables"]["sb_looks"]["Row"], "id" | "title" | "slug">;
type CollectionOption = Pick<Database["public"]["Tables"]["sb_collections"]["Row"], "id" | "name" | "slug">;

interface CampaignForm {
  name: string;
  slug: string;
  headline: string;
  description: string;
  hero_image: string;
  cta_label: string;
  cta_href: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface PlacementForm {
  section_key: string;
  campaign_id: string;
  product_id: string;
  look_id: string;
  collection_id: string;
  headline: string;
  body: string;
  cta_label: string;
  cta_href: string;
  image_override: string;
  sort_order: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

type Tab = "campaigns" | "placements";

const emptyCampaign: CampaignForm = {
  name: "",
  slug: "",
  headline: "",
  description: "",
  hero_image: "",
  cta_label: "",
  cta_href: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

const emptyPlacement: PlacementForm = {
  section_key: SB_COLLECTION_SECTIONS[0],
  campaign_id: "",
  product_id: "",
  look_id: "",
  collection_id: "",
  headline: "",
  body: "",
  cta_label: "",
  cta_href: "",
  image_override: "",
  sort_order: 0,
  starts_at: "",
  ends_at: "",
  is_active: true,
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

const toDateTimeLocal = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const windowLabel = (startsAt: string | null, endsAt: string | null) => {
  if (!startsAt && !endsAt) return "-";
  const format = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "open";
  return `${format(startsAt)} → ${format(endsAt)}`;
};

const SbCampaigns = () => {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [looks, setLooks] = useState<LookOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRow | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaign);
  const [campaignSaving, setCampaignSaving] = useState(false);

  const [placementDialogOpen, setPlacementDialogOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<PlacementRow | null>(null);
  const [placementForm, setPlacementForm] = useState<PlacementForm>(emptyPlacement);
  const [placementSaving, setPlacementSaving] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [campaignRes, placementRes, productRes, lookRes, collectionRes] = await Promise.all([
      supabase
        .from("sb_campaigns")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("created_at", { ascending: false }),
      supabase
        .from("sb_editorial_placements")
        .select("*")
        .eq("brand_id", SB_BRAND_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, sku")
        .eq("brand_id", SB_BRAND_ID)
        .order("name", { ascending: true }),
      supabase
        .from("sb_looks")
        .select("id, title, slug")
        .eq("brand_id", SB_BRAND_ID)
        .order("title", { ascending: true }),
      supabase
        .from("sb_collections")
        .select("id, name, slug")
        .eq("brand_id", SB_BRAND_ID)
        .order("name", { ascending: true }),
    ]);

    const failed = [campaignRes, placementRes, productRes, lookRes, collectionRes].find(
      (result) => result.error,
    );
    if (failed?.error) {
      toast({ title: "Error loading SB campaigns", description: failed.error.message, variant: "destructive" });
    } else {
      setCampaigns(campaignRes.data || []);
      setPlacements(placementRes.data || []);
      setProducts((productRes.data || []) as ProductOption[]);
      setLooks((lookRes.data || []) as LookOption[]);
      setCollections((collectionRes.data || []) as CollectionOption[]);
    }
    setLoading(false);
  };

  // ── Campaign CRUD ──

  const openCampaignDialog = (row?: CampaignRow) => {
    setEditingCampaign(row || null);
    setCampaignForm(
      row
        ? {
            name: row.name,
            slug: row.slug,
            headline: row.headline || "",
            description: row.description || "",
            hero_image: row.hero_image || "",
            cta_label: row.cta_label || "",
            cta_href: row.cta_href || "",
            starts_at: toDateTimeLocal(row.starts_at),
            ends_at: toDateTimeLocal(row.ends_at),
            is_active: row.is_active,
          }
        : emptyCampaign,
    );
    setCampaignDialogOpen(true);
  };

  const resetCampaignDialog = (open: boolean) => {
    setCampaignDialogOpen(open);
    if (!open) {
      setEditingCampaign(null);
      setCampaignForm(emptyCampaign);
    }
  };

  const saveCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }
    const startsAt = fromDateTimeLocal(campaignForm.starts_at);
    const endsAt = fromDateTimeLocal(campaignForm.ends_at);
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }

    setCampaignSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        name: campaignForm.name.trim(),
        slug: campaignForm.slug.trim() || slugify(campaignForm.name),
        headline: campaignForm.headline.trim() || null,
        description: campaignForm.description.trim() || null,
        hero_image: campaignForm.hero_image.trim() || null,
        cta_label: campaignForm.cta_label.trim() || null,
        cta_href: campaignForm.cta_href.trim() || null,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: campaignForm.is_active,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("sb_campaigns")
          .update(payload)
          .eq("id", editingCampaign.id)
          .eq("brand_id", SB_BRAND_ID);
        if (error) {
          toast({ title: "Error updating campaign", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Campaign updated!" });
      } else {
        const { error } = await supabase.from("sb_campaigns").insert(payload);
        if (error) {
          toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Campaign created!" });
      }
      resetCampaignDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving campaign",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCampaignSaving(false);
    }
  };

  const removeCampaign = async (row: CampaignRow) => {
    if (!window.confirm(`Delete campaign "${row.name}"?`)) return;
    const { error: placementError } = await supabase
      .from("sb_editorial_placements")
      .update({ campaign_id: null })
      .eq("campaign_id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (placementError) {
      toast({
        title: "Error unlinking campaign placements",
        description: placementError.message,
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase
      .from("sb_campaigns")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting campaign", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Campaign deleted" });
    await fetchAll();
  };

  // ── Editorial placement CRUD ──

  const openPlacementDialog = (row?: PlacementRow) => {
    setEditingPlacement(row || null);
    setPlacementForm(
      row
        ? {
            section_key: row.section_key,
            campaign_id: row.campaign_id || "",
            product_id: row.product_id || "",
            look_id: row.look_id || "",
            collection_id: row.collection_id || "",
            headline: row.headline || "",
            body: row.body || "",
            cta_label: row.cta_label || "",
            cta_href: row.cta_href || "",
            image_override: row.image_override || "",
            sort_order: row.sort_order,
            starts_at: toDateTimeLocal(row.starts_at),
            ends_at: toDateTimeLocal(row.ends_at),
            is_active: row.is_active,
          }
        : emptyPlacement,
    );
    setPlacementDialogOpen(true);
  };

  const resetPlacementDialog = (open: boolean) => {
    setPlacementDialogOpen(open);
    if (!open) {
      setEditingPlacement(null);
      setPlacementForm(emptyPlacement);
    }
  };

  const savePlacement = async () => {
    if (!placementForm.section_key) {
      toast({ title: "Section is required", variant: "destructive" });
      return;
    }
    const startsAt = fromDateTimeLocal(placementForm.starts_at);
    const endsAt = fromDateTimeLocal(placementForm.ends_at);
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }

    setPlacementSaving(true);
    try {
      const payload = {
        brand_id: SB_BRAND_ID,
        section_key: placementForm.section_key,
        campaign_id: placementForm.campaign_id || null,
        product_id: placementForm.product_id || null,
        look_id: placementForm.look_id || null,
        collection_id: placementForm.collection_id || null,
        headline: placementForm.headline.trim() || null,
        body: placementForm.body.trim() || null,
        cta_label: placementForm.cta_label.trim() || null,
        cta_href: placementForm.cta_href.trim() || null,
        image_override: placementForm.image_override.trim() || null,
        sort_order: placementForm.sort_order,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: placementForm.is_active,
      };

      if (editingPlacement) {
        const { error } = await supabase
          .from("sb_editorial_placements")
          .update(payload)
          .eq("id", editingPlacement.id)
          .eq("brand_id", SB_BRAND_ID);
        if (error) {
          toast({ title: "Error updating placement", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Placement updated!" });
      } else {
        const { error } = await supabase.from("sb_editorial_placements").insert(payload);
        if (error) {
          toast({ title: "Error creating placement", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Placement created!" });
      }
      resetPlacementDialog(false);
      await fetchAll();
    } catch (err) {
      toast({
        title: "Error saving placement",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPlacementSaving(false);
    }
  };

  const removePlacement = async (row: PlacementRow) => {
    if (!window.confirm(`Delete placement in "${row.section_key}"?`)) return;
    const { error } = await supabase
      .from("sb_editorial_placements")
      .delete()
      .eq("id", row.id)
      .eq("brand_id", SB_BRAND_ID);
    if (error) {
      toast({ title: "Error deleting placement", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Placement deleted" });
    await fetchAll();
  };

  const targetLabel = (row: PlacementRow) => {
    if (row.campaign_id) {
      const match = campaigns.find((campaign) => campaign.id === row.campaign_id);
      return `Campaign: ${match?.name || "removed"}`;
    }
    if (row.product_id) {
      const match = products.find((product) => product.id === row.product_id);
      return `Product: ${match?.name || "removed"}`;
    }
    if (row.look_id) {
      const match = looks.find((look) => look.id === row.look_id);
      return `Look: ${match?.title || "removed"}`;
    }
    if (row.collection_id) {
      const match = collections.find((collection) => collection.id === row.collection_id);
      return `Collection: ${match?.name || "removed"}`;
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7" /> SB Campaigns &amp; Editorial
        </h1>
        <p className="text-gray-500">Manage campaigns and homepage editorial placements</p>
        <p className="mt-2 max-w-3xl text-xs text-gray-500">
          Keep campaign imagery balanced across the wardrobe: {SB_CAMPAIGN_IMAGE_MIX.TEE}% tees,{" "}
          {SB_CAMPAIGN_IMAGE_MIX.VEST}% vests, {SB_CAMPAIGN_IMAGE_MIX.SHORT_SLEEVE_SHIRT}% shirts and{" "}
          {SB_CAMPAIGN_IMAGE_MIX.SHORTS}% shorts. SB is a streetwear wardrobe, not just a T-shirt seller.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === "campaigns" ? "default" : "outline"}
          onClick={() => setTab("campaigns")}
        >
          <Megaphone className="h-4 w-4" /> Campaigns
        </Button>
        <Button
          variant={tab === "placements" ? "default" : "outline"}
          onClick={() => setTab("placements")}
        >
          <LayoutDashboard className="h-4 w-4" /> Editorial Placements
        </Button>
      </div>

      {tab === "campaigns" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl">Campaigns</h2>
              <p className="text-sm text-gray-500">Promotions with optional schedules and CTAs</p>
            </div>
            <Dialog open={campaignDialogOpen} onOpenChange={resetCampaignDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => openCampaignDialog()}>
                  <Plus className="h-4 w-4" /> Add Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCampaign ? "Edit Campaign" : "New Campaign"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={campaignForm.name}
                        onChange={(e) =>
                          setCampaignForm((p) => ({
                            ...p,
                            name: e.target.value,
                            slug: p.slug || slugify(e.target.value),
                          }))
                        }
                        placeholder="e.g., Fall DropLaunch"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug *</Label>
                      <Input
                        value={campaignForm.slug}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, slug: e.target.value }))}
                        placeholder="fall-drop"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={campaignForm.headline}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, headline: e.target.value }))}
                      placeholder="Main campaign headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Image URL</Label>
                    <Input
                      value={campaignForm.hero_image}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, hero_image: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Label</Label>
                      <Input
                        value={campaignForm.cta_label}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, cta_label: e.target.value }))}
                        placeholder="Shop the drop"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Href</Label>
                      <Input
                        value={campaignForm.cta_href}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, cta_href: e.target.value }))}
                        placeholder="/collections/fall-drop"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Starts At</Label>
                      <Input
                        type="datetime-local"
                        value={campaignForm.starts_at}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, starts_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ends At</Label>
                      <Input
                        type="datetime-local"
                        value={campaignForm.ends_at}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, ends_at: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="sb-campaign-active"
                      type="checkbox"
                      checked={campaignForm.is_active}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <Label htmlFor="sb-campaign-active">Active</Label>
                  </div>
                  <Button
                    onClick={() => void saveCampaign()}
                    disabled={campaignSaving || !campaignForm.name.trim() || !campaignForm.slug.trim()}
                    className="w-full"
                  >
                    {campaignSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingCampaign ? "Update" : "Create"}
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
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Headline</th>
                  <th className="text-left px-4 py-3 font-medium">CTA</th>
                  <th className="text-left px-4 py-3 font-medium">Window</th>
                  <th className="text-center px-4 py-3 font-medium">Active</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.slug}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{row.headline || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {row.cta_label ? `${row.cta_label} → ${row.cta_href || "#"}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {windowLabel(row.starts_at, row.ends_at)}
                    </td>
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
                        <Button variant="ghost" size="icon" onClick={() => openCampaignDialog(row)}>
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void removeCampaign(row)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No campaigns yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl">Editorial Placements</h2>
              <p className="text-sm text-gray-500">Control what appears in each homepage section</p>
            </div>
            <Dialog open={placementDialogOpen} onOpenChange={resetPlacementDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => openPlacementDialog()}>
                  <Plus className="h-4 w-4" /> Add Placement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPlacement ? "Edit Placement" : "New Placement"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <select
                        className={selectClass}
                        value={placementForm.section_key}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, section_key: e.target.value }))}
                      >
                        {SB_COLLECTION_SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            {section.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        value={placementForm.sort_order}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, sort_order: toNumber(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Campaign (optional)</Label>
                      <select
                        className={selectClass}
                        value={placementForm.campaign_id}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, campaign_id: e.target.value }))}
                      >
                        <option value="">None</option>
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Product (optional)</Label>
                      <select
                        className={selectClass}
                        value={placementForm.product_id}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, product_id: e.target.value }))}
                      >
                        <option value="">None</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Look (optional)</Label>
                      <select
                        className={selectClass}
                        value={placementForm.look_id}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, look_id: e.target.value }))}
                      >
                        <option value="">None</option>
                        {looks.map((look) => (
                          <option key={look.id} value={look.id}>
                            {look.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Collection (optional)</Label>
                      <select
                        className={selectClass}
                        value={placementForm.collection_id}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, collection_id: e.target.value }))}
                      >
                        <option value="">None</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={placementForm.headline}
                      onChange={(e) => setPlacementForm((p) => ({ ...p, headline: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Body</Label>
                    <Textarea
                      value={placementForm.body}
                      onChange={(e) => setPlacementForm((p) => ({ ...p, body: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Label</Label>
                      <Input
                        value={placementForm.cta_label}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, cta_label: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Href</Label>
                      <Input
                        value={placementForm.cta_href}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, cta_href: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image Override URL</Label>
                    <Input
                      value={placementForm.image_override}
                      onChange={(e) => setPlacementForm((p) => ({ ...p, image_override: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Starts At</Label>
                      <Input
                        type="datetime-local"
                        value={placementForm.starts_at}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, starts_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ends At</Label>
                      <Input
                        type="datetime-local"
                        value={placementForm.ends_at}
                        onChange={(e) => setPlacementForm((p) => ({ ...p, ends_at: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="sb-placement-active"
                      type="checkbox"
                      checked={placementForm.is_active}
                      onChange={(e) => setPlacementForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <Label htmlFor="sb-placement-active">Active</Label>
                  </div>
                  <Button
                    onClick={() => void savePlacement()}
                    disabled={placementSaving || !placementForm.section_key}
                    className="w-full"
                  >
                    {placementSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingPlacement ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">Headline</th>
                  <th className="text-left px-4 py-3 font-medium">CTA</th>
                  <th className="text-left px-4 py-3 font-medium">Window</th>
                  <th className="text-center px-4 py-3 font-medium">Order</th>
                  <th className="text-center px-4 py-3 font-medium">Active</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{row.section_key}</td>
                    <td className="px-4 py-3 text-gray-600">{targetLabel(row)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{row.headline || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                      {row.cta_label ? `${row.cta_label} → ${row.cta_href || "#"}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{windowLabel(row.starts_at, row.ends_at)}</td>
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
                        <Button variant="ghost" size="icon" onClick={() => openPlacementDialog(row)}>
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void removePlacement(row)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {placements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No placements yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SbCampaigns;
