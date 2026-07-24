import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Shield, Plus, Search, Download, QrCode, Eye, AlertTriangle,
  CheckCircle, XCircle, Loader2, RefreshCw, MapPin, FileImage,
  Smartphone, Globe, Package, Trash2, ChevronDown, ChevronUp,
  Check, ArrowDownToLine, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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

// ─── QR Label Download ──────────────────────────────────────────────

async function downloadQRLabel(record: ProductAuthRecord) {
  const canvas = document.createElement("canvas");
  const W = 600;
  const H = 800;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Top black bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, 100);

  // SB text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px 'Cormorant Garamond', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("STREETWEAR BLANTYRE", W / 2, 42);

  ctx.font = "600 13px 'DM Sans', Helvetica, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("A U T H E N T I C   P R O D U C T", W / 2, 72);

  // Shield icon area
  ctx.fillStyle = "#f0fdf4";
  ctx.beginPath();
  ctx.arc(W / 2, 160, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("\u2713", W / 2, 170);

  // "AUTHENTIC" label
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 14px 'DM Sans', Helvetica, sans-serif";
  ctx.fillText("VERIFIED AUTHENTIC", W / 2, 220);

  // Product name
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px 'Cormorant Garamond', Georgia, serif";
  const nameLines = wrapText(record.product_name, W - 80);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 270 + i * 30);
  });

  // Collection badge
  if (record.collection) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 12px 'DM Sans', Helvetica, sans-serif";
    ctx.fillText(record.collection.toUpperCase(), W / 2, 270 + nameLines.length * 30 + 15);
  }

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 330);
  ctx.lineTo(W - 60, 330);
  ctx.stroke();

  // Details section
  const detailsY = 370;
  ctx.textAlign = "left";
  ctx.fillStyle = "#6b7280";
  ctx.font = "11px 'DM Sans', Helvetica, sans-serif";

  const details: [string, string][] = [
    ["PRODUCT ID", record.product_id],
    ["SERIAL NUMBER", record.serial_number],
  ];
  if (record.edition_number) {
    details.push(["EDITION", `#${record.edition_number}${record.quantity_produced ? ` of ${record.quantity_produced}` : ""}`]);
  }
  if (record.color) details.push(["COLOR", record.color]);
  if (record.size) details.push(["SIZE", record.size]);
  if (record.material) details.push(["MATERIAL", record.material]);
  if (record.country_of_manufacture) details.push(["ORIGIN", record.country_of_manufacture]);

  details.forEach(([label, value], i) => {
    const y = detailsY + i * 28;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(label, 60, y);
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 12px 'DM Sans', Helvetica, sans-serif";
    ctx.fillText(value, 200, y);
    ctx.font = "11px 'DM Sans', Helvetica, sans-serif";
  });

  // QR code section
  const qrY = detailsY + details.length * 28 + 30;
  ctx.textAlign = "center";

  // QR background
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 130, qrY - 10, 260, 260, 16);
  ctx.fill();
  ctx.stroke();

  // Render QR code onto canvas
  const qrUrl = `https://wearsb.com/verify/${record.qr_token}`;
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "fixed";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  document.body.appendChild(tempDiv);

  // Use an offscreen QRCodeCanvas render
  const qrSvgNs = "http://www.w3.org/2000/svg";
  const qrSize = 220;
  const svgStr = await generateQRCodeSVGString(qrUrl, qrSize);
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, W / 2 - qrSize / 2, qrY, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.src = svgUrl;
  });

  document.body.removeChild(tempDiv);

  // Scan instruction
  ctx.textAlign = "center";
  ctx.fillStyle = "#6b7280";
  ctx.font = "600 11px 'DM Sans', Helvetica, sans-serif";
  ctx.fillText("SCAN TO VERIFY AUTHENTICITY", W / 2, qrY + qrSize + 25);

  // Verification URL
  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px monospace";
  ctx.fillText(qrUrl, W / 2, qrY + qrSize + 45);

  // Bottom bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 11px 'DM Sans', Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("www.wearsb.com  \u2022  Streetwear Blantyre  \u2022  Authentic Streetwear", W / 2, H - 20);

  // Download
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `SB-QR-${record.product_name.replace(/\s+/g, "-")}-${record.serial_number}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      resolve();
    }, "image/png");
  });
}

function generateQRCodeSVGString(value: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    document.body.appendChild(container);

    // Use a simple QR code generation approach
    // We'll create the SVG string directly using a QR matrix
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    // For reliable QR generation, use an image tag pointing to QR API
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("width", String(size));
    img.setAttribute("height", String(size));
    img.setAttribute("href", `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg`);
    svg.appendChild(img);

    // Fallback: render via canvas approach
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><image width="${size}" height="${size}" href="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg"/></svg>`;

    document.body.removeChild(container);
    resolve(svgStr);
  });
}

