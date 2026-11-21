import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LFLink } from "@/components/lf/lfRouter";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle } from "lucide-react";

type TicketMessage = {
  id: string;
  actor_role: "customer" | "staff";
  body: string;
  created_at: string;
};

type TicketDetail = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  first_response_at: string | null;
  messages: TicketMessage[];
};

const LakeFreshSupport = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order") || "";
  const initialTicketId = searchParams.get("ticket") || "";
  const [ticketId, setTicketId] = useState(initialTicketId);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [subject, setSubject] = useState("I need help with my order");
  const [category, setCategory] = useState("delivery");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const orderToken = orderId ? sessionStorage.getItem(`lf_order_access_${orderId}`) : "";
  const ticketToken = ticketId ? sessionStorage.getItem(`lf_support_access_${ticketId}`) : "";

  const loadTicket = async (id: string) => {
    const token = sessionStorage.getItem(`lf_support_access_${id}`);
    const { data, error } = await supabase.rpc("lf_public_support_ticket", {
      p_ticket_id: id,
      p_access_token: token || null,
    });
    if (error) throw new Error(error.message);
    const result = data as { ok?: boolean; ticket?: TicketDetail; reason?: string };
    if (!result?.ok || !result.ticket) throw new Error("We could not open this help request.");
    setTicket({
      ...result.ticket,
      messages: result.ticket.messages || [],
    });
  };

  useEffect(() => {
    if (!ticketId) return;
    void loadTicket(ticketId).catch((err) => {
      toast({
        title: "Help request not available",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    });
  }, [ticketId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("lf_customer_open_ticket", {
        p_order_id: orderId || null,
        p_access_token: orderToken || null,
        p_subject: subject,
        p_category: category,
        p_priority: priority,
        p_body: body,
      });
      if (error) throw new Error(error.message);
      const result = data as { ok?: boolean; ticket_id?: string; access_token?: string | null; reason?: string };
      if (!result?.ok || !result.ticket_id) {
        const reasons: Record<string, string> = {
          unauthorized: "Open this page from your order so we can confirm it is yours.",
          invalid_message: "Add a short subject and a message.",
          not_found: "We could not find that order.",
        };
        throw new Error(reasons[result?.reason || ""] || "We could not send your message.");
      }
      if (result.access_token) {
        sessionStorage.setItem(`lf_support_access_${result.ticket_id}`, result.access_token);
      }
      setTicketId(result.ticket_id);
      setBody("");
      toast({ title: "Message sent", description: "We will reply here and by email." });
    } catch (err) {
      toast({
        title: "Could not send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticketId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("lf_customer_reply_ticket", {
        p_ticket_id: ticketId,
        p_access_token: ticketToken || null,
        p_body: reply,
      });
      if (error) throw new Error(error.message);
      const result = data as { ok?: boolean };
      if (!result?.ok) throw new Error("We could not send your reply.");
      setReply("");
      await loadTicket(ticketId);
      toast({ title: "Reply sent" });
    } catch (err) {
      toast({
        title: "Could not send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO
        brand="lake-fresh"
        title="Get Help | Lake Fresh Fish Mart"
        description="Ask Lake Fresh about your fish order and follow our reply."
      />
      <div className="container max-w-2xl py-8 sm:py-12">
        <LFLink
          to={orderId ? `/lf/orders/${orderId}` : "/lf"}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60 hover:text-[#073B78]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </LFLink>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-[#073B78]">Get help</h1>
        <p className="mt-2 text-sm text-[#073B78]/70">
          Tell us what you need. We keep every message here so you can follow our reply.
        </p>

        {ticket ? (
          <section className="mt-6 rounded-2xl border border-[#08A9E8]/30 bg-[#EAF6FB]/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Help request</p>
                <p className="mt-1 text-sm font-bold text-[#073B78]">{ticket.subject}</p>
              </div>
              <span className="rounded-full border border-[#08A9E8]/30 bg-white px-3 py-1 text-[10px] font-bold uppercase text-[#073B78]">
                {ticket.status}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl p-3 text-sm ${
                    message.actor_role === "staff"
                      ? "bg-[#073B78] text-white"
                      : "bg-white text-[#073B78] border border-gray-200"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    {message.actor_role === "staff" ? "Lake Fresh" : "You"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendReply} className="mt-5 space-y-3">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={3}
                maxLength={4000}
                required
                placeholder="Write your message"
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#073B78] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" /> Send reply
              </button>
            </form>
          </section>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#073B78]">What do you need help with?</label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={120}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-[#073B78]">Topic</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
                >
                  <option value="delivery">Delivery</option>
                  <option value="fish">Fish quality</option>
                  <option value="payment">Payment</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#073B78]">How soon?</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
                >
                  <option value="normal">Today</option>
                  <option value="urgent">Right now</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#073B78]">Your message</label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                maxLength={4000}
                required
                placeholder="Tell us what happened"
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#073B78] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" /> Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LakeFreshSupport;
