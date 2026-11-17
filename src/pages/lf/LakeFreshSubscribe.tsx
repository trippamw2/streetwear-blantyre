import { useEffect, useState } from "react";
import { LFLink } from "@/components/lf/lfRouter";
import { CalendarDays, Loader2, Repeat } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLakeFreshZones } from "@/hooks/useLakeFresh";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const LakeFreshSubscribe = () => {
  const { user } = useAuth();
  const { data: zones, isLoading: zonesLoading, error: zonesError, refetch: refetchZones } = useLakeFreshZones();
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  const [form, setForm] = useState({
    plan: "weekly",
    quantity_kg: "1",
    preparation: "whole",
    zone_id: "",
    customer_name: (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "",
    customer_phone: (user?.user_metadata?.phone as string) || "",
    customer_email: user?.email || "",
    notes: "",
  });

  useEffect(() => {
    if (!form.zone_id && zones && zones.length > 0) setForm((f) => ({ ...f, zone_id: zones[0].id }));
  }, [zones, form.zone_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Consent required", description: "You must consent to recurring charges.", variant: "destructive" });
      return;
    }
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("lf_subscriptions").insert({
        brand_id: LF_BRAND_ID,
        user_id: user?.id || null,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        plan: form.plan,
        delivery_zone_id: form.zone_id || null,
        quantity_kg: Number(form.quantity_kg),
        preparation: form.preparation,
        status: "pending_consent",
        consent_given: true,
        consent_given_at: new Date().toISOString(),
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Subscription requested", description: "We will confirm your plan and set up billing." });
    } catch (err) {
      toast({ title: "Request failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Subscribe | Lake Fresh Fish Mart" description="Lake Fresh fish subscription plans." />
      <div className="container max-w-2xl py-10 sm:py-14">
        <LFLink to="/lf" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#073B78]">
          <Repeat className="h-3.5 w-3.5" /> Lake Fresh
        </LFLink>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78]">SUBSCRIBE</h1>
        <p className="mt-2 text-sm text-gray-500">
          Get fresh fish delivered on a recurring schedule. No automatic charges without your consent.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Plan</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quantity (kg)</label>
              <input type="number" step="0.5" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Preparation</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.preparation} onChange={(e) => setForm({ ...form, preparation: e.target.value })}>
                <option value="whole">Whole</option>
                <option value="cleaned">Cleaned</option>
                <option value="portioned">Portioned</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Delivery zone</label>
            {zonesLoading && <p className="mt-1 text-xs text-gray-500">Loading delivery areas…</p>}
            {zonesError && (
              <div className="mt-1 text-xs text-red-600">
                Could not load delivery areas.{" "}
                <button type="button" onClick={() => refetchZones()} className="font-bold underline">Retry</button>
              </div>
            )}
            {!zonesLoading && !zonesError && (
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })}>
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Name *</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone *</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
            <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Notes</label>
            <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>
              I consent to recurring charges for this subscription plan. I understand I can pause or cancel at any time.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !consent}
            className="inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            Request subscription
          </button>
        </form>
      </div>
    </div>
  );
};

export default LakeFreshSubscribe;
