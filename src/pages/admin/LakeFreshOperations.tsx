import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatMWK } from "@/data/products";
import { LF_BRAND_ID } from "@/lib/adminBrand";
import { Loader2, RefreshCw } from "lucide-react";

type Tab = "lots" | "qa" | "recalls" | "audit" | "team";

const TABS: Array<{ key: Tab; label: string; note: string }> = [
  { key: "lots", label: "Lots", note: "Where each fish came from" },
  { key: "qa", label: "QA", note: "Checks before dispatch" },
  { key: "recalls", label: "Recalls", note: "Lots placed on hold" },
  { key: "audit", label: "Audit", note: "Who changed what" },
  { key: "team", label: "Team", note: "Who can use the admin" },
];

const TEAM_PERMISSIONS = [
  "brand.access",
  "lf.orders.read",
  "lf.orders.write",
  "lf.reconcile.write",
  "lf.stock.write",
  "lf.delivery.write",
  "lf.suppliers.read",
  "lf.suppliers.write",
  "lf.traceability.read",
  "lf.traceability.write",
  "lf.audit.read",
  "lf.team.read",
  "lf.team.write",
  "email.transactional",
  "email.admin_notification",
  "email.broadcast",
];

const when = (value: string | null | undefined) => {
  if (!value) return "Not yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not yet" : date.toLocaleString();
};

const emptyLotForm = {
  lot_code: "",
  species_id: "",
  supplier_id: "",
  source_location: "",
  received_date: new Date().toISOString().slice(0, 10),
  expiry_date: "",
  weight_kg_received: "",
  notes: "",
};

const emptyQaForm = {
  lot_id: "",
  batch_id: "",
  check_type: "Visual and weight",
  result: "passed",
  notes: "",
};

const emptyRecallForm = {
  recall_ref: "",
  reason: "",
  lot_id: "",
  affected_weight_kg: "",
  action_taken: "",
};

const emptyTeamForm = {
  user_id: "",
  role: "lf_fulfillment",
  permissions: {} as Record<string, boolean>,
};

