import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import { LFLink } from "@/components/lf/lfRouter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LF_BRAND_ID } from "@/lib/adminBrand";
import { lfDisplayCopy } from "@/lib/lfCopy";

const reasonCopy: Record<string, string> = {
  invalid_rating: "Choose a rating from 1 to 5.",
  invalid_body: "Write at least 10 characters and keep it under 2,000.",
  invalid_title: "Keep the title under 120 characters.",
  product_required: "Choose the fish or spice you are reviewing.",
  product_not_in_order: "That item is not in this order.",
  order_not_delivered: "You can review an order after it is delivered.",
  unauthorized: "Check your order number and access code.",
  not_found: "We could not find that order.",
  invalid_product: "Choose the item you are reviewing.",
};

const LakeFreshReviews = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<any[]>([]);
  const [fish, setFish] = useState<any[]>([]);
  const [spices, setSpices] = useState<any[]>([]);
  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [accessToken, setAccessToken] = useState("");
  const [productType, setProductType] = useState("order");
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const [reviewRes, fishRes, spiceRes] = await Promise.all([
        supabase
          .from("lf_reviews")
          .select("id, customer_name, rating, title, body, product_type, created_at")
          .eq("brand_id", LF_BRAND_ID)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("fish_products")
          .select("id, name")
          .eq("brand_id", LF_BRAND_ID)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("lf_spices")
          .select("id, name")
          .eq("brand_id", LF_BRAND_ID)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      setReviews(reviewRes.data || []);
      setFish(fishRes.data || []);
      setSpices(spiceRes.data || []);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id")
      .eq("brand_id", LF_BRAND_ID)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.id && !orderId) setOrderId(data[0].id);
      });
  }, [user, orderId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const storedToken = orderId ? sessionStorage.getItem(`lf_order_access_${orderId}`) : null;
    const { data, error } = await supabase.rpc("lf_submit_review", {
      p_order_id: orderId,
      p_rating: rating,
      p_body: body,
      p_access_token: accessToken || storedToken || null,
      p_product_id: productId || null,
      p_product_type: productType,
      p_title: title || null,
    });

    if (error) {
      setMessage("We could not send your review. Please try again.");
    } else if ((data as any)?.ok) {
      setMessage("Thank you. We will check your review and add it here soon.");
      setBody("");
      setTitle("");
    } else {
      setMessage(reasonCopy[(data as any)?.reason] || "Check your details and try again.");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white">
      <SEO
        brand="lake-fresh"
        title="Customer Reviews | Lake Fresh Fish Mart"
        description="Read reviews from Lake Fresh customers and tell us about your own order."
        path="/reviews"
      />

      <section className="border-b border-[#F2FBEE] bg-[#F4FBF7]">
        <div className="container py-12 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A]">From our customers</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#073B78] sm:text-4xl">Tell us how it went</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#073B78]/70">
            Your review helps other families know what to expect. We read every review before adding it here.
          </p>
        </div>
      </section>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:py-14">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5">
          <h2 className="font-display text-lg font-extrabold text-[#073B78]">Write a review</h2>
          <div>
            <label className="text-xs font-bold text-[#073B78]" htmlFor="review-order">Order number</label>
            <input
              id="review-order"
              required
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Paste your order number"
              className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#073B78]" htmlFor="review-token">Access code</label>
            <input
              id="review-token"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Only for guest orders"
              className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            />
            <p className="mt-1 text-[11px] text-[#073B78]/60">
              Signed in customers can leave this blank. Your order page has your access code.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[#073B78]" htmlFor="review-type">What is this about?</label>
              <select
                id="review-type"
                value={productType}
                onChange={(event) => {
                  setProductType(event.target.value);
                  setProductId("");
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="order">My whole order</option>
                <option value="fish">Fish</option>
                <option value="spice">Spice</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#073B78]" htmlFor="review-product">Item</label>
              <select
                id="review-product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                disabled={productType === "order"}
                className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-50"
              >
                <option value="">Choose an item</option>
                {productType === "fish" &&
                  fish.map((item) => <option key={item.id} value={item.id}>{lfDisplayCopy(item.name)}</option>)}
                {productType === "spice" &&
                  spices.map((item) => <option key={item.id} value={item.id}>{lfDisplayCopy(item.name)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#073B78]" htmlFor="review-rating">Rating</label>
            <select
              id="review-rating"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} stars</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#073B78]" htmlFor="review-title">Title</label>
            <input
              id="review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A short title"
              className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#073B78]" htmlFor="review-body">Your review</label>
            <textarea
              id="review-body"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Tell us about the fish, packing and delivery."
              className="mt-1 w-full rounded-md border border-input bg-white p-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#39B54A] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
          >
            {saving ? "Sending" : "Send review"}
          </button>
          {message && <p className="text-sm font-semibold text-[#073B78]">{message}</p>}
          <p className="text-xs text-[#073B78]/60">
            Need your access code? <LFLink to="/lf/orders" className="font-bold underline">Open my orders</LFLink>.
          </p>
        </form>

        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-1 text-[#39B54A]">
                {Array.from({ length: Number(review.rating) || 0 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <h3 className="mt-2 font-display text-base font-extrabold text-[#073B78]">
                {lfDisplayCopy(review.title) || `Lake Fresh ${review.product_type} order`}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#073B78]/70">{lfDisplayCopy(review.body)}</p>
              <p className="mt-3 text-xs text-[#073B78]/50">
                {review.customer_name} | {new Date(review.created_at).toLocaleDateString()}
              </p>
            </article>
          ))}
          {reviews.length === 0 && (
            <div className="rounded-2xl border bg-[#F7FBFC] p-6 text-sm text-[#073B78]/60">
              No reviews yet. Be the first to tell us about your order.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LakeFreshReviews;
