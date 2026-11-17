import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { LeafletMap } from "@/components/lf/LeafletMap";
import { Truck, CheckCircle2, Phone, MapPin } from "lucide-react";

const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";

export default function LakeFreshDriver() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("brand_id", LF_BRAND_ID)
      .eq("delivery_date", date)
      .in("status", ["dispatched", "confirmed", "processing"])
      .order("created_at", { ascending: true });
    const ords = data || [];
    const ids = ords.map((o: any) => o.id);
    let itemsByOrder: Record<string, any[]> = {};
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

  const markDelivered = async (id: string) => {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", id);
    void load();
  };

  const withCoords = orders.filter((o) => o.delivery_lat != null && o.delivery_lng != null);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-[#073B78]">Driver — Delivery Stops</h1>
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

        {loading && <p className="text-sm text-gray-500">Loading stops...</p>}

        <div className="space-y-3">
          {orders.map((o, i) => (
            <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#073B78]">
                    {i + 1}. {o.customer_name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                    <Phone className="h-3 w-3" /> {o.customer_phone}
                  </p>
                  {(o.house_number || o.street_name) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {o.house_number ? `${o.house_number}, ` : ""}{o.street_name || ""} {o.customer_location ? `· ${o.customer_location}` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {(o.items || []).map((it: any) => `${it.product_name} x ${it.quantity}`).join(", ")}
                  </p>
                  {o.delivery_window && (
                    <p className="mt-1 text-xs text-gray-500">Window: {o.delivery_window}</p>
                  )}
                </div>
                <button
                  onClick={() => void markDelivered(o.id)}
                  className="shrink-0 rounded-lg bg-[#39B54A] px-3 py-2 text-xs font-bold text-white"
                >
                  <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" /> Delivered
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && !loading && (
            <p className="text-center text-sm text-gray-500">No stops for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}