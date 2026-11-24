import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { sendBrandBroadcast } from "@/lib/brevo";
import { adminBrandId, useAdminBrand } from "@/lib/adminBrand";
import { Loader2, Mail, MessageCircle, Send, Sparkles, Trash2, Users } from "lucide-react";

type Channel = "email" | "whatsapp";
type Audience = "all_customers" | "loyalty_members" | "recent_buyers" | "pro_accounts";

interface BrandMessage {
  id: string;
  brand_id: string;
  channel: Channel;
  audience: Audience;
  subject: string | null;
  body: string;
  status: string;
  recipients_count: number;
  sent_at: string | null;
  created_at: string;
}

interface Recipient {
  email: string;
  name?: string | null;
  phone?: string | null;
}

const AUDIENCES: { value: Audience; label: string; copy: string }[] = [
  { value: "all_customers", label: "All customers", copy: "Everyone with an account on this brand." },
  { value: "loyalty_members", label: "Rewards members", copy: "Customers with a rewards balance." },
  { value: "recent_buyers", label: "Recent buyers", copy: "Customers with a paid order." },
  { value: "pro_accounts", label: "PRO accounts", copy: "Approved business accounts." },
];

const STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-[#39B54A]/10 text-[#2c6e12]",
  failed: "bg-red-50 text-red-600",
};

