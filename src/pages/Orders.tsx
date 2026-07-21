import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMWK } from "@/data/products";
import { SEO, defaultSEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { Package } from "lucide-react";
import { format } from "date-fns";

interface OrderRow {
  id: string;
  status: string;
  total_mwk: number;
  created_at: string;
  customer_location: string | null;
}

const statusColor: Record<string, string> = {
  new: "bg-accent/20 text-accent",
  confirmed: "bg-primary/20 text-primary",
  dispatched: "bg-brand-purple/20 text-brand-purple",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, status, total_mwk, created_at, customer_location")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    if (!user) {
      window.location.href = "/auth?redirect=/orders";
      return null;
    }
  }

  return (
    <div className="container py-12 sm:py-16 max-w-3xl">
      <SEO {...defaultSEO.orders} />
      <div className="space-y-3 mb-10">
        <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Your orders</p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">Track your <span className="text-gradient">delivery.</span></h1>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-4 rounded-3xl bg-gray-50 border border-gray-100">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-500">No orders yet.</p>
          <Button asChild variant="hero"><Link to="/shop">Start shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="block rounded-2xl bg-card border border-border/60 p-5 hover:border-primary/50 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "PPP")} • {o.customer_location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor[o.status] ?? ""}`}>{o.status}</span>
                  <span className="font-display font-bold text-gradient">{formatMWK(o.total_mwk)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
