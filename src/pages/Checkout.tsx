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
import { ArrowLeft, Check, Loader2, CreditCard, Zap, Gift } from "lucide-react";

const Checkout = () => {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { loyalty, program, getRewardValue, redeemPoints, earnPoints } = useLoyalty(user?.id, user?.email);
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
  const [paymentMethod, setPaymentMethod] = useState<"paychangu" | "offline">("paychangu");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());

  // Fetch inventory for cart items
  useEffect(() => {
    if (items.length === 0) return;
    const productIds = [...new Set(items.map(i => i.productKey.split("-")[0]))];
    supabase.from("inventory").select("product_id, quantity").in("product_id", productIds)
      .then(({ data }) => {
        const map = new Map<string, number>();
        data?.forEach(i => map.set(i.product_id, i.quantity));
        setStockMap(map);
      })
      .catch(() => {});
  }, [items]);

  // Calculate totals
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const promoDiscount = promoApplied?.discount || 0;
  
  // Calculate loyalty discount
  const availablePoints = loyalty?.available_points || 0;
  const maxPointsToUse = Math.min(availablePoints, program?.points_to_redeem || 100);
  const loyaltyDiscount = usePoints && loyalty && program 
    ? Math.floor(maxPointsToUse / program.points_to_redeem) * program.reward_value_mwk 
    : 0;
  
  const totalDiscount = promoDiscount + loyaltyDiscount;
  const total = subtotal - totalDiscount + deliveryFee;

  const handleRedeemPoints = async () => {
    if (!user || !loyalty || !program) return;
    
    const maxPoints = Math.min(availablePoints, program.points_to_redeem);
    if (maxPoints < program.points_to_redeem) {
      toast({ title: `Need ${program.points_to_redeem} points to redeem`, variant: "destructive" });
      return;
    }
    
    setRedeeming(true);
    try {
      const result = await redeemPoints(maxPoints, subtotal);
      if (result.success) {
        setUsePoints(true);
        toast({ title: "Points applied!", description: `-${formatMWK(result.discount)} discount` });
      } else {
        toast({ title: "Could not redeem", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error redeeming points", variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

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
    if (items.length === 0) { toast({ title: "Experience is empty", variant: "destructive" }); return; }

    // Validate phone number
    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 7) {
      toast({ title: "Enter a valid phone number", description: "At least 7 digits (e.g., 888000000)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Verify stock availability
      const productIds = items.map(i => i.productKey.split("-")[0]);
      const { data: inventory } = await supabase.from("inventory").select("product_id, quantity").in("product_id", productIds);
      const inventoryMap = new Map(inventory?.map(i => [i.product_id, i.quantity]) || []);
      
      for (const item of items) {
        const pid = item.productKey.split("-")[0];
        const available = inventoryMap.get(pid) ?? 10;
        if (item.quantity > available) {
          toast({ title: "Stock issue", description: `${item.name} only has ${available} in stock`, variant: "destructive" });
          setSubmitting(false);
          return;
        }
      }

      // Create order
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user?.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_location: formData.location,
        notes: formData.deliveryNote,
        subtotal_mwk: subtotal,
        delivery_fee_mwk: deliveryFee,
        total_mwk: total,
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
          total,
          location: formData.location,
          deliveryMethod: selectedDelivery?.label || "Standard",
          eta: selectedDelivery?.eta,
          type: "confirmation" as const,
        };
        await sendOrderConfirmationEmail(emailParams);
        await sendAdminNotificationEmail({ ...emailParams, type: "payment" as const });
      } catch (e) {
        console.log("Email sending failed (non-critical):", e);
      }

      // Add order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_key: item.productKey,
        product_name: item.name,
        unit_price_mwk: item.price,
        quantity: item.quantity,
      }));
      await supabase.from("order_items").insert(orderItems);

      // Use loyalty points - deduct redeemed points
      if (usePoints && loyalty && program) {
      }

      // Award loyalty points for purchase (1 point per 1000 MWK)
      if (user?.id && subtotal >= 1000) {
        const pointsToEarn = Math.floor(subtotal / 1000);
        try {
          await earnPoints(orderId, subtotal);
        } catch (e) {
          console.error("Failed to award points:", e);
        }
      }

      // Save shipping info for next time
      try {
        localStorage.setItem("sb_shipping", JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
        }));
      } catch {}

      const orderRef = orderId.slice(0, 8).toUpperCase();
      const txRef = `SB-${orderRef}`;

      // Payment flow
      if (paymentMethod === "offline") {
        const businessPhone = import.meta.env.VITE_WHATSAPP_BUSINESS || "265884400000";
        const bankDetails = `Bank: Standard Bank\nAccount: 9100000380567\nStreetwear Blantyre\nReference: SB${orderRef}`;
        const whatsAppMessage = `Hello Streetwear Blantyre! I want to pay for my order #${orderRef} (${formatMWK(total)}).\n\nOr bank transfer:\n${bankDetails}\n\nMy Name: ${formData.name}\nMy Phone: ${formData.phone}\nDelivery: ${formData.location}`;
        const whatsAppLink = `https://wa.me/${businessPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
        clear();
        window.open(whatsAppLink, "_blank");
        navigate(`/orders/${orderId}?payment=pending`);
        toast({ 
          title: "Order placed!", 
          description: "Check WhatsApp to complete payment",
          duration: 8000 
        });
        return;
      }

      // PayChangu online payment — redirect via form POST (no secret key exposed)
      clear();
      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: total,
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
      // Browser navigates to PayChangu via form submit — no code after this runs
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-12 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Your experience is empty</h2>
        <p className="text-gray-500 mb-6">Grab a culture pack. Better value, one box, delivered.</p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/combos">View Culture Packs</Link></Button>
          <Button asChild variant="outline"><Link to="/shop">Browse Culture Pieces</Link></Button>
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

      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6">Complete Your Experience</h1>

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
              <p className="text-xs text-gray-400 text-center py-3">
                Enter your location to see delivery options
              </p>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
          <h2 className="font-semibold mb-3">
            Payment Method
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("paychangu")}
              className={`w-full py-4 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === "paychangu"
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Pay Online</p>
                <p className="text-xs text-gray-500">Airtel Money, TNM Mpamba, Visa, Mastercard</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === "paychangu" ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                {paymentMethod === "paychangu" && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("offline")}
              className={`w-full py-4 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === "offline"
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.15.347-.347.52-.521.151-.174.198-.298.297-.496.149-.198.074-.347-.05-.486-.124-.149-.297-.347-.446-.521-.149-.174-.297-.297-.495-.297h-.45c.262 0 .521-.074.643.371.149.372.52 1.22.567 1.387.074.15.223.174.446.074.223-.074.52-.148.767-.297.272-.174.442-.273.589-.347.272-.149.521-.124.714.124.173.223.52.595.698.795.173.174.347.223.496.149.173-.074.348-.124.595-.372.272-.272.395-.52.52-.795.074-.174.074-.348.025-.521-.074-.173-.149-.297-.272-.397h-.396c.223 0 .521.025.768.372zM2.58 2.205c.521-.644.944-.396 1.598-.099.654.297 1.095.694 1.318 1.006.223.312.124.669-.074 1.006-.173.312-.521 1.006-.595 1.083-.074.074-.223.124-.372.025-.149-.099-.521-.347-1.006-.669-.471-.321-1.006-.595-1.44-.669-.421-.074-.919-.025-1.318.223-.421.272-.595.595-.669.743-.074.149-.025.223.124.347.149.124.347.347.521.521.173.173.347.223.496.347.173.124.272.223.371.372.124.149.149.272.049.446-.074.173-.347.595-.595.92-.248.322-.471.546-.595.645-.124.099-.272.074-.371-.025-.099-.099-.521-.595-.768-1.006-.248-.421-.347-.595-.496-.744-.149-.149-.272-.272-.372-.297-.099-.025-.198-.025-.297.025-.099.049-.272.124-.495.297z"/>
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Pay with WhatsApp</p>
                <p className="text-xs text-gray-500">Get a payment link + bank details sent to you</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === "offline" ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                {paymentMethod === "offline" && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          </div>

          {paymentMethod === "paychangu" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-800">How online payment works</p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>After placing your order, you will be redirected to PayChangu.</li>
                <li>Pay with Airtel Money, TNM Mpamba, Visa or Mastercard.</li>
                <li>You will be returned to your experience page once payment is complete.</li>
              </ul>
            </div>
          )}

          {paymentMethod === "offline" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-800">Bank transfer details</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="text-gray-400">Bank:</span> Standard Bank</p>
                <p><span className="text-gray-400">Account:</span> 9100000380567</p>
                <p><span className="text-gray-400">Name:</span> Streetwear Blantyre</p>
                <p className="text-gray-400 mt-2">Use your order reference as payment note. We will confirm via WhatsApp once payment is received.</p>
              </div>
            </div>
          )}
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
                onClick={handleRedeemPoints}
                disabled={redeeming || usePoints}
                className={`py-1.5 px-3 rounded-lg text-sm font-medium ${
                  usePoints 
                    ? "bg-green-500 text-white"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {redeeming ? "Applying..." : usePoints ? "Applied!" : "Use Points"}
              </button>
            </div>
            {loyaltyDiscount > 0 && (
              <p className="text-xs text-green-600 mt-2">âœ“ -{formatMWK(loyaltyDiscount)} discount applied!</p>
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
        <div className="bg-gray-900 text-white rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="space-y-1.5 text-xs divide-y divide-white/10">
            {items.map((item, idx) => {
              const pid = item.productKey.split("-")[0];
              const stock = stockMap.get(pid);
              const lowStock = stock !== undefined && stock <= 5;
              return (
                <div key={idx} className="flex items-center justify-between py-2 first:pt-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{item.quantity} x {item.name}</span>
                    {lowStock && (
                      <span className="shrink-0 text-[10px] text-gray-400 font-medium">Only {stock} left</span>
                    )}
                  </div>
                  <span className="shrink-0 ml-2">{formatMWK(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-1.5 text-sm pt-2 border-t border-white/20">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal</span>
              <span>{formatMWK(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Promo ({promoApplied?.code})</span>
                <span>-{formatMWK(promoDiscount)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Rewards Points</span>
                <span>-{formatMWK(loyaltyDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>
                Delivery
                {selectedDelivery && (
                  <span className="text-xs text-gray-400 ml-1">
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
            <div className="border-t border-white/20 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatMWK(total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-xs sm:text-sm text-green-700">
          30 day guarantee. Not happy? Send it back, no questions asked.
        </div>

        <Button 
          type="submit" 
          disabled={submitting}
          className="w-full py-3 text-lg bg-gray-900 hover:bg-gray-800"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <> {paymentMethod === "offline" ? "Place Order" : "Pay Now"} <Zap className="h-5 w-5 ml-2" /></>
          )}
        </Button>
      </form>
    </div>
  );
};

export default Checkout;