const AdminLakeFreshOperations = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.some((item) => item.key === tabParam) ? tabParam : "lots";
  const setTab = (next: Tab) => setSearchParams({ tab: next });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [species, setSpecies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [qaChecks, setQaChecks] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [recallLots, setRecallLots] = useState<any[]>([]);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [staffRows, setStaffRows] = useState<any[]>([]);

  const [lotForm, setLotForm] = useState(emptyLotForm);
  const [batchLinkForm, setBatchLinkForm] = useState({ batch_id: "", lot_id: "", supplier_id: "" });
  const [qaForm, setQaForm] = useState(emptyQaForm);
  const [recallForm, setRecallForm] = useState(emptyRecallForm);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [editingStaffKey, setEditingStaffKey] = useState<string | null>(null);

  const report = (label: string, error: any) => {
    if (!error) return;
    toast({ title: `${label} could not load`, description: error.message, variant: "destructive" });
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        lotRes,
        speciesRes,
        supplierRes,
        batchRes,
        qaRes,
        recallRes,
        recallLotRes,
        reconRes,
        refundRes,
        deliveryRes,
        authRes,
        staffRes,
      ] = await Promise.all([
        supabase.from("lf_lot_records").select("*").eq("brand_id", LF_BRAND_ID).order("received_date", { ascending: false }).limit(200),
        supabase.from("fish_species").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name").eq("brand_id", LF_BRAND_ID).order("name"),
        supabase.from("fish_inventory_batches").select("*").eq("brand_id", LF_BRAND_ID).order("received_date", { ascending: false }).limit(300),
        supabase.from("lf_qa_checks").select("*").eq("brand_id", LF_BRAND_ID).order("checked_at", { ascending: false }).limit(300),
        supabase.from("lf_recall_events").select("*").eq("brand_id", LF_BRAND_ID).order("started_at", { ascending: false }).limit(200),
        supabase.from("lf_recall_lots").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(300),
        supabase.from("lf_reconciliation_audit").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(200),
        supabase.from("lf_refund_audit").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(200),
        supabase.from("lf_delivery_events").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(200),
        supabase.from("auth_audit_log").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(200),
        supabase.from("staff_permissions").select("*").eq("brand_id", LF_BRAND_ID).order("created_at", { ascending: false }).limit(200),
      ]);

      report("Lots", lotRes.error);
      report("Fish types", speciesRes.error);
      report("Suppliers", supplierRes.error);
      report("Batches", batchRes.error);
      report("Quality checks", qaRes.error);
      report("Recalls", recallRes.error);
      report("Recalled lots", recallLotRes.error);
      report("Price audit", reconRes.error);
      report("Refund audit", refundRes.error);
      report("Delivery audit", deliveryRes.error);
      report("Admin audit", authRes.error);
      report("Team", staffRes.error);

      setLots(lotRes.data || []);
      setSpecies(speciesRes.data || []);
      setSuppliers(supplierRes.data || []);
      setBatches(batchRes.data || []);
      setQaChecks(qaRes.data || []);
      setRecalls(recallRes.data || []);
      setRecallLots(recallLotRes.data || []);
      setStaffRows(staffRes.data || []);

      const rows = [
        ...(reconRes.data || []).map((item: any) => ({
          id: item.id,
          kind: "Price check",
          action: item.action,
          at: item.created_at,
          actor: item.actor_id,
          detail: `Final total ${formatMWK(Number(item.final_total_mwk || 0))}`,
        })),
        ...(refundRes.data || []).map((item: any) => ({
          id: item.id,
          kind: "Refund",
          action: `Refund ${formatMWK(Number(item.amount_mwk || 0))}`,
          at: item.created_at,
          actor: item.actor_id,
          detail: item.reason || "",
        })),
        ...(deliveryRes.data || []).map((item: any) => ({
          id: item.id,
          kind: "Delivery",
          action: "Photo saved",
          at: item.created_at,
          actor: item.actor_id,
          detail: item.note || "",
        })),
        ...(authRes.data || []).map((item: any) => ({
          id: item.id,
          kind: "Admin",
          action: item.action,
          at: item.created_at,
          actor: item.admin_user_id,
          detail: item.target_id || "",
        })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setAuditRows(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const nameFor = (list: any[], id: string | null | undefined) =>
    list.find((item) => item.id === id)?.name || "Not set";

  const lotCodeFor = (id: string | null | undefined) =>
    lots.find((item) => item.id === id)?.lot_code || "Not set";

  const saveLot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lotForm.lot_code.trim()) {
      toast({ title: "Add a lot code", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("lf_lot_records").insert({
        brand_id: LF_BRAND_ID,
        lot_code: lotForm.lot_code.trim(),
        species_id: lotForm.species_id || null,
        supplier_id: lotForm.supplier_id || null,
        supplier_brand_id: lotForm.supplier_id ? LF_BRAND_ID : null,
        source_location: lotForm.source_location.trim() || null,
        received_date: lotForm.received_date,
        expiry_date: lotForm.expiry_date || null,
        weight_kg_received: Number(lotForm.weight_kg_received || 0),
        notes: lotForm.notes.trim() || null,
        created_by: user?.id || null,
      });
      if (error) throw error;
      setLotForm(emptyLotForm);
      toast({ title: "Lot saved" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Lot not saved", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const linkBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!batchLinkForm.batch_id || !batchLinkForm.lot_id) {
      toast({ title: "Choose a batch and a lot", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("fish_inventory_batches")
        .update({
          lot_id: batchLinkForm.lot_id,
          supplier_id: batchLinkForm.supplier_id || null,
          supplier_brand_id: batchLinkForm.supplier_id ? LF_BRAND_ID : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", batchLinkForm.batch_id)
        .eq("brand_id", LF_BRAND_ID);
      if (error) throw error;
      setBatchLinkForm({ batch_id: "", lot_id: "", supplier_id: "" });
      toast({ title: "Batch linked to lot" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Batch not linked", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveQa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!qaForm.lot_id && !qaForm.batch_id) {
      toast({ title: "Choose a lot or a batch", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("lf_qa_checks").insert({
        brand_id: LF_BRAND_ID,
        lot_id: qaForm.lot_id || null,
        batch_id: qaForm.batch_id || null,
        check_type: qaForm.check_type.trim(),
        result: qaForm.result,
        notes: qaForm.notes.trim() || null,
        checked_by: user?.id || null,
      });
      if (error) throw error;
      setQaForm(emptyQaForm);
      toast({ title: "Quality check saved" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Check not saved", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveRecall = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recallForm.recall_ref.trim() || !recallForm.reason.trim()) {
      toast({ title: "Add a reference and reason", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: eventRow, error: eventError } = await supabase
        .from("lf_recall_events")
        .insert({
          brand_id: LF_BRAND_ID,
          recall_ref: recallForm.recall_ref.trim(),
          reason: recallForm.reason.trim(),
          created_by: user?.id || null,
        })
        .select("id")
        .single();
      if (eventError) throw eventError;

      if (recallForm.lot_id) {
        const { error: lotError } = await supabase.from("lf_recall_lots").insert({
          brand_id: LF_BRAND_ID,
          recall_id: eventRow.id,
          lot_id: recallForm.lot_id,
          affected_weight_kg: recallForm.affected_weight_kg ? Number(recallForm.affected_weight_kg) : null,
          action_taken: recallForm.action_taken.trim() || null,
        });
        if (lotError) throw lotError;
      }

      setRecallForm(emptyRecallForm);
      toast({ title: "Recall opened" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Recall not saved", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const closeRecall = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lf_recall_events")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("brand_id", LF_BRAND_ID);
      if (error) throw error;
      toast({ title: "Recall closed" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Recall not closed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[0-9a-f-]{36}$/i.test(teamForm.user_id)) {
      toast({ title: "Enter a valid user ID", variant: "destructive" });
      return;
    }
    const permissions =
      teamForm.role === "owner" || teamForm.role === "admin"
        ? { "*": true }
        : Object.fromEntries(
            TEAM_PERMISSIONS.filter((key) => teamForm.permissions[key]).map((key) => [key, true]),
          );
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("lf_admin_set_staff_permission", {
        p_user_id: teamForm.user_id,
        p_brand_id: LF_BRAND_ID,
        p_role: teamForm.role,
        p_permissions: permissions,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.ok) throw new Error(result?.reason || "We could not save that role.");
      setTeamForm(emptyTeamForm);
      setEditingStaffKey(null);
      toast({ title: "Team access saved" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Team access not saved", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (row: any) => {
    if (!window.confirm(`Remove ${row.role} access for this user?`)) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("lf_admin_remove_staff_permission", {
        p_user_id: row.user_id,
        p_brand_id: LF_BRAND_ID,
        p_role: row.role,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.ok) throw new Error(result?.reason || "We could not remove that role.");
      toast({ title: "Team access removed" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Team access not removed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const editTeam = (row: any) => {
    setEditingStaffKey(`${row.user_id}:${row.role}`);
    setTeamForm({
      user_id: row.user_id,
      role: row.role,
      permissions: Object.fromEntries(
        Object.entries(row.permissions || {}).filter(([, value]) => value === true),
      ) as Record<string, boolean>,
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#073B78]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#073B78]">Operations</h1>
          <p className="text-sm text-gray-500">Trace every fish, check quality and manage the team.</p>
        </div>
        <Button variant="outline" onClick={() => void loadAll()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item.key}
            variant={tab === item.key ? "default" : "outline"}
            onClick={() => setTab(item.key)}
            title={item.note}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "lots" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <form onSubmit={saveLot} className="space-y-3 rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold">Add a lot</h2>
              <div>
                <Label>Lot code</Label>
                <Input value={lotForm.lot_code} onChange={(e) => setLotForm({ ...lotForm, lot_code: e.target.value })} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Fish type</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={lotForm.species_id}
                    onChange={(e) => setLotForm({ ...lotForm, species_id: e.target.value })}
                  >
                    <option value="">Choose fish</option>
                    {species.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={lotForm.supplier_id}
                    onChange={(e) => setLotForm({ ...lotForm, supplier_id: e.target.value })}
                  >
                    <option value="">Choose supplier</option>
                    {suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Received</Label>
                  <Input type="date" value={lotForm.received_date} onChange={(e) => setLotForm({ ...lotForm, received_date: e.target.value })} required />
                </div>
                <div>
                  <Label>Expiry</Label>
                  <Input type="date" value={lotForm.expiry_date} onChange={(e) => setLotForm({ ...lotForm, expiry_date: e.target.value })} />
                </div>
                <div>
                  <Label>Weight in kg</Label>
                  <Input type="number" step="0.001" min="0" value={lotForm.weight_kg_received} onChange={(e) => setLotForm({ ...lotForm, weight_kg_received: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Where it came from</Label>
                <Input value={lotForm.source_location} onChange={(e) => setLotForm({ ...lotForm, source_location: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={lotForm.notes} onChange={(e) => setLotForm({ ...lotForm, notes: e.target.value })} />
              </div>
              <Button type="submit" disabled={saving}>Save lot</Button>
            </form>

            <form onSubmit={linkBatch} className="space-y-3 rounded-xl border bg-white p-5">
              <h2 className="font-display text-lg font-bold">Link a batch</h2>
              <p className="text-xs text-gray-500">Dispatch is blocked until each reserved batch has a lot and a passing check.</p>
              <div>
                <Label>Batch</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={batchLinkForm.batch_id}
                  onChange={(e) => setBatchLinkForm({ ...batchLinkForm, batch_id: e.target.value })}
                >
                  <option value="">Choose batch</option>
                  {batches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {nameFor(species, item.species_id)} | {when(item.received_date)} | {Number(item.weight_kg_available || 0)} kg
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lot</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={batchLinkForm.lot_id}
                  onChange={(e) => setBatchLinkForm({ ...batchLinkForm, lot_id: e.target.value })}
                >
                  <option value="">Choose lot</option>
                  {lots.map((item) => <option key={item.id} value={item.id}>{item.lot_code}</option>)}
                </select>
              </div>
              <div>
                <Label>Supplier</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={batchLinkForm.supplier_id}
                  onChange={(e) => setBatchLinkForm({ ...batchLinkForm, supplier_id: e.target.value })}
                >
                  <option value="">Keep current supplier</option>
                  {suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={saving}>Link batch</Button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Lot</th>
                  <th className="px-4 py-3 text-left">Fish</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Received</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-right">Kg</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.lot_code}</td>
                    <td className="px-4 py-3">{nameFor(species, item.species_id)}</td>
                    <td className="px-4 py-3">{nameFor(suppliers, item.supplier_id)}</td>
                    <td className="px-4 py-3">{when(item.received_date)}</td>
                    <td className="px-4 py-3">{when(item.expiry_date)}</td>
                    <td className="px-4 py-3 text-right">{Number(item.weight_kg_received || 0)}</td>
                  </tr>
                ))}
                {lots.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No lots yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "qa" && (
        <div className="space-y-6">
          <form onSubmit={saveQa} className="grid gap-3 rounded-xl border bg-white p-5 lg:grid-cols-[1fr_1fr_1fr_1fr_2fr_auto]">
            <div>
              <Label>Lot</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={qaForm.lot_id} onChange={(e) => setQaForm({ ...qaForm, lot_id: e.target.value })}>
                <option value="">Choose lot</option>
                {lots.map((item) => <option key={item.id} value={item.id}>{item.lot_code}</option>)}
              </select>
            </div>
            <div>
              <Label>Batch</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={qaForm.batch_id} onChange={(e) => setQaForm({ ...qaForm, batch_id: e.target.value })}>
                <option value="">Choose batch</option>
                {batches.map((item) => <option key={item.id} value={item.id}>{nameFor(species, item.species_id)} | {when(item.received_date)}</option>)}
              </select>
            </div>
            <div>
              <Label>Check</Label>
              <Input value={qaForm.check_type} onChange={(e) => setQaForm({ ...qaForm, check_type: e.target.value })} />
            </div>
            <div>
              <Label>Result</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={qaForm.result} onChange={(e) => setQaForm({ ...qaForm, result: e.target.value })}>
                <option value="passed">Passed</option>
                <option value="holding">Holding</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={qaForm.notes} onChange={(e) => setQaForm({ ...qaForm, notes: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving}>Save check</Button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Lot</th>
                  <th className="px-4 py-3 text-left">Check</th>
                  <th className="px-4 py-3 text-left">Result</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {qaChecks.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">{when(item.checked_at)}</td>
                    <td className="px-4 py-3">{lotCodeFor(item.lot_id)}</td>
                    <td className="px-4 py-3">{item.check_type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${item.result === "passed" ? "text-[#39B54A]" : "text-red-600"}`}>{item.result}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.notes || "-"}</td>
                  </tr>
                ))}
                {qaChecks.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No checks yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "recalls" && (
        <div className="space-y-6">
          <form onSubmit={saveRecall} className="grid gap-3 rounded-xl border bg-white p-5 lg:grid-cols-2">
            <div>
              <Label>Reference</Label>
              <Input value={recallForm.recall_ref} onChange={(e) => setRecallForm({ ...recallForm, recall_ref: e.target.value })} required />
            </div>
            <div>
              <Label>Lot</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={recallForm.lot_id} onChange={(e) => setRecallForm({ ...recallForm, lot_id: e.target.value })}>
                <option value="">No lot linked yet</option>
                {lots.map((item) => <option key={item.id} value={item.id}>{item.lot_code}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <Label>Reason</Label>
              <Textarea rows={2} value={recallForm.reason} onChange={(e) => setRecallForm({ ...recallForm, reason: e.target.value })} required />
            </div>
            <div>
              <Label>Affected weight in kg</Label>
              <Input type="number" step="0.001" min="0" value={recallForm.affected_weight_kg} onChange={(e) => setRecallForm({ ...recallForm, affected_weight_kg: e.target.value })} />
            </div>
            <div>
              <Label>Action taken</Label>
              <Input value={recallForm.action_taken} onChange={(e) => setRecallForm({ ...recallForm, action_taken: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <Button type="submit" disabled={saving}>Open recall</Button>
            </div>
          </form>

          <div className="space-y-3">
            {recalls.map((item) => {
              const linked = recallLots.filter((row) => row.recall_id === item.id);
              return (
                <div key={item.id} className="rounded-xl border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold">{item.recall_ref}</h2>
                      <p className="text-sm text-gray-600">{item.reason}</p>
                      <p className="mt-1 text-xs text-gray-500">Opened {when(item.started_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${item.status === "open" ? "text-red-600" : "text-[#39B54A]"}`}>{item.status}</span>
                      {item.status === "open" && (
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => void closeRecall(item.id)}>Close recall</Button>
                      )}
                    </div>
                  </div>
                  {linked.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {linked.map((row) => (
                        <span key={row.id} className="rounded-full bg-[#EAF6FB] px-3 py-1 font-bold text-[#073B78]">
                          {lotCodeFor(row.lot_id)} | {Number(row.affected_weight_kg || 0)} kg
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {recalls.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-gray-500">No recalls yet.</div>}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Area</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((item) => (
                <tr key={`${item.kind}-${item.id}`} className="border-t">
                  <td className="px-4 py-3">{when(item.at)}</td>
                  <td className="px-4 py-3 font-medium">{item.kind}</td>
                  <td className="px-4 py-3">{item.action}</td>
                  <td className="px-4 py-3 text-gray-500">{item.detail || "-"}</td>
                </tr>
              ))}
              {auditRows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No audit records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "team" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={saveTeam} className="space-y-3 rounded-xl border bg-white p-5">
            <h2 className="font-display text-lg font-bold">{editingStaffKey ? "Edit team access" : "Add team access"}</h2>
            <div>
              <Label>User ID</Label>
              <Input value={teamForm.user_id} onChange={(e) => setTeamForm({ ...teamForm, user_id: e.target.value })} placeholder="Paste the staff user ID" required />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={teamForm.role}
                onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
              >
                <option value="lf_fulfillment">Fulfillment</option>
                <option value="lf_manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            {teamForm.role !== "owner" && teamForm.role !== "admin" && (
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
                {TEAM_PERMISSIONS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(teamForm.permissions[key])}
                      onChange={(e) => setTeamForm({
                        ...teamForm,
                        permissions: { ...teamForm.permissions, [key]: e.target.checked },
                      })}
                    />
                    {key}
                  </label>
                ))}
              </div>
            )}
            {(teamForm.role === "owner" || teamForm.role === "admin") && (
              <p className="text-xs text-gray-500">This role has all access.</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>Save access</Button>
              {editingStaffKey && (
                <Button type="button" variant="outline" onClick={() => { setEditingStaffKey(null); setTeamForm(emptyTeamForm); }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {staffRows.map((row) => (
              <div key={row.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">User</p>
                    <p className="break-all text-sm font-medium">{row.user_id}</p>
                    <p className="mt-2 text-xs font-bold text-[#073B78]">{row.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editTeam(row)}>Edit</Button>
                    <Button size="sm" variant="destructive" disabled={saving} onClick={() => void removeTeam(row)}>Remove</Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                  {Object.entries(row.permissions || {})
                    .filter(([, value]) => value === true)
                    .map(([key]) => (
                      <span key={key} className="rounded-full bg-[#F4FBF7] px-2 py-1 font-bold text-[#073B78]">{key}</span>
                    ))}
                </div>
              </div>
            ))}
            {staffRows.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-gray-500">No team access yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLakeFreshOperations;
