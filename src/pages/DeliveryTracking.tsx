import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { ArrowLeft, Package, Truck, Check, MapPin, Phone, MessageCircle, Clock, Home, Star } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  status: string;
  total_mwk: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  notes: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  product_name: string;
  unit_price_mwk: number;
  quantity: number;
}

interface DeliveryStatus {
  status: string;
  updated_at: string;
  tracking_number: string;
  company_name: string;
  estimated_delivery: string;
}

const TRACKING_STEPS = [
  { key: "new", label: "Order Placed", icon: Check, desc: "We've received your order" },
  { key: "confirmed", label: "Confirmed", icon: Star, desc: "Order confirmed - payment received" },
  { key: "processing", label: "Processing", icon: Package, desc: "Preparing your items" },
  { key: "dispatched", label: "Dispatched", icon: Truck, desc: "On the way to you" },
  { key: "delivered", label: "Delivered", icon: Home, desc: "Delivered to you" },
];

const getStepIndex = (status: string) => {
  if (status === "cancelled") return -1;
  if (status === "new") return 0;
  if (status === "confirmed") return 1;
  if (status === "processing") return 2;
  if (status === "dispatched") return 3;
  if (status === "delivered") return 4;
  return 0;
};

const DeliveryTracking = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);
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
  if (!order) return <div className="container py-20 text-center">Order not found.</div>;

  const idx = getStepIndex(order.status);
  const statusColor: Record<string, string> = {
    new: "bg-accent",
    confirmed: "bg-primary",
    processing: "bg-gray-800",
    dispatched: "bg-gray-600",
    delivered: "bg-green-500",
    cancelled: "bg-destructive",
  };

  return (
    <div className="container py-12 max-w-3xl">
      <SEO title="Track Delivery" description="Track your Streetwear Blantyre delivery status" />
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
            <h1 className="font-display font-bold text-3xl">#{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {format(new Date(order.created_at), "PPPp")}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full font-bold uppercase ${statusColor[order.status]} text-white`}>
            {order.status}
          </span>
        </div>

        {/* Delivery Tracking */}
        {order.status !== "cancelled" && order.status !== "delivered" && (
          <div className="rounded-2xl bg-secondary/30 p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> Track Delivery
            </h2>
            
            <div className="flex items-start justify-between gap-1 overflow-x-auto">
              {TRACKING_STEPS.map((step, i) => {
                const reached = i <= idx;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center min-w-0 flex-1">
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${
                      reached 
                        ? "bg-gradient-brand border-transparent text-white" 
                        : "border-border text-muted-foreground bg-background"
                    }`}>
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-2 font-medium leading-tight ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground hidden lg:block mt-0.5">{step.desc}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-brand transition-all" 
                style={{ width: `${((idx + 1) / TRACKING_STEPS.length) * 100}%` }} 
              />
            </div>

            {order.status === "dispatched" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>Your order is on the way! Track with the courier using your order number.</span>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg">Items Ordered</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-border/30">
                <span>{item.quantity} × {item.product_name}</span>
                <span className="font-semibold">{formatMWK(item.unit_price_mwk * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-display font-bold text-xl text-gradient">{formatMWK(order.total_mwk)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="rounded-2xl bg-secondary/30 p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Delivery Address
          </h3>
          <p>{order.customer_name}</p>
          <p className="text-muted-foreground">{order.customer_location}</p>
          <p className="text-muted-foreground flex items-center gap-2">
            <Phone className="h-3 w-3" /> {order.customer_phone}
          </p>
          {order.notes && <p className="text-sm text-muted-foreground mt-2">Note: {order.notes}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="whatsapp" className="flex-1">
            <a href={buildWhatsAppLink(`Hi Streetwear Blantyre, I'm checking on order #${order.id.slice(0,8).toUpperCase()}.`)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </Button>
          
          {order.status === "delivered" && (
            <Button asChild variant="outline" className="flex-1">
              <a href={buildWhatsAppLink(`Just received order #${order.id.slice(0,8).toUpperCase()}! Thanks! Here's my review:`)} target="_blank" rel="noopener noreferrer">
                <Star className="h-4 w-4" /> Leave Review
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;