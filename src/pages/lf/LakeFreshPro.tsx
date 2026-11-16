import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Loader2, Send } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const LakeFreshPro = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"register" | "quote">("register");
  const [submitting, setSubmitting] = useState(false);

  const [reg, setReg] = useState({
    company_name: "",
    business_type: "",
    tax_id: "",
    contact_name: "",
    phone: "",
    location: "",
    notes: "",
  });

  const [quote, setQuote] = useState({
    requester_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
    requester_email: user?.email || "",
    requester_phone: "",
    notes: "",
    items: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg.company_name.trim() || !reg.phone.trim()) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_accounts").insert({
        brand_id: LF_BRAND_ID,
        user_id: user?.id || null,
        company_name: reg.company_name.trim(),
        business_type: reg.business_type.trim() || null,
        tax_id: reg.tax_id.trim() || null,
        contact_name: reg.contact_name.trim() || null,
        phone: reg.phone.trim(),
        location: reg.location.trim() || null,
        notes: reg.notes.trim() || null,
        is_active: true,
        approval_status: "pending",
      });
      if (error) throw error;
      toast({ title: "Registration submitted", description: "We will review your business account." });
      setReg({ company_name: "", business_type: "", tax_id: "", contact_name: "", phone: "", location: "", notes: "" });
    } catch (err) {
      toast({ title: "Registration failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.requester_name.trim() || !quote.items.trim()) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("lf_quotes")
        .insert({
          brand_id: LF_BRAND_ID,
          requester_name: quote.requester_name.trim(),
          requester_email: quote.requester_email.trim() || null,
          requester_phone: quote.requester_phone.trim() || null,
          notes: quote.notes.trim() || null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const lines = quote.items.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && data) {
        const rows = lines.map((line) => {
          const [name, qty, unit] = line.split("|").map((s) => s.trim());
          return {
            quote_id: data.id,
            product_type: "other",
            product_name: name,
            quantity: Number(qty || 1),
            unit: unit || null,
          };
        });
        await supabase.from("lf_quote_items").insert(rows);
      }

      toast({ title: "Quote requested", description: "We will get back to you shortly." });
      setQuote({ ...quote, notes: "", items: "" });
    } catch (err) {
      toast({ title: "Quote request failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="LakeFresh PRO — Wholesale & Business Supply" description="Lake Fresh PRO for restaurants, hotels and food businesses." />
      <div className="container max-w-3xl py-10 sm:py-14">
        <Link to="/lf" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#0a2540]">
          <Building2 className="h-3.5 w-3.5" /> Lake Fresh
        </Link>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#0a2540]">LAKEFRESH PRO</h1>
        <p className="mt-2 text-sm text-gray-500">
          Wholesale fish supply for restaurants, hotels, lodges, caterers and food businesses.
        </p>

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTab("register")}
            className={`px-4 py-2 text-sm font-bold ${tab === "register" ? "border-b-2 border-[#0a2540] text-[#0a2540]" : "text-gray-500"}`}
          >
            Business registration
          </button>
          <button
            onClick={() => setTab("quote")}
            className={`px-4 py-2 text-sm font-bold ${tab === "quote" ? "border-b-2 border-[#0a2540] text-[#0a2540]" : "text-gray-500"}`}
          >
            Request a quote
          </button>
        </div>

        {tab === "register" ? (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Company name *</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.company_name} onChange={(e) => setReg({ ...reg, company_name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Business type</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.business_type} onChange={(e) => setReg({ ...reg, business_type: e.target.value })} placeholder="Restaurant, hotel, caterer…" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tax ID</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.tax_id} onChange={(e) => setReg({ ...reg, tax_id: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Contact name</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.contact_name} onChange={(e) => setReg({ ...reg, contact_name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone *</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Location</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reg.location} onChange={(e) => setReg({ ...reg, location: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Notes</label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={reg.notes} onChange={(e) => setReg({ ...reg, notes: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0a2540] px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Submit registration
            </button>
          </form>
        ) : (
          <form onSubmit={handleQuote} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Name *</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={quote.requester_name} onChange={(e) => setQuote({ ...quote, requester_name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={quote.requester_email} onChange={(e) => setQuote({ ...quote, requester_email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={quote.requester_phone} onChange={(e) => setQuote({ ...quote, requester_phone: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Items (one per line: Name | qty | unit)</label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={5} value={quote.items} onChange={(e) => setQuote({ ...quote, items: e.target.value })} placeholder="Fresh Chambo | 20 | kg" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Notes</label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={quote.notes} onChange={(e) => setQuote({ ...quote, notes: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0a2540] px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Request quote
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LakeFreshPro;