const AdminCommunications = () => {
  const brand = useAdminBrand();
  const brandId = adminBrandId(brand);
  const { user } = useAuth();
  const isLf = brand === "lf";

  const [messages, setMessages] = useState<BrandMessage[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel>("email");
  const [audience, setAudience] = useState<Audience>("all_customers");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("brand_messages")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.warn("Could not load messages", error.message);
    setMessages((data || []) as BrandMessage[]);
  };

  const loadRecipients = async () => {
    const { data: loyalty } = await supabase
      .from("customer_loyalty")
      .select("user_id, email")
      .eq("brand_id", brandId)
      .not("email", "is", null);

    const rows = (loyalty || []).filter((row: any) => row.email);
    const { data: profiles } = await supabase
      .from("customer_profiles")
      .select("user_id, full_name, phone")
      .eq("brand_id", brandId);

    const profileMap = new Map<string, { full_name?: string | null; phone?: string | null }>(
      (profiles || []).map((p: any) => [p.user_id as string, p]),
    );

    let userIds: Set<string> | null = null;
    if (audience === "recent_buyers") {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id")
        .eq("brand_id", brandId)
        .eq("payment_status", "paid");
      userIds = new Set((orders || []).map((o: any) => o.user_id).filter(Boolean));
    } else if (audience === "pro_accounts") {
      const { data: accounts } = await supabase
        .from("business_accounts")
        .select("user_id")
        .eq("brand_id", brandId);
      userIds = new Set((accounts || []).map((a: any) => a.user_id).filter(Boolean));
    } else if (audience === "loyalty_members") {
      userIds = new Set(rows.map((row: any) => row.user_id));
    }

    const list: Recipient[] = rows
      .filter((row: any) => !userIds || userIds.has(row.user_id))
      .map((row: any) => ({
        email: row.email,
        name: profileMap.get(row.user_id)?.full_name || null,
        phone: profileMap.get(row.user_id)?.phone || null,
      }));

    const seen = new Set<string>();
    setRecipients(list.filter((r) => (seen.has(r.email) ? false : (seen.add(r.email), true))));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMessages(), loadRecipients()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, audience]);

  const recipientCount = useMemo(() => recipients.length, [recipients]);

  const draftWithAi = async () => {
    setDrafting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch("/api/ai-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ brand, channel, audience, topic }),
      });
      if (!response.ok) throw new Error("AI drafting is unavailable right now.");
      const data = await response.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      toast({
        title: data.source === "ai" ? "Draft ready" : "Draft ready",
        description: data.source === "ai" ? "Edit anything before sending." : "Template draft added. Edit it freely.",
      });
    } catch (error) {
      toast({
        title: "Could not draft",
        description: error instanceof Error ? error.message : "Please write the message manually.",
        variant: "destructive",
      });
    } finally {
      setDrafting(false);
    }
  };

  const saveMessage = async (status: "draft" | "sent" | "failed", count = recipientCount) => {
    if (!body.trim()) {
      toast({ title: "Write a message first", variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase
      .from("brand_messages")
      .insert({
        brand_id: brandId,
        channel,
        audience,
        subject: subject.trim() || null,
        body: body.trim(),
        status,
        recipients_count: count,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return null;
    }
    await loadMessages();
    return data as BrandMessage;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const saved = await saveMessage("draft");
    setSaving(false);
    if (saved) toast({ title: "Draft saved" });
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast({ title: "No recipients", description: "This audience has no email addresses yet.", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Add a subject and message", variant: "destructive" });
      return;
    }

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const ok = await sendBrandBroadcast({
        to: recipient.email,
        toName: recipient.name || recipient.email,
        subject: subject.trim(),
        body: body.trim(),
        brand: isLf ? "lake-fresh" : "sb",
      });
      if (ok) sent += 1;
      else failed += 1;
    }

    await saveMessage(failed === recipients.length ? "failed" : "sent", sent);
    setSending(false);

    if (sent > 0) {
      toast({ title: `Sent to ${sent} ${sent === 1 ? "person" : "people"}`, description: failed ? `${failed} failed.` : "All emails accepted by Brevo." });
      setBody("");
      setSubject("");
      setTopic("");
    } else {
      toast({
        title: "Emails were not sent",
        description: "Check the Brevo API key on the server.",
        variant: "destructive",
      });
    }
  };

  const handleCopyWhatsApp = async (message?: BrandMessage) => {
    const text = message
      ? `${message.subject ? `${message.subject}\n\n` : ""}${message.body}`
      : `${subject ? `${subject}\n\n` : ""}${body}`;
    if (!text.trim()) {
      toast({ title: "Nothing to copy", variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast({ title: "Message copied", description: "Paste it into WhatsApp or your broadcast tool." });
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from("brand_messages")
      .delete()
      .eq("id", id)
      .eq("brand_id", brandId);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Deleted" });
      await loadMessages();
    }
  };

  const accent = isLf ? "#073B78" : "#0a0a0a";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Communications</h1>
          <p className="text-sm text-muted-foreground">
            {isLf ? "Lake Fresh" : "SB"} messages only. Drafts, sends and history stay in this brand.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-600">
          <Users className="h-4 w-4" /> {recipientCount} {recipientCount === 1 ? "recipient" : "recipients"}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap gap-2">
            {(["email", "whatsapp"] as Channel[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setChannel(option)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest ${
                  channel === option ? "text-white" : "bg-gray-100 text-gray-600"
                }`}
                style={channel === option ? { backgroundColor: accent } : undefined}
              >
                {option === "email" ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                {option === "email" ? "Email" : "WhatsApp"}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <Label>Audience</Label>
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
            >
              {AUDIENCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {AUDIENCES.find((option) => option.value === audience)?.copy}
            </p>
          </div>

          <div className="mt-4">
            <Label>What is this about?</Label>
            <Input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={isLf ? "Fresh Usipa landed today" : "New jersey drop this Friday"}
            />
          </div>

          <Button className="mt-3" variant="outline" onClick={draftWithAi} disabled={drafting}>
            {drafting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {drafting ? "Drafting" : "Draft with AI"}
          </Button>

          <div className="mt-4 space-y-3">
            {channel === "email" && (
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={9}
                placeholder="Write the message, or use Draft with AI."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {channel === "email" ? (
              <Button onClick={handleSendEmail} disabled={sending || recipientCount === 0}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sending ? "Sending" : `Send to ${recipientCount}`}
              </Button>
            ) : (
              <Button onClick={() => handleCopyWhatsApp()}>
                <MessageCircle className="mr-2 h-4 w-4" /> Copy for WhatsApp
              </Button>
            )}
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save draft
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-display text-lg font-bold">Recipients</h2>
          {loading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading
            </p>
          ) : recipients.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              No email addresses for this audience yet. Customers get an address on their first rewards record.
            </p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
              {recipients.slice(0, 50).map((recipient) => (
                <li key={recipient.email} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">{recipient.name || recipient.email}</p>
                    <p className="truncate text-[11px] text-gray-500">{recipient.email}</p>
                  </div>
                  {recipient.phone && channel === "whatsapp" && (
                    <a
                      href={`https://wa.me/${recipient.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded bg-[#25D366] px-2 py-1 text-[10px] font-bold uppercase text-white"
                    >
                      Chat
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {recipients.length > 50 && (
            <p className="mt-2 text-[11px] text-gray-500">Showing the first 50.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-lg font-bold">Message history</h2>
          <span className="text-xs text-gray-500">{messages.length} saved</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Channel</th>
                <th className="px-4 py-3 text-left">Audience</th>
                <th className="px-4 py-3 text-right">Sent to</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id} className="border-t align-top">
                  <td className="max-w-[280px] px-4 py-3">
                    <p className="font-semibold text-gray-800">{message.subject || "WhatsApp message"}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">{message.body}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{message.channel}</td>
                  <td className="px-4 py-3 text-xs capitalize">{message.audience.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-right">{message.recipients_count}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${STATUS_TONE[message.status] || "bg-gray-100 text-gray-600"}`}>
                      {message.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(message.sent_at || message.created_at).toLocaleDateString("en-GB", {
                      timeZone: "Africa/Blantyre",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setChannel(message.channel);
                          setAudience(message.audience);
                          setSubject(message.subject || "");
                          setBody(message.body);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="rounded px-2 py-1 text-[10px] font-bold uppercase text-[#073B78] hover:bg-gray-100"
                      >
                        Reuse
                      </button>
                      <button
                        onClick={() => handleCopyWhatsApp(message)}
                        className="rounded px-2 py-1 text-[10px] font-bold uppercase text-gray-600 hover:bg-gray-100"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No messages yet. Draft one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunications;