function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= 30) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).length > 30) {
      lines.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 2);
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
    const [authRes, prodRes] = await Promise.all([
      supabase.from("product_auth").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, category, image, brand").order("name"),
    ]);
    setRecords((authRes.data || []) as unknown as ProductAuthRecord[]);
    setProducts(prodRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // SB Original products only
  const sbOriginalProducts = products.filter((p) => p.brand === "sb-original");

  // Products that don't have auth records yet (for bulk generation)
  const authenticatedProductIds = new Set(records.map((r) => r.product_id));
  const unauthenticatedSbOriginal = sbOriginalProducts.filter(
    (p) => !authenticatedProductIds.has(p.id)
  );

  // Stats
  const totalScans = records.reduce((sum, r) => sum + (r.total_scans || 0), 0);
  const activeCount = records.filter((r) => r.authentication_status === "active").length;
  const sbOriginalCount = records.filter((r) => {
    const product = products.find((p) => p.id === r.product_id);
    return product?.brand === "sb-original";
  }).length;

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
      toast({ title: "Error", description: "Please select an SB Original product" });
      return;
    }
    setSaving(true);
    const selectedProduct = sbOriginalProducts.find((p) => p.id === form.product_id);
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

  // ─── Bulk Generate ───────────────────────────────────────────────

  const toggleBulkSelect = (productId: string) => {
    setSelectedBulk((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleAllBulk = () => {
    if (selectedBulk.size === unauthenticatedSbOriginal.length) {
      setSelectedBulk(new Set());
    } else {
      setSelectedBulk(new Set(unauthenticatedSbOriginal.map((p) => p.id)));
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedBulk.size === 0) {
      toast({ title: "Error", description: "Select at least one product" });
      return;
    }
    setBulkGenerating(true);
    let created = 0;
    let failed = 0;

    for (const productId of selectedBulk) {
      const product = sbOriginalProducts.find((p) => p.id === productId);
      if (!product) { failed++; continue; }

      const serialNumber = generateSerialNumber();
      const qrToken = generateQrToken();

      const { error } = await supabase.from("product_auth").insert({
        product_id: productId,
        serial_number: serialNumber,
        qr_token: qrToken,
        product_name: product.name,
        product_image: product.image || null,
        collection: product.category || null,
        category: product.category || null,
        country_of_manufacture: "Malawi",
      });

      if (error) failed++;
      else created++;
    }

    toast({
      title: "Bulk generation complete",
      description: `${created} authenticated, ${failed} failed`,
    });
    setSelectedBulk(new Set());
    setBulkGenerating(false);
    fetchData();
  };

  // ─── Single QR Download ──────────────────────────────────────────

  const handleDownloadQR = async (record: ProductAuthRecord) => {
    setDownloadingId(record.id);
    try {
      await downloadQRLabel(record);
      toast({ title: "Downloaded", description: `QR label for ${record.product_name}` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
    setDownloadingId(null);
  };

  // ─── Download All QR Labels ──────────────────────────────────────

  const handleDownloadAll = async () => {
    const activeRecords = records.filter((r) => r.authentication_status === "active");
    if (activeRecords.length === 0) {
      toast({ title: "No active records", description: "No authenticated products to download" });
      return;
    }
    setDownloadingAll(true);
    let downloaded = 0;
    for (const record of activeRecords) {
      try {
        await downloadQRLabel(record);
        downloaded++;
        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        // Skip failed
      }
    }
    toast({ title: "Downloads complete", description: `${downloaded} QR labels downloaded` });
    setDownloadingAll(false);
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

  // ─── Delete Record ───────────────────────────────────────────────

  const handleDeleteRecord = async (record: ProductAuthRecord) => {
    if (!confirm(`Delete authentication for ${record.product_name}? This cannot be undone.`)) return;
    await supabase.from("product_auth").delete().eq("id", record.id);
    toast({ title: "Record deleted" });
    fetchData();
  };

  // ─── Export CSV ──────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ["Product Name", "Serial Number", "QR Token", "Product ID", "Collection", "Status", "Edition", "Color", "Size", "Total Scans", "Created"];
    const rows = records.map((r) => [
      r.product_name, r.serial_number, r.qr_token, r.product_id, r.collection || "",
      r.authentication_status, r.edition_number?.toString() || "",
      r.color || "", r.size || "", r.total_scans.toString(), r.created_at,
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
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl">Authentication</h1>
          <p className="text-muted-foreground">
            Manage SB Original product authentication, QR codes, and scan history.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadAll} disabled={downloadingAll}>
            {downloadingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowDownToLine className="h-4 w-4 mr-1" />}
            Download All QR Labels
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} disabled={unauthenticatedSbOriginal.length === 0}>
            <Layers className="h-4 w-4 mr-1" /> Bulk Generate QR
            {unauthenticatedSbOriginal.length > 0 && (
              <span className="ml-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unauthenticatedSbOriginal.length}
              </span>
            )}
          </Button>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-800" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Authenticate Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield} label="Total Authenticated" value={records.length.toString()} color="text-gray-900" bg="bg-gray-100" />
        <StatCard icon={Package} label="SB Original Only" value={sbOriginalCount.toString()} color="text-blue-600" bg="bg-blue-600/10" />
        <StatCard icon={Eye} label="Total Scans" value={totalScans.toString()} color="text-gray-900" bg="bg-gray-100" />
        <StatCard icon={CheckCircle} label="Active" value={activeCount.toString()} color="text-green-600" bg="bg-green-600/10" />
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
                    <td className="px-4 py-3">{record.collection || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.authentication_status} />
                    </td>
                    <td className="px-4 py-3">
                      {record.edition_number ? `#${record.edition_number}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3">{record.total_scans}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View QR Code"
                          onClick={() => { setQrRecord(record); setQrOpen(true); }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Download QR Label"
                          disabled={downloadingId === record.id}
                          onClick={() => handleDownloadQR(record)}
                        >
                          {downloadingId === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileImage className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Scan History"
                          onClick={() => loadScanHistory(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Delete"
                          onClick={() => handleDeleteRecord(record)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* ─── Create Dialog (SB Original only) ─────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Authenticate SB Original Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">
                Only SB Original products appear here. SB Street products are not eligible for authentication tags.
              </p>
            </div>
            <div>
              <Label>Product *</Label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Select an SB Original product...</option>
                {sbOriginalProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                    {authenticatedProductIds.has(p.id) ? " \u2014 Already Authenticated" : ""}
                  </option>
                ))}
              </select>
              {sbOriginalProducts.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No SB Original products found. Create products with brand "SB Original" first.</p>
              )}
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
            <Button className="w-full bg-gray-900 hover:bg-gray-800" onClick={handleCreate} disabled={saving || !form.product_id}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Authenticate Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Generate Dialog ─────────────────────────────────── */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Bulk Generate QR Codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700">
                Generate authentication records and QR codes for multiple SB Original products at once.
                Each product receives a unique serial number and verification URL.
              </p>
            </div>

            {unauthenticatedSbOriginal.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium text-green-700">All SB Original products are authenticated</p>
                <p className="text-sm mt-1">No pending products to generate QR codes for.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedBulk.size} of {unauthenticatedSbOriginal.length} selected
                  </p>
                  <Button variant="outline" size="sm" onClick={toggleAllBulk}>
                    {selectedBulk.size === unauthenticatedSbOriginal.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                  {unauthenticatedSbOriginal.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleBulkSelect(product.id)}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors ${
                        selectedBulk.has(product.id) ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        selectedBulk.has(product.id) ? "bg-gray-900 border-gray-900" : "border-gray-300"
                      }`}>
                        {selectedBulk.has(product.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {product.image && (
                        <img src={product.image} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={handleBulkGenerate}
                  disabled={bulkGenerating || selectedBulk.size === 0}
                >
                  {bulkGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Layers className="h-4 w-4 mr-2" />
                  )}
                  {bulkGenerating
                    ? `Generating ${selectedBulk.size} QR codes...`
                    : `Generate ${selectedBulk.size} QR Code${selectedBulk.size !== 1 ? "s" : ""}`
                  }
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── QR Code Preview Dialog ───────────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">QR Code</DialogTitle>
          </DialogHeader>
          {qrRecord && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-2xl inline-block border border-gray-100">
                <QRCodeSVG
                  value={`https://wearsb.com/verify/${qrRecord.qr_token}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div>
                <p className="font-medium text-sm">{qrRecord.product_name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{qrRecord.serial_number}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground break-all">
                  {`https://wearsb.com/verify/${qrRecord.qr_token}`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://wearsb.com/verify/${qrRecord.qr_token}`);
                    toast({ title: "Copied", description: "Verification URL copied to clipboard" });
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={() => handleDownloadQR(qrRecord)}
                  disabled={downloadingId === qrRecord.id}
                >
                  {downloadingId === qrRecord.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Download Label
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Label includes SB branding, product details, and QR code for printing on clothing tags.
              </p>
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
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {scanHistoryRecord.product_image ? (
                    <img src={scanHistoryRecord.product_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
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
