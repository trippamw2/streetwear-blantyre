import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift, Package, Check, Truck, MapPin, Star,
  MessageCircle, Calendar, Loader2, ArrowRight,
} from "lucide-react";

const statusSteps = [
  { key: "created", label: "Gift Created", icon: Gift },
  { key: "paid", label: "Payment Confirmed", icon: Check },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "dispatched", label: "Dispatched", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

interface GiftData {
  id: string;
  sender_name: string;
  sender_email: string;
  recipient_name: string;
  recipient_email: string;
  gift_message: string | null;
  occasion: string | null;
  preferred_delivery_date: string | null;
  delivery_location: string | null;
  total_mwk: number;
  status: string;
  review_submitted: boolean;
  created_at: string;
  tracking_token: string;
  gift_items: Array<{
    product_name: string;
    product_image: string;
    unit_price_mwk: number;
    quantity: number;
  }>;
  gift_tracking: Array<{
    status: string;
    note: string | null;
    created_at: string;
  }>;
}

const GiftTrack = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const fetchGift = async () => {
      if (!token) { setError("No tracking token provided"); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("gifts")
        .select(`
          *,
          gift_items (*),
          gift_tracking (*)
        `)
        .eq("tracking_token", token)
        .single();

      if (fetchError || !data) {
        setError("Gift not found. Please check your tracking link.");
        setLoading(false);
        return;
      }

      setGift(data as GiftData);
      setLoading(false);
    };

    fetchGift();
  }, [token]);

  const handleSubmitReview = async () => {
    if (!gift || !reviewComment.trim()) return;
    setSubmittingReview(true);

    try {
      const { error: reviewError } = await supabase.from("gift_reviews").insert({
        gift_id: gift.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        reviewer_name: gift.recipient_name,
      });

      if (reviewError) throw reviewError;

      await supabase
        .from("gifts")
        .update({ review_submitted: true })
        .eq("id", gift.id);

      setReviewSubmitted(true);
      setGift(prev => prev ? { ...prev, review_submitted: true } : prev);
    } catch (err: any) {
      console.error("Review submission error:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-2">Gift Not Found</h1>
          <p className="text-gray-500 text-sm">{error || "This tracking link is invalid or has expired."}</p>
          <Button asChild className="mt-6 bg-gray-900 text-white hover:bg-gray-800 rounded-full px-6">
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === gift.status);
  const latestTracking = gift.gift_tracking?.[0];
  const sortedTracking = [...(gift.gift_tracking || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <SEO
        title={`Gift for ${gift.recipient_name} — Streetwear Blantyre`}
        description={`Track your gift from ${gift.sender_name}`}
      />

      <section className="bg-gray-950 text-white">
        <div className="container py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mb-3">
              YOU'VE RECEIVED A GIFT.
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              {gift.sender_name} sent you a Culture Piece{gift.occasion ? ` for ${gift.occasion.toLowerCase()}` : ""}.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-3">Gift Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">From</span>
                  <span className="font-medium text-gray-900">{gift.sender_name}</span>
                </div>
                {gift.occasion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occasion</span>
                    <span className="font-medium text-gray-900">{gift.occasion}</span>
                  </div>
                )}
                {gift.preferred_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(gift.preferred_delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {gift.delivery_location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-gray-900">{gift.delivery_location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-3">Item</p>
              {gift.gift_items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.product_image} alt={item.product_name} className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {gift.gift_message && (
            <div className="p-5 bg-gray-50 rounded-xl mb-10 border border-gray-100">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1">Personal Message</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{gift.gift_message}"</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-10">
            <h2 className="font-display font-extrabold text-xl text-gray-900 mb-6">Tracking Progress</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-6">
                {statusSteps.map((step, i) => {
                  const isComplete = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const trackingEvent = sortedTracking.find(t => t.status === step.key);
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isComplete ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-gray-900/10" : ""}`}>
                        {isComplete && i < currentStepIndex ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isComplete ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {trackingEvent && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(trackingEvent.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {gift.status === "delivered" && !gift.review_submitted && !reviewSubmitted && (
            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-display font-extrabold text-lg text-gray-900 mb-4">How Was Your Gift?</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Rating</Label>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="p-0.5">
                        <Star className={`h-6 w-6 ${star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Your Review</Label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || submittingReview}
                  className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-6 py-2 font-semibold"
                >
                  {submittingReview ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Review</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {(gift.review_submitted || reviewSubmitted) && (
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-sm text-gray-600">Thank you for your review!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GiftTrack;
