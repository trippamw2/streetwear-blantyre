import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Shield, Plus, Search, Download, QrCode, Eye, AlertTriangle,
  CheckCircle, XCircle, Loader2, RefreshCw, Clock, MapPin,
  Smartphone, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ProductAuthRecord } from "@/hooks/useProductAuth";

// ─── Helpers ────────────────────────────────────────────────────────

function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `SB-${year}-${rand}`;
}

function generateQrToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatMWK(n: number): string {
  return new Intl.NumberFormat("en-MW", { style: "currency", currency: "MWK", maximumFractionDigits: 0 }).format(n);
}

// ─── Main Component ─────────────────────────────────────────────────

const AdminAuthentication = () => {
  const [records, setRecords] = useState<ProductAuthRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrRecord, setQrRecord] = useState<ProductAuthRecord | null>(null);
  const [scanHistoryOpen, setScanHistoryOpen] = useState(false);
  const [scanHistoryRecord, setScanHistoryRecord] = useState<ProductAuthRecord | null>(null);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    product_id: "",
    color: "",
    size: "",
    material: "",
    print_technique: "",
    fabric_weight: "",
    edition_number: "",
    quantity_produced: "",
    country_of_manufacture: "Malawi",
    manufacturing_date: "",
    product_story: "",
    care_instructions: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [authRes, prodRes, scansRes] = await Promise.all([
      supabase.from("product_auth").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, category, image"),
      supabase.from("scan_logs").select("id, is_suspicious"),
    ]);
    setRecords((authRes.data || []) as unknown as ProductAuthRecord[]);
    setProducts(prodRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stats
  const totalScans = records.reduce((sum, r) => sum + (r.total_scans || 0), 0);
  const activeCount = records.filter((r) => r.authentication_status === "active").length;

  // Filtered records
  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.product_name.toLowerCase().includes(q) ||
      r.serial_number.toLowerCase().includes(q) ||
      r.qr_token.toLowerCase().includes(q)
    );
  });

  // ─── Create Auth Record ──────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.product_id) {
      toast({ title: "Error", description: "Please select a product" });
      return;
    }
    setSaving(true);
    const selectedProduct = products.find((p) => p.id === form.product_id);
    const serialNumber = generateSerialNumber();
    const qrToken = generateQrToken();

    const { error } = await supabase.from("product_auth").insert({
      product_id: form.product_id,
      serial_number: serialNumber,
      qr_token: qrToken,
      product_name: selectedProduct?.name || "Unknown Product",
      product_image: selectedProduct?.image || null,
      collection: selectedProduct?.category || null,
      category: selectedProduct?.category || null,
      color: form.color || null,
      size: form.size || null,
      material: form.material || null,
      print_technique: form.print_technique || null,
      fabric_weight: form.fabric_weight || null,
      edition_number: form.edition_number ? parseInt(form.edition_number) : null,
      quantity_produced: form.quantity_produced ? parseInt(form.quantity_produced) : null,
      country_of_manufacture: form.country_of_manufacture || "Malawi",
      manufacturing_date: form.manufacturing_date || null,
      product_story: form.product_story || null,
      care_instructions: form.care_instructions || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: `Product authenticated: ${serialNumber}` });
      setCreateOpen(false);
      setForm({
        product_id: "", color: "", size: "", material: "", print_technique: "",
        fabric_weight: "", edition_number: "", quantity_produced: "",
        country_of_manufacture: "Malawi", manufacturing_date: "",
        product_story: "", care_instructions: "",
      });
      fetchData();
    }
    setSaving(false);
  };

  // ─── Scan History ────────────────────────────────────────────────

  const loadScanHistory = async (record: ProductAuthRecord) => {
    setScanHistoryRecord(record);
    setScanHistoryOpen(true);
    setScanLoading(true);
    const { data } = await supabase
      .from("scan_logs")
      .select("*")
      .eq("product_auth_id", record.id)
      .order("scanned_at", { ascending: false });
    setScanLogs(data || []);
    setScanLoading(false);
  };

  // ─── Export CSV ──────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ["Product Name", "Serial Number", "QR Token", "Collection", "Status", "Edition", "Total Scans", "Created"];
    const rows = records.map((r) => [
      r.product_name, r.serial_number, r.qr_token, r.collection || "",
      r.authentication_status, r.edition_number?.toString() || "",
      r.total_scans.toString(), r.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sb-authentication-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl">Authentication</h1>
          <p className="text-muted-foreground">Manage product authentication, QR codes, and scan history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-800" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Authenticate Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield} label="Total Authenticated" value={records.length.toString()} color="text-gray-900" bg="bg-gray-100" />
        <StatCard icon={Eye} label="Total Scans" value={totalScans.toString()} color="text-gray-900" bg="bg-gray-100" />
        <StatCard icon={AlertTriangle} label="Suspicious Flags" value="0" color="text-yellow-500" bg="bg-yellow-500/10" />
        <StatCard icon={CheckCircle} label="Active Products" value={activeCount.toString()} color="text-green-600" bg="bg-green-600/10" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, serial number, or token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No authenticated products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serial Number</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Collection</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Edition</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scans</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {record.product_image ? (
                            <img src={record.product_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{record.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{record.serial_number}</td>
                    <td className="px-4 py-3">{record.collection || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.authentication_status} />
                    </td>
                    <td className="px-4 py-3">
                      {record.edition_number ? `#${record.edition_number}` : "—"}
                    </td>
                    <td className="px-4 py-3">{record.total_scans}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => { setQrRecord(record); setQrOpen(true); }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => loadScanHistory(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create Dialog ────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Authenticate Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product *</Label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="e.g. Black" className="mt-1" /></div>
              <div><Label>Size</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. L" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. 100% Cotton" className="mt-1" /></div>
              <div><Label>Print Technique</Label><Input value={form.print_technique} onChange={(e) => setForm({ ...form, print_technique: e.target.value })} placeholder="e.g. Screen Print" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fabric Weight</Label><Input value={form.fabric_weight} onChange={(e) => setForm({ ...form, fabric_weight: e.target.value })} placeholder="e.g. 200 GSM" className="mt-1" /></div>
              <div><Label>Country of Manufacture</Label><Input value={form.country_of_manufacture} onChange={(e) => setForm({ ...form, country_of_manufacture: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Edition Number</Label><Input type="number" value={form.edition_number} onChange={(e) => setForm({ ...form, edition_number: e.target.value })} placeholder="1" className="mt-1" /></div>
              <div><Label>Quantity Produced</Label><Input type="number" value={form.quantity_produced} onChange={(e) => setForm({ ...form, quantity_produced: e.target.value })} placeholder="100" className="mt-1" /></div>
            </div>
            <div><Label>Manufacturing Date</Label><Input type="date" value={form.manufacturing_date} onChange={(e) => setForm({ ...form, manufacturing_date: e.target.value })} className="mt-1" /></div>
            <div><Label>Product Story</Label><Textarea value={form.product_story} onChange={(e) => setForm({ ...form, product_story: e.target.value })} placeholder="Tell the story of this product..." rows={3} className="mt-1" /></div>
            <div><Label>Care Instructions</Label><Textarea value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} placeholder="Machine wash cold. Do not bleach..." rows={2} className="mt-1" /></div>
            <Button className="w-full bg-gray-900 hover:bg-gray-800" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Authenticate Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── QR Code Dialog ───────────────────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">QR Code</DialogTitle>
          </DialogHeader>
          {qrRecord && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-2xl inline-block">
                <QRCodeSVG
                  value={`https://wearsb.com/verify/${qrRecord.qr_token}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div>
                <p className="font-medium text-sm">{qrRecord.product_name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{qrRecord.serial_number}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground break-all">{`https://wearsb.com/verify/${qrRecord.qr_token}`}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`https://wearsb.com/verify/${qrRecord.qr_token}`);
                  toast({ title: "Copied", description: "Verification URL copied to clipboard" });
                }}
              >
                Copy Verification URL
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Scan History Dialog ──────────────────────────────────── */}
      <Dialog open={scanHistoryOpen} onOpenChange={setScanHistoryOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Scan History</DialogTitle>
          </DialogHeader>
          {scanHistoryRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{scanHistoryRecord.product_name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{scanHistoryRecord.serial_number}</p>
                </div>
              </div>
              {scanLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scanLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No scans recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {scanLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-sm ${
                        log.is_suspicious ? "border-red-200 bg-red-50" : "border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${log.is_suspicious ? "text-red-600" : ""}`}>
                          {log.scan_result === "authentic" ? (
                            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Authentic</span>
                          ) : (
                            <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-600" /> {log.scan_result}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.scanned_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.device_type && (
                          <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {log.device_type}</span>
                        )}
                        {log.browser && (
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {log.browser}</span>
                        )}
                        {log.approximate_location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {log.approximate_location}</span>
                        )}
                      </div>
                      {log.is_suspicious && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          {log.suspicious_reason || "Suspicious activity detected"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string; color: string; bg: string;
}) => (
  <div className="bg-card border border-border/60 rounded-2xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display font-bold text-2xl mt-1">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    retired: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

export default AdminAuthentication;
