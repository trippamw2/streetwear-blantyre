import { LFLink } from "@/components/lf/lfRouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Fish, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { formatDeliveryDate } from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";

const statusLabel = (status: string) =>
  ({
    new: "Pending payment",
    confirmed: "Payment confirmed",
    processing: "Preparing",
    dispatched: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }[status] || status);

const statusTone = (status: string) => {
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "delivered") return "bg-[#39B54A]/10 text-[#39B54A]";
  if (status === "new") return "bg-amber-50 text-amber-800";
  return "bg-[#EAF6FB] text-[#073B78]";
};

const LakeFreshOrders = () => {
  const { user } = useAuth();
  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["lf", "orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_mwk, payment_reference, delivery_date, created_at")
        .eq("brand_id", LF_BRAND_ID)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="My Orders — Lake Fresh Fish Mart" description="Track your Lake Fresh fish orders." />
      <div className="container max-w-3xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#073B78]">MY ORDERS</h1>
        <p className="mt-2 text-sm text-gray-500">Next day fish orders and their delivery dates.</p>

        {isLoading && (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
          </p>
        )}

        {isError && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load your orders.{" "}
            <button type="button" onClick={() => refetch()} className="font-bold underline">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && orders && orders.length === 0 && (
          <div className="mt-10 rounded-2xl border border-gray-200 p-10 text-center">
            <Fish className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-display text-xl font-extrabold text-[#073B78]">No orders yet</p>
            <p className="mt-1 text-sm text-gray-500">Your Lake Fresh orders will appear here.</p>
            <LFLink
              to="/lf/fish"
              className="mt-5 inline-flex rounded-lg bg-[#073B78] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              Browse the catch
            </LFLink>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {(orders || []).map((order) => (
            <LFLink
              key={order.id}
              to={`/lf/orders/${order.id}`}
              className="block rounded-2xl border border-gray-200 p-4 transition-colors hover:border-[#073B78]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-gray-500">
                    {order.payment_reference || `LF-${order.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-[#073B78]">
                    {formatMWK(order.total_mwk)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.delivery_date
                      ? `Delivery ${formatDeliveryDate(order.delivery_date)}`
                      : "Delivery date pending"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusTone(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </LFLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LakeFreshOrders;
