import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatMWK } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Truck, Phone, MapPin, Loader2, Eye, MessageCircle, Zap, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { DELIVERY_ZONES } from "@/lib/delivery";
import { 
  orderConfirmation, 
  paymentReceived, 
  orderDispatched, 
  orderDelivered, 
  orderCancelled,
  buildWhatsAppLink 
} from "@/lib/ai-messages";
import { adminBrandId, useAdminBrand } from "@/lib/adminBrand";

const rpcErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// Complete a pending referral and award both sides once the order is paid.
const completeReferral = async (userId: string, orderId: string) => {
  try {
    return await supabase.rpc("complete_referral", {
      p_referee_id: userId,
      p_order_id: orderId,
    });
  } catch (error) {
    return { data: null, error };
  }
};

interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_location: string | null;
  total_mwk: number;
  subtotal_mwk?: number;
  delivery_fee_mwk?: number;
  status: string;
  notes: string | null;
  created_at: string;
  delivery_zone?: string;
  delivery_method?: string;
  tracking_number?: string;
  payment_method?: string;
  payment_status?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  unit_price_mwk: number;
  quantity: number;
}

const STATUSES = ["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"] as const;

const STATUS_MESSAGES: Record<string, string> = {
  new: "Your order has been received and is being processed.",
  confirmed: "Your order has been confirmed! We're preparing it for you.",
  processing: "Your order is being prepared and will be dispatched soon.",
  dispatched: "Great news! Your order is on its way.",
  delivered: "Your order has been delivered! Enjoy your Streetwear Blantyre pieces.",
  cancelled: "We're sorry, your order has been cancelled.",
};

const statusColors: Record<string, string> = {
  new: "bg-accent text-gray-900",
  confirmed: "bg-primary text-gray-900",
  processing: "bg-amber-500 text-gray-900",
  dispatched: "bg-purple-500 text-gray-900",
  delivered: "bg-green-500 text-gray-900",
  cancelled: "bg-destructive text-gray-900",
};

