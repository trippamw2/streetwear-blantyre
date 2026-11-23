import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SB_BRAND_ID } from "@/data/sbArchitecture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Metrics {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  campaigns: number;
}

const SbAnalytics = () => {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "revenue";
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
    campaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("orders").select("total_mwk, payment_status").eq("brand_id", SB_BRAND_ID),
      supabase.from("products").select("id").eq("brand_id", SB_BRAND_ID),
      supabase.from("customer_profiles").select("id").eq("brand_id", SB_BRAND_ID),
      supabase.from("sb_campaigns").select("id").eq("brand_id", SB_BRAND_ID),
    ])
      .then(([ordersRes, productsRes, customersRes, campaignsRes]) => {
        if (cancelled) return;
        const orders = ordersRes.data || [];
        const paid = orders.filter((order) =>
          ["paid", "completed", "delivered"].includes(order.payment_status || ""),
        );
        setMetrics({
          revenue: paid.reduce((sum, order) => sum + Number(order.total_mwk || 0), 0),
          orders: orders.length,
          products: productsRes.data?.length || 0,
          customers: customersRes.data?.length || 0,
          campaigns: campaignsRes.data?.length || 0,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Revenue", value: `MK ${metrics.revenue.toLocaleString("en-US")}`, active: view === "revenue" },
    { label: "Products", value: String(metrics.products), active: view === "products" },
    { label: "Customers", value: String(metrics.customers), active: view === "customers" },
    { label: "Campaigns", value: String(metrics.campaigns), active: view === "campaigns" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Brand performance across the wardrobe.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className={card.active ? "border-navy" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-bold text-gray-900">
                {loading ? "—" : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orders tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{loading ? "—" : metrics.orders}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SbAnalytics;
