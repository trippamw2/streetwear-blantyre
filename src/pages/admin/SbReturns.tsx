import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SB_BRAND_ID } from "@/data/sbArchitecture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ReturnOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  total_mwk: number;
  created_at: string;
}

const SbReturns = () => {
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, status, payment_status, total_mwk, created_at")
      .eq("brand_id", SB_BRAND_ID)
      .or("payment_status.eq.refunded,payment_status.eq.cancelled,status.eq.returned")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load returns", description: error.message, variant: "destructive" });
    } else {
      setOrders((data || []) as ReturnOrder[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Returns & Refunds</h1>
        <p className="mt-1 text-sm text-gray-500">Orders with a returned, refunded or cancelled payment state.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Return queue</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void load()}>Refresh</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">No returns or refunds recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="py-3">Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                      <td>{order.customer_name}<span className="block text-xs text-gray-400">{order.customer_phone}</span></td>
                      <td>{order.status}</td>
                      <td>{order.payment_status}</td>
                      <td>MK {order.total_mwk.toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SbReturns;
