import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { ArrowLeft, Check, Truck, Package, MessageCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface OrderDetail {
  id: string;
  status: string;
  total_mwk: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string | null;
  notes: string | null;
  created_at: string;
}

interface ItemRow {
  id: string;
  product_name: string;
  unit_price_mwk: number;
  quantity: number;
}

const steps = [
  { key: "new", label: "Order placed", icon: Check },
  { key: "confirmed", label: "Confirmed", icon: Sparkles },
  { key: "dispatched", label: "On the way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

const stepIndex = (status: string) => steps.findIndex((s) => s.key === status);

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("id, product_name, unit_price_mwk, quantity").eq("order_id", id),
    ]).then(([o, i]) => {
      setOrder(o.data as any);
      setItems(i.data ?? []);
      setLoading(false);
    });
  }, [id, user]);

  if (authLoading || loading) return <PageSkeleton />;
  if (!user) {
    window.location.href = `/auth?redirect=/orders/${id}`;
    return null;
  }
  if (!order) return <div className="container py-20 text-center text-muted-foreground">Order not found.</div>;

  const idx = order.status === "cancelled" ? -1 : stepIndex(order.status);

  return (
    <div className="container py-12 max-w-3xl">
      <SEO title={"Order " + (order?.id?.slice(0,8).toUpperCase() || "")} description="Track your Streetwear Blantyre order" />
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order ref</p>
            <h1 className="font-display font-bold text-2xl">#{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(order.created_at), "PPPp")}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-gradient-brand text-white text-xs font-bold uppercase">{order.status}</span>
        </div>

        {/* Tracker */}
        {order.status !== "cancelled" && (
          <div>
            <div className="grid grid-cols-4 gap-2">
              {steps.map((s, i) => {
                const reached = i <= idx;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center gap-2">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${reached ? "bg-gradient-brand border-transparent text-white" : "border-border text-muted-foreground"}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <p className={`text-xs ${reached ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand transition-all" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold">Items</h2>
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
              <p className="text-sm">{i.quantity} Ã— {i.product_name}</p>
              <p className="text-sm font-semibold">{formatMWK(i.unit_price_mwk * i.quantity)}</p>
            </div>
          ))}
          <div className="flex justify-between pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display font-bold text-xl text-gradient">{formatMWK(order.total_mwk)}</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-2xl bg-background/50 border border-border/40 p-4 space-y-1 text-sm">
          <p><span className="text-muted-foreground">To:</span> {order.customer_name}</p>
          <p><span className="text-muted-foreground">Phone:</span> {order.customer_phone}</p>
          <p><span className="text-muted-foreground">Location:</span> {order.customer_location}</p>
          {order.notes && <p><span className="text-muted-foreground">Notes:</span> {order.notes}</p>}
        </div>

        {/* Payment Instructions */}
        {order.status === "new" && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-3">
            <p className="font-display font-bold text-lg">
              Make Payment
            </p>
            <p className="text-sm text-muted-foreground">
              Pay <span className="font-bold text-gray-900">{formatMWK(order.total_mwk)}</span> via PayChangu:
            </p>
            <div className="text-sm space-y-2 bg-white p-3 rounded-lg">
              <p><span className="text-muted-foreground">Airtel Money:</span> <span className="font-mono font-bold">{import.meta.env.VITE_PAYMENT_PHONE || "+265 991 234 567"}</span></p>
              <p><span className="text-muted-foreground">TNM Mpamba:</span> <span className="font-mono font-bold">{import.meta.env.VITE_PAYMENT_PHONE || "+265 991 234 567"}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">
              Use order ref <span className="font-bold">{order.id.slice(0, 8).toUpperCase()}</span> as payment reference.
            </p>
            <p className="text-xs text-muted-foreground">
              We'll confirm via WhatsApp once payment is received.
            </p>
          </div>
        )}

        {order.status === "delivered" && (
          <div className="rounded-2xl bg-gradient-brand-soft border border-primary/30 p-5 space-y-3">
            <p className="font-display font-bold text-lg">Stay Fresh</p>
            <p className="text-sm text-muted-foreground">Thanks for choosing Streetwear Blantyre. Loved it? Send us a quick photo or feedback on WhatsApp. Repeat customers get exclusive discounts.</p>
            <Button asChild variant="whatsapp" size="sm">
              <a href={buildWhatsAppLink(`Hi Streetwear Blantyre, I just received order #${order.id.slice(0,8).toUpperCase()}. Here's my feedback:`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Share feedback
              </a>
            </Button>
          </div>
        )}

        {/* Post-purchase upsell */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="font-semibold text-sm">Complete your look.</p>
          <p className="text-xs text-gray-500">
            Another tee, different cap, or a fresh bundle. Every order benefits from our 30 day guarantee.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/combos">View Kits</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/shop">Shop Items</Link>
            </Button>
          </div>
        </div>

        <Button asChild variant="outlineGlow" className="w-full">
              <a href={buildWhatsAppLink(`Hi Streetwear Blantyre, I'm checking on order #${order.id.slice(0,8).toUpperCase()}.`)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Chat about this order
          </a>
        </Button>
      </div>
    </div>
  );
};

export default OrderDetailPage;
