import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO, defaultSEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useCombos } from "@/hooks/useCombos";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK, getKitPrice, getKitProducts, getKitSeparateTotal, getKitRealSaving, getKitDiscountPercent } from "@/data/products";
import { Gift, Package, Heart, MessageCircle, ArrowRight, X, Check, Sparkles, Loader2, CreditCard } from "lucide-react";

interface GiftFormData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  giftMessage: string;
  occasion: string;
  deliveryLocation: string;
}

const occasions = [
  "Birthday", "Graduation", "Anniversary", "Christmas",
  "Valentine's Day", "Just Because", "Good Luck", "Thank You",
];

const GiftPacks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const combos = useCombos();
  const { products } = useProducts();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [giftToken, setGiftToken] = useState("");
  const [formData, setFormData] = useState<GiftFormData>({
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    giftMessage: "",
    occasion: "",
    deliveryLocation: "",
  });

  const selectedKit = combos.find((k) => k.id === selectedPack);

  const handleGiftSelect = (kitId: string) => {
    if (!user) {
      navigate(`/auth?redirect=/gifts`);
      return;
    }
    setSelectedPack(kitId);
    setShowForm(true);
    setSubmitted(false);
  };

  const handleSendGift = async () => {
    if (!selectedKit || !formData.recipientName || !formData.recipientPhone || !formData.deliveryLocation) return;
    if (!user) { navigate(`/auth?redirect=/gifts`); return; }

    setSubmitting(true);
    try {
      const kitPrice = getKitPrice(selectedKit, products);
      const kitProducts = getKitProducts(selectedKit, products);

      // Generate tracking token
      const { data: tokenData } = await supabase.rpc("generate_gift_tracking_token" as any);
      const trackingToken = tokenData as string || `gt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

      // Create gift record
      const { data: gift, error: giftError } = await supabase.from("gifts").insert({
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Someone",
        sender_email: user.email,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        recipient_email: formData.recipientEmail || null,
        gift_type: "pack",
        gift_pack_id: selectedKit.id,
        gift_message: formData.giftMessage || null,
        occasion: formData.occasion || null,
        preferred_delivery_date: null,
        delivery_location: formData.deliveryLocation,
        total_mwk: kitPrice,
        tracking_token: trackingToken,
        status: "created",
      }).select().single();

      if (giftError) throw giftError;

      // Create gift items
      const giftItems = kitProducts.map((p) => ({
        gift_id: gift.id,
        product_id: p.id,
        product_name: p.name,
        product_image: p.image,
        unit_price_mwk: p.price,
        quantity: 1,
      }));
      await supabase.from("gift_items").insert(giftItems);

      // Log initial tracking event
      await supabase.from("gift_tracking").insert({
        gift_id: gift.id,
        status: "created",
        note: "Gift created by sender",
      });

      // Redirect to PayChangu
      const txRef = `SB-GIFT-${gift.id.slice(0, 8).toUpperCase()}`;
      const { redirectToPayChangu } = await import("@/lib/paychangu");
      redirectToPayChangu({
        amount: kitPrice,
        currency: "MWK",
        email: user.email || `${formData.recipientPhone}@wearsb.com`,
        firstName: user.user_metadata?.full_name?.split(" ")[0] || "Gift",
        lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "Sender",
        txRef,
        callbackUrl: `${window.location.origin}/gift-track/${trackingToken}?payment=callback`,
        returnUrl: `${window.location.origin}/gift-track/${trackingToken}?payment=complete`,
        title: `Streetwear Blantyre Gift — ${selectedKit.name}`,
        description: `Gift for ${formData.recipientName}`,
      });
      // Browser navigates to PayChangu — no code after this runs
    } catch (err: any) {
      console.error("Gift creation error:", err);
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPack(null);
    setShowForm(false);
    setSubmitted(false);
    setFormData({
      recipientName: "",
      recipientPhone: "",
      recipientEmail: "",
      giftMessage: "",
      occasion: "",
      deliveryLocation: "",
    });
  };

  return (
    <div>
      <SEO {...defaultSEO.giftPacks} />

      {/* ─── HERO ─── */}
      <section className="bg-gray-950 text-white overflow-hidden">
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <div className="relative max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-white/70 text-xs font-semibold tracking-[0.15em] uppercase mb-6">
              <Gift className="h-3.5 w-3.5" /> Gift the Culture
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
              SEND SOMEONE
              <br />
              <span className="text-gray-400">THE CULTURE.</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Pick a Culture Pack. Pay online. We wrap it and deliver it — with your personal message inside.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-b border-gray-100">
        <div className="container py-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            {[
              { icon: Package, title: "Pick a Pack", desc: "Choose from our curated Culture Packs" },
              { icon: CreditCard, title: "Pay Online", desc: "Secure payment via PayChangu" },
              { icon: Heart, title: "We Wrap It", desc: "Premium gift presentation" },
              { icon: Sparkles, title: "We Deliver", desc: "Recipient gets a tracking link" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 bg-gray-50">
                <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GIFT PACKS GRID ─── */}
      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Curated for Them</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900">Culture Packs</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Each pack is a complete culture experience — styled, coordinated, and ready to gift.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          {combos.map((kit, i) => {
            const kitPrice = getKitPrice(kit, products);
            const separateTotal = getKitSeparateTotal(kit, products);
            const realSaving = getKitRealSaving(kit, products);
            const discount = getKitDiscountPercent(kit);
            const kitProducts = getKitProducts(kit, products);
            const isSelected = selectedPack === kit.id;

            return (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div
                  className={`relative block rounded-xl sm:rounded-2xl bg-white border overflow-hidden transition-all duration-200 h-full ${
                    isSelected ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
                  }`}
                >
                  {kit.badge && (
                    <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[10px] sm:text-xs font-semibold">
                      {kit.badge}
                    </span>
                  )}

                  <div className="bg-gray-50 border-b border-gray-100">
                    <div className="w-full flex items-center justify-center p-4 sm:p-5 aspect-[4/3] max-h-[280px]">
                      <img src={kit.image} alt={kit.name} className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-tight">{kit.name}</h3>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{kit.hook}</p>

                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Includes</p>
                      <div className="space-y-1">
                        {kitProducts.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-[11px]">
                            <img src={p.image} alt={p.name} className="h-7 w-7 rounded-lg object-cover shrink-0 border border-gray-100" />
                            <span className="text-gray-500 truncate">{p.name}</span>
                          </div>
                        ))}
                        {kitProducts.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-medium">+{kitProducts.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="font-bold text-lg sm:text-xl text-gray-900">{formatMWK(kitPrice)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400 line-through">{formatMWK(separateTotal)}</span>
                          <span className="text-[11px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            Save {formatMWK(realSaving)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {discount}% off
                      </span>
                    </div>

                    <Button
                      onClick={() => handleGiftSelect(kit.id)}
                      className="w-full mt-4 bg-gray-900 text-white hover:bg-gray-800 rounded-full py-3 font-semibold"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Gift This Pack
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── GIFT FORM MODAL ─── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-gray-900">Gift Details</h3>
                    <p className="text-sm text-gray-500 mt-0.5">For: {selectedKit?.name} — {selectedKit && formatMWK(getKitPrice(selectedKit, products))}</p>
                  </div>
                  <button onClick={resetForm} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Recipient Name *</Label>
                    <Input
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      placeholder="Who's this for?"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Recipient Phone *</Label>
                    <Input
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      placeholder="For delivery coordination"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Recipient Email (for tracking link)</Label>
                    <Input
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      placeholder="They'll receive a tracking link here"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Delivery Location *</Label>
                    <Input
                      value={formData.deliveryLocation}
                      onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                      placeholder="e.g., Area 9, Blantyre"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Occasion</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {occasions.map((occ) => (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => setFormData({ ...formData, occasion: formData.occasion === occ ? "" : occ })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            formData.occasion === occ
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Gift Message (optional)</Label>
                    <Textarea
                      value={formData.giftMessage}
                      onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })}
                      placeholder="Write something personal..."
                      rows={3}
                      className="mt-1.5 resize-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendGift}
                  disabled={!formData.recipientName || !formData.recipientPhone || !formData.deliveryLocation || submitting}
                  className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800 rounded-full py-3 font-semibold disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {selectedKit && formatMWK(getKitPrice(selectedKit, products))}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  Secure payment via PayChangu. Recipient gets a tracking link after payment.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CTA ─── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="container text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Want Something Custom?</p>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900">Schedule a Single Gift</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Gift a specific Culture Piece with a scheduled delivery date.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button asChild className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-8 py-3 font-semibold">
              <Link to="/gift">Schedule a Gift</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-8 py-3 font-semibold">
              <Link to="/shop">Browse Culture Pieces</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GiftPacks;