const AdminOrders = () => {
  const brand = useAdminBrand();
  const brandId = adminBrandId(brand);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, brandId]);

  const fetchOrders = () => {
    let query = supabase
      .from("orders")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }
    query.then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  };

  const sendWhatsAppNotification = async (order: Order, newStatus: string, markPaid = false) => {
    const phone = order.customer_phone.replace(/[^0-9]/g, "");
    const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
    
    // Fetch order items for the message
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_mwk")
      .eq("order_id", order.id);
    
    const itemsList = orderItems?.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.unit_price_mwk })) || [];
    
    // Use different message templates based on status
    let message: string;
    
    // 1. Payment confirmation - when payment is confirmed
    if (markPaid || newStatus === "confirmed") {
      message = paymentReceived({
        orderId: order.id,
        customerName: order.customer_name,
        items: itemsList,
        total: order.total_mwk,
        location: order.customer_location || "",
        deliveryMethod: order.delivery_method || "standard",
      });
    } 
    // 2. Order being processed
    else if (newStatus === "processing") {
      message = orderConfirmation({
        orderId: order.id,
        customerName: order.customer_name,
        items: itemsList,
        total: order.total_mwk,
        location: order.customer_location || "",
        deliveryMethod: order.delivery_method || "standard",
      });
    }
    // 3. Order dispatched
    else if (newStatus === "dispatched") {
      message = orderDispatched({
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: "dispatched",
        items: itemsList,
        eta: "Today",
      });
    }
    // 4. Order delivered
    else if (newStatus === "delivered") {
      message = orderDelivered({
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: "delivered",
        items: itemsList,
      });
    }
    // 5. Order cancelled
    else if (newStatus === "cancelled") {
      message = orderCancelled({
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: "cancelled",
        items: itemsList,
        total: order.total_mwk,
      });
    }
    // 6. Generic status update
    else {
      message = `ðŸ“¦ *Order Update* @${order.customer_name.split(' ')[0]}

Your order #${order.id.slice(0, 8).toUpperCase()} status: *${newStatus.toUpperCase()}*

${itemsList.map(i => `• ${i.quantity}× ${i.name}`).join('\n')}

Total: MK ${order.total_mwk.toLocaleString()}

Track: https://www.wearsb.com/track/${order.id}`;
    }
    
    window.open(buildWhatsAppLink(message, waPhone), "_blank");
  };

  const updateStatus = async (orderId: string, newStatus: string, markPaid = false) => {
    const order = orders.find(o => o.id === orderId);
    const updates: any = { status: newStatus };
    if (markPaid) {
      updates.payment_status = "paid";
    }
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .eq("brand_id", brandId);
    if (error) {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
    
    if (order && STATUS_MESSAGES[newStatus] && !markPaid) {
      // Fetch order items for email
      const { data: items } = await supabase.from("order_items").select("product_name, unit_price_mwk, quantity").eq("order_id", orderId);
      const orderItems = items?.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.unit_price_mwk })) || [];
      
      sendWhatsAppNotification(order, newStatus);
      
      // Send email notification based on status
      try {
        const { sendPaymentReceivedEmail, sendDispatchedEmail, sendDeliveredEmail } = await import("@/lib/brevo");
        const email = `${order.customer_phone.replace(/[^0-9]/g, "")}@streetwearblantyre.mw`;
        
        if (newStatus === "confirmed" || markPaid) {
          sendPaymentReceivedEmail({
            to: email,
            toName: order.customer_name,
            orderId: order.id,
            items: orderItems,
            total: order.total_mwk,
            location: order.customer_location || "",
            deliveryMethod: order.delivery_method || "standard",
            type: "payment",
          });
        } else if (newStatus === "dispatched") {
          sendDispatchedEmail({
            to: email,
            toName: order.customer_name,
            orderId: order.id,
            items: orderItems,
            total: order.total_mwk,
            location: order.customer_location || "",
            deliveryMethod: order.delivery_method || "standard",
            eta: "Today",
            type: "dispatched",
          });
        } else if (newStatus === "delivered") {
          sendDeliveredEmail({
            to: email,
            toName: order.customer_name,
            orderId: order.id,
            items: orderItems,
            total: order.total_mwk,
            location: order.customer_location || "",
            deliveryMethod: order.delivery_method || "",
            type: "delivered",
          });
        }
      } catch (e) {
        console.warn("Order status email failed", e);
      }
    }
  };

  const markAsPaid = async (orderId: string) => {
    // Single transactional transition: marks paid, confirms LF reservations,
    // commits SB inventory exactly once, and records the audit trail.
    const { error } = await supabase.rpc("mark_order_paid", { p_order_id: orderId });

    if (error) {
      toast({
        title: "Could not mark order paid",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Award loyalty and complete a pending referral exactly once.
    const { error: loyaltyError } = await supabase.rpc("award_loyalty_for_order", { p_order_id: orderId });
    if (loyaltyError) {
      toast({
        title: "Payment saved, reward not added",
        description: loyaltyError.message,
      });
    }

    const paidOrder = orders.find((order) => order.id === orderId);
    if (paidOrder?.user_id) {
      const { error: referralError } = await completeReferral(paidOrder.user_id, orderId);
      if (referralError) {
        toast({
          title: "Payment saved, referral not updated",
          description: rpcErrorMessage(referralError),
        });
      }
    }

    await updateStatus(orderId, "confirmed", true);
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("id, product_name, unit_price_mwk, quantity").eq("order_id", order.id);
    setOrderItems(data || []);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === "all" ? "bg-gradient-brand text-gray-900" : "bg-card border border-border"}`}>
          All
        </button>
        {STATUSES.map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${filter === status ? "bg-gradient-brand text-gray-900" : "bg-card border border-border"}`}>
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/60">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border/60 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[order.status]}`}>{order.status}</span>
                    {order.delivery_method === "express" && <Zap className="h-3 w-3 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), "PPp")}</span>
                    {order.payment_method === "paychangu" && <span className="text-xs bg-gray-100 text-gray-700 px-1.5 rounded">PayChangu</span>}
                    {order.payment_status === "paid" && <span className="text-xs bg-green-500 text-gray-900 px-1.5 rounded">PAID</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatMWK(order.total_mwk)}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{order.customer_phone}</div>
                <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{order.customer_location || "No location"}</div>
                {order.delivery_zone && (
                  <div className="flex items-center gap-1 text-muted-foreground"><Truck className="h-3 w-3" />{DELIVERY_ZONES[order.delivery_zone as keyof typeof DELIVERY_ZONES]?.name || order.delivery_zone}</div>
                )}
                {order.tracking_number && (
                  <div className="flex items-center gap-1 text-muted-foreground"><Package className="h-3 w-3" />{order.tracking_number}</div>
                )}
              </div>

<div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => viewOrder(order)}><Eye className="h-3 w-3" /> Details</Button>
                <Button variant="outline" size="sm" onClick={() => sendWhatsAppNotification(order, order.status)}><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
                {order.payment_status !== "paid" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markAsPaid(order.id)}>
                    <DollarSign className="h-3 w-3" /> Mark Paid
                  </Button>
                )}
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="flex gap-1">
                    {STATUSES.map((status) => (
                      <Button key={status} variant={order.status === status ? "default" : "outline"} size="sm" onClick={() => updateStatus(order.id, status)} disabled={order.status === status}>
                        <span className="capitalize">{status}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((status) => (
                  <Button key={status} variant={selectedOrder.status === status ? "default" : "outline"} size="sm" onClick={() => { updateStatus(selectedOrder.id, status); setSelectedOrder({ ...selectedOrder, status }); }}>
                    <span className="capitalize">{status}</span>
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-border/30">
                    <span>{item.quantity} × {item.product_name}</span>
                    <span className="font-semibold">{formatMWK(item.unit_price_mwk * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span>{formatMWK(selectedOrder.total_mwk)}</span>
                </div>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg text-sm">
                <p><strong>{selectedOrder.customer_name}</strong></p>
                <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                <p className="text-muted-foreground">{selectedOrder.customer_location || "No location"}</p>
                {selectedOrder.notes && <p className="mt-1 text-muted-foreground text-xs">Note: {selectedOrder.notes}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;