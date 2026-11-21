import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LeafletMap } from "@/components/lf/LeafletMap";
import { CheckCircle2, Phone, MapPin, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BRANDS } from "@/lib/brands";
import { buildLfProofPath, LF_PROOF_BUCKET } from "@/lib/lfStorage";

const LF_BRAND_ID = BRANDS["lake-fresh"].id;

export default function LakeFreshDriver() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState<any[]>([]);
  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .eq("delivery_date", date)
      .eq("status", "dispatched")
      .order("created_at", { ascending: true });
    const ords = data || [];
    const ids = ords.map((o: any) => o.id);
    const itemsByOrder: Record<string, any[]> = {};
    if (ids.length) {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, product_name, quantity")
        .in("order_id", ids);
      for (const it of items || []) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      }
    }
    setOrders(ords.map((o: any) => ({ ...o, items: itemsByOrder[o.id] || [] })));
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
  }, [user, date]);

  // Status changes go through the server RPC. A proof image is mandatory.
  const markDelivered = async (id: string) => {
    const proofUrl = proofs[id];
    if (!proofUrl) {
      toast({ title: "Proof required", description: "Add a delivery photo first.", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.rpc("lf_mark_delivery_result", {
      p_order_id: id,
      p_proof_url: proofUrl,
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as { ok?: boolean; reason?: string } | null;
    if (!result?.ok) {
      toast({
        title: "Update failed",
        description:
          result?.reason === "no_access"
            ? "You do not have delivery access."
            : result?.reason === "confirmation_required"
              ? "Wait for the customer to agree to the final total."
              : "This order could not be completed.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Delivery recorded", description: "Proof and time saved." });
    void load();
  };

  const uploadProof = async (id: string, file: File) => {
    const path = buildLfProofPath(id, file.name);
    if (!path) {
      toast({ title: "Photo not accepted", description: "Use a JPG, PNG or WebP photo.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.storage.from(LF_PROOF_BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    setProofs((current) => ({ ...current, [id]: path }));
    toast({ title: "Proof added", description: "Now mark this stop as delivered." });
  };

  const withCoords = orders.filter((o) => o.delivery_lat != null && o.delivery_lng != null);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-[#073B78]">Today&apos;s delivery stops</h1>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {withCoords.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <LeafletMap
              center={[withCoords[0].delivery_lat, withCoords[0].delivery_lng]}
              zoom={13}
              markers={withCoords.map((o, i) => ({
                lat: o.delivery_lat,
                lng: o.delivery_lng,
                label: `${i + 1}. ${o.customer_name}`,
              }))}
              height={260}
            />
          </div>
        )}

        {loading && <p className="text-sm text-[#073B78]/60">Loading stops...</p>}

        <div className="space-y-3">
          {orders.map((o, i) => (
            <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#073B78]">
                    {i + 1}. {o.customer_name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#073B78]/70">
                    <Phone className="h-3 w-3" /> {o.customer_phone}
                  </p>
                  {(o.house_number || o.street_name) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#073B78]/70">
                      <MapPin className="h-3 w-3" />
                      {o.house_number ? `${o.house_number}, ` : ""}{o.street_name || ""} {o.customer_location ? `. ${o.customer_location}` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#073B78]/60">
                    {(o.items || []).map((it: any) => `${it.quantity} ${it.product_name}`).join(", ")}
                  </p>
                  {o.delivery_window && (
                    <p className="mt-1 text-xs text-[#073B78]/60">Time: {o.delivery_window}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <label className="cursor-pointer rounded-lg bg-[#073B78] px-3 py-2 text-xs font-bold text-white">
                    <Camera className="inline h-3.5 w-3.5 mr-1" /> Add proof
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadProof(o.id, f);
                      }}
                    />
                  </label>
                  {proofs[o.id] && (
                    <span className="text-[10px] font-bold text-[#39B54A]">Proof added</span>
                  )}
                  <button
                    onClick={() => void markDelivered(o.id)}
                    disabled={!proofs[o.id]}
                    title={proofs[o.id] ? "Record this delivery" : "Add a delivery photo first"}
                    className="rounded-lg bg-[#39B54A] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" /> Mark delivered
                  </button>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && !loading && (
            <p className="text-center text-sm text-[#073B78]/60">No stops for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}