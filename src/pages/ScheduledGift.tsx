import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import {
  Calendar, Gift, MessageCircle, ArrowRight, Check,
  Package, User, Loader2, CreditCard,
} from "lucide-react";

const occasions = [
  "Birthday", "Graduation", "Christmas", "Valentine's Day",
  "Anniversary", "Good Luck", "Just Because",
];

const ScheduledGift = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [occasion, setOccasion] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendGift = async () => {
    if (!selectedProduct || !recipientName || !recipientPhone || !deliveryLocation) return;
    if (!user) { navigate(`/auth?redirect=/gift`); return; }

    setSubmitting(true);
    try {
      const { data: tokenData } = await supabase.rpc("generate_gift_tracking_token" as any);
      const trackingToken = tokenData as string || `gt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

      const { data: gift, error: giftError } = await supabase.from("gifts").insert({
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Someone",
        sender_email: user.email,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_email: recipientEmail || null,
        gift_type: "single",
        gift_message: giftMessage || null,
        occasion: occasion || null,
        preferred_delivery_date: deliveryDate || null,
        delivery_location: deliveryLocation,
        total_mwk: selectedProduct.price,
        tracking_token: trackingToken,
        status: "created",
      }).select().single();

      if (giftError) throw giftError;

      await supabase.from("gift_items").insert({
        gift_id: gift.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_image: selectedProduct.image,
        unit_price_mwk: selectedProduct.price,
        quantity: 1,
      });

      await supabase.from("gift_tracking").insert({
        gift_id: gift.id,
        status: "created",
        note: "Gift created by sender",
      });

      const txRef = `SB-GIFT-${gift.id.slice(0, 8).toUpperCase()}`;
      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: selectedProduct.price,
        currency: "MWK",
        email: user.email || `${recipientPhone}@wearsb.com`,
        firstName: user.user_metadata?.full_name?.split(" ")[0] || "Gift",
        lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "Sender",
        txRef,
        callbackUrl: `${window.location.origin}/gift-track/${trackingToken}?payment=callback`,
        returnUrl: `${window.location.origin}/gift-track/${trackingToken}?payment=complete`,
        title: `Streetwear Blantyre Gift — ${selectedProduct.name}`,
        description: `Gift for ${recipientName}`,
      });
    } catch (err: any) {
      console.error("Gift creation error:", err);
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-500">Creating your gift...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO
        title="Schedule a Gift — Streetwear Blantyre"
        description="Gift a Culture Piece with a personal message. Schedule delivery for any occasion."
      />

      <section className="bg-gray-950 text-white overflow-hidden">
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="relative max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-white/70 text-xs font-semibold tracking-[0.15em] uppercase mb-6">
              <Calendar className="h-3.5 w-3.5" /> Scheduled Gift
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
              SEND THE CULTURE.
              <br />
              <span className="text-gray-400">ON THEIR DAY.</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Pick a Culture Piece. Pay online. We deliver it on the perfect day — with your message inside.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100">
        <div className="container py-5">
          <div className="flex items-center justify-center gap-0 max-w-lg mx-auto">
            {[
              { num: 1, label: "Pick a Piece" },
              { num: 2, label: "Add Details" },
              { num: 3, label: "Pay & Send" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s.num ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-gray-900" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className={`h-px w-12 sm:w-16 mx-3 ${step > s.num ? "bg-gray-900" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {step === 1 && (
        <section className="container py-16 sm:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Step 1</p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Pick a Culture Piece</h2>
              <p className="text-gray-500 text-sm mt-2">Search by name or category to find the perfect gift.</p>
            </div>

            <div className="relative mb-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Culture Pieces..."
                className="pl-10 rounded-full"
              />
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    if (!user) { navigate(`/auth?redirect=/gift`); return; }
                    setSelectedProduct(product);
                    setStep(2);
                  }}
                  className={`group relative p-3 rounded-xl border text-left transition-all duration-200 ${
                    selectedProduct?.id === product.id
                      ? "border-gray-900 bg-gray-50 ring-2 ring-gray-900/10"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{product.category}</p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatMWK(product.price)}</p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400 text-sm">No pieces found. Try a different search.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {step === 2 && selectedProduct && (
        <section className="container py-16 sm:py-20">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Step 2</p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Gift Details</h2>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-8">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="h-16 w-16 rounded-lg object-cover border border-gray-100" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{selectedProduct.category}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
                <p className="text-sm font-bold text-gray-900">{formatMWK(selectedProduct.price)}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">Occasion</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {occasions.map((occ) => (
                    <button
                      key={occ}
                      onClick={() => setOccasion(occasion === occ ? "" : occ)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        occasion === occ ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <User className="inline h-3.5 w-3.5 mr-1" /> Recipient Name *
                </Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Who's this for?" className="mt-1.5" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Recipient Phone *</Label>
                <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="For delivery coordination" className="mt-1.5" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Recipient Email (for tracking link)</Label>
                <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="They'll receive a tracking link here" className="mt-1.5" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Delivery Location *</Label>
                <Input value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="e.g., Area 9, Blantyre" className="mt-1.5" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Preferred Delivery Date</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="mt-1.5" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <MessageCircle className="inline h-3.5 w-3.5 mr-1" /> Gift Message (optional)
                </Label>
                <Textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Write something personal..." rows={3} className="mt-1.5 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep(1)} variant="outline" className="rounded-full px-6 py-3 font-semibold">Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!recipientName || !recipientPhone || !deliveryLocation}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-full py-3 font-semibold disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && selectedProduct && (
        <section className="container py-16 sm:py-20">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Step 3</p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Pay & Send</h2>
            </div>

            <div className="p-5 bg-gray-50 rounded-xl mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm font-bold text-gray-900">{formatMWK(selectedProduct.price)}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient</span>
                  <span className="font-medium text-gray-900">{recipientName}</span>
                </div>
                {occasion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occasion</span>
                    <span className="font-medium text-gray-900">{occasion}</span>
                  </div>
                )}
                {deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Date</span>
                    <span className="font-medium text-gray-900">{new Date(deliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
                {deliveryLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-gray-900">{deliveryLocation}</span>
                  </div>
                )}
                {giftMessage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Message</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">"{giftMessage}"</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="h-5 w-5 text-gray-900" />
                <p className="font-semibold text-sm">Secure Online Payment</p>
              </div>
              <p className="text-xs text-gray-500">
                You'll be redirected to PayChangu to complete payment. After payment, the recipient will receive a tracking link via email.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="rounded-full px-6 py-3 font-semibold">Back</Button>
              <Button
                onClick={handleSendGift}
                disabled={submitting}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-full py-3 font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {formatMWK(selectedProduct.price)}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
            {[
              { icon: Gift, title: "Premium Wrapping", desc: "Every gift arrives wrapped in our signature packaging" },
              { icon: MessageCircle, title: "Handwritten Note", desc: "Your message printed on a Culture card inside" },
              { icon: Calendar, title: "Scheduled Delivery", desc: "Choose the perfect date for delivery in Blantyre" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center mb-3">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScheduledGift;
