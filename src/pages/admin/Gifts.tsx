import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Gift, Loader2, Eye, MessageCircle, Package, Truck, MapPin,
  Check, Clock, X, Calendar, User, Mail, Phone,
} from "lucide-react";
import { format } from "date-fns";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const GIFT_STATUSES = ["created", "paid", "preparing", "dispatched", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  created: "bg-gray-100 text-gray-600",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  dispatched: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  paid: "Paid",
  preparing: "Preparing",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface GiftRecord {
  id: string;
  sender_id: string | null;
  sender_name: string;
  sender_email: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  gift_type: string;
  gift_message: string | null;
  occasion: string | null;
  preferred_delivery_date: string | null;
  delivery_location: string | null;
  total_mwk: number;
  is_paid: boolean;
  payment_status: string;
  paid_at: string | null;
  tracking_token: string;
  status: string;
  review_submitted: boolean;
  created_at: string;
  updated_at: string;
  gift_items?: GiftItem[];
  gift_tracking?: GiftTrackingEvent[];
}

interface GiftItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  unit_price_mwk: number;
  quantity: number;
  size: string | null;
}

interface GiftTrackingEvent {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

const AdminGifts = () => {
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<GiftRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchGifts();
  }, [filter]);

  const fetchGifts = async () => {
    setLoading(true);
    let query = supabase
      .from("gifts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data: giftsData } = await query;

    if (giftsData) {
      const giftsWithDetails = await Promise.all(
        giftsData.map(async (gift) => {
          const [{ data: items }, { data: tracking }] = await Promise.all([
            supabase.from("gift_items").select("*").eq("gift_id", gift.id),
            supabase.from("gift_tracking").select("*").eq("gift_id", gift.id).order("created_at", { ascending: false }),
          ]);
          return {
            ...gift,
            gift_items: items || [],
            gift_tracking: tracking || [],
          } as GiftRecord;
        })
      );
      setGifts(giftsWithDetails);
    }

    setLoading(false);
  };

  const updateGiftStatus = async (giftId: string, newStatus: string) => {
    setUpdatingStatus(giftId);
    try {
      // Update gift status
      const { error } = await supabase
        .from("gifts")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", giftId);

      if (error) throw error;

      // Log tracking event
      await supabase.from("gift_tracking").insert({
        gift_id: giftId,
        status: newStatus,
        note: `Status updated to ${STATUS_LABELS[newStatus] || newStatus} by admin`,
      });

      // Send WhatsApp to recipient if dispatched
      const gift = gifts.find((g) => g.id === giftId);
      if (gift && newStatus === "dispatched") {
        const phone = gift.recipient_phone.replace(/[^0-9]/g, "");
        const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
        const message = `Hi ${gift.recipient_name}! 🎁\n\nYour gift from ${gift.sender_name} is on its way!\n\nTrack it here: https://wearsb.com/gift-track/${gift.tracking_token}\n\n- Streetwear Blantyre`;
        window.open(buildWhatsAppLink(message, waPhone), "_blank");
      }

      if (gift && newStatus === "delivered") {
        const phone = gift.recipient_phone.replace(/[^0-9]/g, "");
        const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
        const message = `Hi ${gift.recipient_name}! 🎁\n\nYour gift from ${gift.sender_name} has been delivered! We hope you love it.\n\nLeave a review: https://wearsb.com/gift-track/${gift.tracking_token}\n\n- Streetwear Blantyre`;
        window.open(buildWhatsAppLink(message, waPhone), "_blank");
      }

      toast({ title: `Gift status updated to ${STATUS_LABELS[newStatus] || newStatus}` });

      // Refresh
      fetchGifts();
      if (selectedGift?.id === giftId) {
        const updated = gifts.find((g) => g.id === giftId);
        if (updated) {
          setSelectedGift({
            ...updated,
            status: newStatus,
            gift_tracking: [
              {
                id: `temp-${Date.now()}`,
                status: newStatus,
                note: `Status updated to ${STATUS_LABELS[newStatus] || newStatus} by admin`,
                created_at: new Date().toISOString(),
              },
              ...(updated.gift_tracking || []),
            ],
          });
        }
      }
    } catch (err: any) {
      console.error("Update gift status error:", err);
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openDetail = (gift: GiftRecord) => {
    setSelectedGift(gift);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Gifts</h1>
          <p className="text-gray-500">Manage gift orders, tracking, and delivery</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({gifts.length})
        </button>
        {GIFT_STATUSES.map((status) => {
          const count = gifts.filter((g) => g.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {STATUS_LABELS[status]} ({count})
            </button>
          );
        })}
      </div>

      {/* Gifts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Gift</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Recipient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Occasion</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => (
                <tr key={gift.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-400">#{gift.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {gift.gift_items?.length || 0} item{(gift.gift_items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{gift.sender_name}</p>
                    {gift.sender_email && <p className="text-xs text-gray-400">{gift.sender_email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{gift.recipient_name}</p>
                    <p className="text-xs text-gray-400">{gift.recipient_phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {gift.occasion ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{gift.occasion}</span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">MK {gift.total_mwk.toLocaleString()}</p>
                    <p className={`text-xs ${gift.is_paid ? "text-green-600" : "text-amber-600"}`}>
                      {gift.payment_status}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[gift.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[gift.status] || gift.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(new Date(gift.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(gift)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {gift.status !== "delivered" && gift.status !== "cancelled" && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) updateGiftStatus(gift.id, e.target.value);
                            e.target.value = "";
                          }}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                          disabled={updatingStatus === gift.id}
                        >
                          <option value="">Update...</option>
                          {GIFT_STATUSES
                            .filter((s) => s !== gift.status)
                            .map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {gifts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Gift className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    No gifts found{filter !== "all" ? ` with status "${filter}"` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedGift && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Gift #{selectedGift.id.slice(0, 8).toUpperCase()}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedGift.status]}`}>
                    {STATUS_LABELS[selectedGift.status]}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Sender & Recipient */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sender</p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-gray-400" /> {selectedGift.sender_name}</p>
                      {selectedGift.sender_email && (
                        <p className="flex items-center gap-2 text-gray-500"><Mail className="h-3.5 w-3.5" /> {selectedGift.sender_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recipient</p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-gray-400" /> {selectedGift.recipient_name}</p>
                      <p className="flex items-center gap-2 text-gray-500"><Phone className="h-3.5 w-3.5" /> {selectedGift.recipient_phone}</p>
                      {selectedGift.recipient_email && (
                        <p className="flex items-center gap-2 text-gray-500"><Mail className="h-3.5 w-3.5" /> {selectedGift.recipient_email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occasion</span>
                    <span className="font-medium">{selectedGift.occasion || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Date</span>
                    <span className="font-medium">
                      {selectedGift.preferred_delivery_date
                        ? format(new Date(selectedGift.preferred_delivery_date), "MMM d, yyyy")
                        : "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium">{selectedGift.delivery_location || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold">MK {selectedGift.total_mwk.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className={`font-medium ${selectedGift.is_paid ? "text-green-600" : "text-amber-600"}`}>
                      {selectedGift.payment_status}
                    </span>
                  </div>
                  {selectedGift.review_submitted && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Review</span>
                      <span className="text-green-600 font-medium">Submitted</span>
                    </div>
                  )}
                </div>

                {/* Gift Message */}
                {selectedGift.gift_message && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Gift Message</p>
                    <p className="text-sm text-gray-700 italic">"{selectedGift.gift_message}"</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedGift.gift_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ""}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">MK {item.unit_price_mwk.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tracking Timeline</p>
                  <div className="relative ml-4">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {selectedGift.gift_tracking?.map((event) => (
                        <div key={event.id} className="relative flex items-start gap-3">
                          <div className="relative z-10 h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 pb-1">
                            <p className="text-sm font-medium text-gray-900">{STATUS_LABELS[event.status] || event.status}</p>
                            {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                {selectedGift.status !== "delivered" && selectedGift.status !== "cancelled" && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {GIFT_STATUSES
                        .filter((s) => s !== selectedGift.status && s !== "created")
                        .map((s) => (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            onClick={() => updateGiftStatus(selectedGift.id, s)}
                            disabled={updatingStatus === selectedGift.id}
                            className="rounded-full text-xs"
                          >
                            {updatingStatus === selectedGift.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Mark as {STATUS_LABELS[s]}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tracking Link */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tracking Link</p>
                  <p className="text-xs font-mono text-gray-600 break-all">
                    https://wearsb.com/gift-track/{selectedGift.tracking_token}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGifts;
