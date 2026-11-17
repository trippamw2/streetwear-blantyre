import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatMWK } from "@/data/products";
import { SEO, defaultSEO } from "@/components/SEO";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useReferral } from "@/hooks/useReferral";
import { DeliveryOptions } from "@/components/DeliveryOptions";
import { type DeliveryOption, FREE_DELIVERY_THRESHOLD } from "@/lib/deliveryRules";
import { buildSbPaymentRef } from "@/lib/paymentRefs";
import { ArrowLeft, Check, Loader2, CreditCard, Zap, Gift } from "lucide-react";
import { SB_BRAND_ID } from "@/lib/adminBrand";

const Checkout = () => {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { loyalty, program, getRewardValue, redeemPoints } = useLoyalty(user?.id, user?.email);
  const { stats: referralStats } = useReferral();

  const [formData, setFormData] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sb_shipping") : null;
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || parsed.name || "",
      phone: user?.user_metadata?.phone || parsed.phone || "",
      location: parsed.location || "",
      deliveryNote: parsed.deliveryNote || "",
    };
  });
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const paymentMethod = "paychangu";
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());

  // Fetch inventory for cart items
  useEffect(() => {
    if (items.length === 0) return;
    const productIds = [...new Set(items.map(i => i.productId || i.productKey.split("-")[0]))];
    supabase.from("inventory").select("product_id, quantity").in("product_id", productIds)
      .then(({ data }) => {
        const map = new Map<string, number>();
        data?.forEach(i => map.set(i.product_id, i.quantity));
        setStockMap(map);
      })
      .catch((err) => console.warn("Failed to fetch stock:", err));
  }, [items]);

  // Calculate totals
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const promoDiscount = promoApplied?.discount || 0;
  
  // Calculate loyalty discount. Points are only deducted when the order is
  // submitted, so this is a preview capped the same way the server caps it.
  const availablePoints = loyalty?.available_points || 0;
  const pointsStep = program?.points_to_redeem || 100;
  const rewardValue = program?.reward_value_mwk || 1000;
  const maxRedeemPercent = program?.max_redeem_percent || 50;
  const maxPreviewDiscount = program ? Math.floor((subtotal * maxRedeemPercent) / 100) : 0;
  const maxPreviewPoints = program
    ? Math.floor(maxPreviewDiscount / Math.max(rewardValue, 1)) * pointsStep
    : 0;
  const loyaltyPreviewPoints = usePoints
    ? Math.min(Math.floor(availablePoints / pointsStep) * pointsStep, maxPreviewPoints)
    : 0;
  const loyaltyDiscount = program
    ? Math.floor(loyaltyPreviewPoints / pointsStep) * rewardValue
    : 0;
   
  const totalDiscount = promoDiscount + loyaltyDiscount;
  const total = subtotal - totalDiscount + deliveryFee;

  const applyPromo = async (code?: string) => {
    const promoToApply = code || promoCode;
    if (!promoToApply.trim()) return;
    try {
      const { data } = await supabase.from("promotions").select("*")
        .ilike("name", promoToApply.trim()).eq("is_active", true).single();
      if (!data) { toast({ title: "Invalid code", variant: "destructive" }); return; }
      
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        toast({ title: "Code not yet active", variant: "destructive" }); return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        toast({ title: "Code expired", variant: "destructive" }); return;
      }
      
      const disc = Math.round(subtotal * (data.discount_percent / 100));
      setPromoApplied({ code: data.name, discount: disc });
      toast({ title: "Promo applied!", description: `-${formatMWK(disc)}` });
    } catch { toast({ title: "Invalid code", variant: "destructive" }); }
  };

  // Auto-apply promo from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promoFromUrl = params.get("promo");
    if (promoFromUrl && !promoApplied) {
      setPromoCode(promoFromUrl);
      applyPromo(promoFromUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.location) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (items.length === 0) { toast({ title: "Your cart is empty", variant: "destructive" }); return; }

    // Validate phone number
    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 7) {
      toast({ title: "Enter a valid phone number", description: "At least 7 digits (e.g., 888000000)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Verify stock availability
      const productIds = items.map(i => i.productId || i.productKey.split("-")[0]);
      const { data: inventory } = await supabase.from("inventory").select("product_id, quantity").in("product_id", productIds);
      const inventoryMap = new Map<string, number>(
        (inventory || []).map((i) => [i.product_id, Number(i.quantity) || 0]),
      );
      
      for (const item of items) {
        const pid = item.productId || item.productKey.split("-")[0];
        const available = inventoryMap.get(pid);
        if (available !== undefined && item.quantity > available) {
          toast({ title: "Stock issue", description: `${item.name} only has ${available} in stock`, variant: "destructive" });
          setSubmitting(false);
          return;
        }
      }

      // Redeem points on the server right before the order is created. The
      // returned discount is authoritative; the preview above only mirrors the
      // same caps so the customer knows what to expect.
      let redeemedDiscount = 0;
      if (usePoints && loyaltyPreviewPoints > 0) {
        const redemption = await redeemPoints(loyaltyPreviewPoints, subtotal);
        if (!redemption.success) {
          toast({
            title: "Could not apply rewards",
            description: redemption.error || "Try again without points.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        redeemedDiscount = redemption.discount;
      }

      const finalDiscount = Math.min(subtotal, promoDiscount + redeemedDiscount);
      const finalTotal = Math.max(0, subtotal - finalDiscount + deliveryFee);

      // Create order
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user?.id,
        brand_id: SB_BRAND_ID,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_location: formData.location,
        notes: formData.deliveryNote,
        subtotal_mwk: subtotal,
        delivery_fee_mwk: deliveryFee,
        discount_mwk: finalDiscount,
        promo_code: promoApplied?.code || null,
        total_mwk: finalTotal,
        payment_method: paymentMethod,
        status: "new",
      }).select().single();

      if (error) throw error;
      const orderId = order.id;

      // Send order confirmation email
      try {
        const { sendOrderConfirmationEmail, sendAdminNotificationEmail } = await import("@/lib/brevo");
        const emailParams = {
          to: formData.phone ? `${formData.phone}@wearsb.com` : "customer@wearsb.com",
          toName: formData.name,
          orderId,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          total: finalTotal,
          location: formData.location,
          deliveryMethod: selectedDelivery?.label || "Standard",
          eta: selectedDelivery?.estimatedDays,
          type: "confirmation" as const,
        };
        await sendOrderConfirmationEmail(emailParams);
        await sendAdminNotificationEmail({ ...emailParams, type: "payment" as const });
      } catch (e) {
        console.warn("Email sending failed (non-critical):", e);
      }

      // Add order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        brand_id: SB_BRAND_ID,
        product_key: item.productKey,
        product_name: item.name,
        unit_price_mwk: item.price,
        quantity: item.quantity,
      }));
      await supabase.from("order_items").insert(orderItems);

      // Points are awarded by the admin payment transition (award_loyalty_for_order),
      // never at order creation, so unpaid orders earn nothing.

      // Save shipping info for next time
      try {
        localStorage.setItem("sb_shipping", JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
        }));
      } catch {}

      const orderRef = orderId.slice(0, 8).toUpperCase();
      const txRef = buildSbPaymentRef(orderId);

      // PayChangu online payment, redirect via form POST (no secret key exposed)
      clear();
      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: finalTotal,
        currency: "MWK",
        email: `${cleanPhone}@wearsb.com`,
        firstName: formData.name.split(" ")[0],
        lastName: formData.name.split(" ").slice(1).join(" ") || "",
        txRef,
        callbackUrl: `${window.location.origin}/orders/${orderId}?payment=callback`,
        returnUrl: `${window.location.origin}/orders/${orderId}?payment=complete`,
        title: "Streetwear Blantyre Order",
        description: `Order #${orderRef}`,
      });
      // Browser navigates to PayChangu via form submit, no code after this runs
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-12 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="font-display text-xl font-bold mb-2 text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add a piece to your cart before checking out.</p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/shop">Shop the Collection</Link></Button>
          <Button asChild variant="outline"><Link to="/combos">View Kits</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-8 max-w-2xl">
      <SEO {...defaultSEO.checkout} />
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6 text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Info */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
          <h2 className="font-semibold mb-3">
            Your Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Phone Number *</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="e.g., 888000000"
                required
              />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
          <h2 className="font-semibold mb-3">
            Delivery
          </h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Location / Area *</Label>
              <Input
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Area 9, Blantyre or Lilongwe"
                required
              />
            </div>
            {formData.location.trim().length >= 3 && (
              <DeliveryOptions
                selectedOption={selectedDelivery}
                onSelect={setSelectedDelivery}
                location={formData.location}
                subtotal={subtotal}
              />
            )}
            {formData.location.trim().length < 3 && (
              <p className="text-xs text-gray-500 text-center py-3">
                Enter your location to see delivery options
              </p>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
          <h2 className="font-semibold mb-3">
            Payment
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm">
                <CreditCard className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <p className="font-semibold">Pay Online via PayChangu</p>
                <p className="text-xs text-gray-500">Airtel Money, TNM Mpamba, Visa, Mastercard</p>
              </div>
            </div>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>After placing your order, you will be redirected to PayChangu.</li>
              <li>Pay with Airtel Money, TNM Mpamba, Visa or Mastercard.</li>
              <li>You will return to your order page once payment is complete.</li>
            </ul>
          </div>
        </div>

        {/* Loyalty Points - only show if logged in and has points */}
        {user && loyalty && loyalty.available_points >= (program?.points_to_redeem || 100) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">Use Rewards Points</p>
                  <p className="text-xs text-gray-600">{loyalty.available_points} points available</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsePoints((prev) => !prev)}
                className={`py-1.5 px-3 rounded-lg text-sm font-medium ${
                  usePoints 
                    ? "bg-green-500 text-gray-900"
                    : "bg-amber-500 text-gray-900 hover:bg-amber-600"
                }`}
              >
                {usePoints ? "Points on" : "Use Points"}
              </button>
            </div>
            {loyaltyDiscount > 0 && (
              <p className="text-xs text-green-600 mt-2">
                {loyaltyPreviewPoints} points will save {formatMWK(loyaltyDiscount)} on this order.
              </p>
            )}
          </div>
        )}

        {/* Promo */}
        <div className="bg-gray-50 rounded-xl p-4">
          <Label className="text-xs">Promo Code</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={() => applyPromo()}>Apply</Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="space-y-1.5 text-xs divide-y divide-gray-200">
            {items.map((item, idx) => {
              const pid = item.productId || item.productKey.split("-")[0];
              const stock = stockMap.get(pid);
              const lowStock = stock !== undefined && stock <= 5;
              return (
                <div key={idx} className="flex items-center justify-between py-2 first:pt-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{item.quantity} x {item.name}</span>
                    {lowStock && (
                      <span className="shrink-0 text-[10px] text-gray-500 font-medium">Only {stock} left</span>
                    )}
                  </div>
                  <span className="shrink-0 ml-2">{formatMWK(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-1.5 text-sm pt-2 border-t border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatMWK(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo ({promoApplied?.code})</span>
                <span>-{formatMWK(promoDiscount)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Rewards Points</span>
                <span>-{formatMWK(loyaltyDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>
                Delivery
                {selectedDelivery && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({selectedDelivery.label}
                    {selectedDelivery.id === "same_day"
                    ? " - same day"
                    : ` - ${selectedDelivery.estimatedDays}`}
                    )
                  </span>
                )}
              </span>
              <span>{deliveryFee === 0 ? "Free" : formatMWK(deliveryFee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatMWK(total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center text-xs sm:text-sm text-gray-600">
          30 day quality cover on faults. See our{" "}
          <Link to="/warranty" className="font-semibold text-primary hover:underline">
            Quality Cover
          </Link>{" "}
          page.
        </div>

        <Button 
          type="submit" 
          disabled={submitting}
          variant="hero"
          className="w-full py-3 text-base"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <> Pay Now <Zap className="h-5 w-5 ml-2" /></>
          )}
        </Button>
      </form>
    </div>
  );
};

export default Checkout;