import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatMWK } from "@/data/products";
import { Users, MessageCircle, Send, Search, Filter, Download, Phone, Mail, ShoppingCart, Calendar, Loader2, Check, Package, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  message: string;
  sent_count: number;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  whatsapp_consent: boolean;
  subscribed_at: string;
  is_active: boolean;
}

const AdminCRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "new" | "inactive">("all");
  const [activeTab, setActiveTab] = useState<"customers" | "subscribers">("customers");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignType, setCampaignType] = useState<"whatsapp" | "email">("whatsapp");
  const [sending, setSending] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    message: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from("customer_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    setSubscribers(data || []);
  };

  const fetchCustomers = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_phone, customer_name, total_mwk, created_at")
      .order("created_at", { ascending: false });
    
    if (orders) {
      const phoneMap = new Map<string, Customer>();
      
      orders.forEach(order => {
        const phone = order.customer_phone;
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, {
            id: phone,
            user_id: "",
            email: "",
            full_name: order.customer_name || "Unknown",
            phone: phone,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
            created_at: new Date().toISOString(),
          });
        }
        const customer = phoneMap.get(phone)!;
        customer.total_orders++;
        customer.total_spent += order.total_mwk || 0;
        if (!customer.last_order_date || order.created_at > customer.last_order_date) {
          customer.last_order_date = order.created_at;
        }
      });
      
      const customersData = Array.from(phoneMap.values()).sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(customersData);
    }
    setLoading(false);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase.from("whatsapp_campaigns").select("*").order("created_at", { ascending: false }).limit(10);
    setCampaigns(data || []);
  };

  const sendCampaign = async () => {
    if (!campaignForm.message.trim()) return;
    setSending(true);

    try {
      const targetSubscribers = activeTab === "subscribers" 
        ? subscribers.filter(s => s.is_active && (campaignType === "email" || s.whatsapp_consent))
        : customers.filter(c => c.phone);

      const validTargets = targetSubscribers.filter(t => 
        campaignType === "email" ? "email" in t : "phone" in t && t.phone
      );

      // Save campaign
      await supabase.from("whatsapp_campaigns").insert({
        name: campaignForm.name || `Campaign ${Date.now()}`,
        message: campaignForm.message,
        sent_count: validTargets.length,
      });

      if (campaignType === "email") {
        // Send email campaign via Brevo
        const { sendEmail } = await import("@/lib/brevo");
        let sent = 0;
        for (const sub of validTargets) {
          if (sub.email) {
            await sendEmail(sub.email, campaignForm.name || "Streetwear Blantyre Update", `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #FF6B00;">💫 Streetwear Blantyre Update</h2>
                <p>${campaignForm.message.replace(/\n/g, "<br/>")}</p>
                <p style="margin-top: 20px; color: #666;">Thanks for being a valued customer!</p>
                <p>- Streetwear Blantyre Team</p>
              </div>
            `);
            sent++;
            await new Promise(r => setTimeout(r, 200));
          }
        }
        toast({ title: `Email campaign sent to ${sent} subscribers!` });
      } else {
        // WhatsApp campaign
        let sent = 0;
        for (const customer of validTargets) {
          if (customer.phone) {
            const phone = customer.phone.replace(/[^0-9]/g, "");
            const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
            
            const msg = `💫 *Streetwear Blantyre Update* 💫

${campaignForm.message}

Thanks for being a valued customer!

- Streetwear Blantyre Team`;
            
            window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
            sent++;
            await new Promise(r => setTimeout(r, 500));
          }
        }
        toast({ title: `WhatsApp campaign opened for ${sent} contacts!` });
      }

      setCampaignOpen(false);
      setCampaignForm({ name: "", message: "" });
      fetchCampaigns();
    } catch {
      toast({ title: "Error sending campaign", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getFilteredCustomers = () => {
    let filtered = customers;
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.full_name.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s) ||
        c.phone?.includes(s)
      );
    }

    switch (filter) {
      case "vip":
        filtered = filtered.filter(c => c.total_spent >= 50000);
        break;
      case "new":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(c => new Date(c.created_at) >= thirtyDaysAgo);
        break;
      case "inactive":
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        filtered = filtered.filter(c => !c.last_order_date || new Date(c.last_order_date) < ninetyDaysAgo);
        break;
    }

    return filtered;
  };

  const exportCustomers = () => {
    const data = getFilteredCustomers().map(c => ({
      Name: c.full_name,
      Email: c.email,
      Phone: c.phone,
      "Total Orders": c.total_orders,
      "Total Spent": c.total_spent,
      "Last Order": c.last_order_date || "Never",
    }));

    const csv = Object.keys(data[0] || {}).join(",") + "\n" + data.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streetwear-blantyre-customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredCustomers = getFilteredCustomers();
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">CRM</h1>
          <p className="text-gray-500">Customer management & WhatsApp marketing</p>
        </div>
        <Button onClick={() => setCampaignOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Send className="h-4 w-4" /> Send Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-sm text-gray-500">Total Customers</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMWK(totalSpent)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.reduce((s, c) => s + c.total_orders, 0)}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMWK(customers.length > 0 ? Math.round(totalSpent / customers.length) : 0)}</p>
              <p className="text-sm text-gray-500">Avg Order Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("customers")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "customers" ? "bg-gray-900 text-white" : "bg-card border border-border"}`}>
          <Users className="h-4 w-4 inline mr-2" /> Customers ({customers.length})
        </button>
        <button onClick={() => setActiveTab("subscribers")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "subscribers" ? "bg-gray-900 text-white" : "bg-card border border-border"}`}>
          <Mail className="h-4 w-4 inline mr-2" /> Subscribers ({subscribers.length})
        </button>
      </div>

      {/* Filters */}
      {activeTab === "customers" && (
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === "all" ? "bg-gray-900 text-white" : "bg-card border border-border"}`}>
            All
          </button>
          <button onClick={() => setFilter("vip")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === "vip" ? "bg-orange-500 text-white" : "bg-card border border-border"}`}>
            VIP (50K+)
          </button>
          <button onClick={() => setFilter("new")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === "new" ? "bg-blue-500 text-white" : "bg-card border border-border"}`}>
            New (30 days)
          </button>
          <button onClick={() => setFilter("inactive")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === "inactive" ? "bg-red-500 text-white" : "bg-card border border-border"}`}>
            Inactive
          </button>
        </div>
<Button variant="outline" onClick={exportCustomers}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>)}

      {/* Customer List */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Customer</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Orders</th>
              <th className="text-left p-4 font-medium">Total Spent</th>
              <th className="text-left p-4 font-medium">Last Order</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.slice(0, 50).map((customer) => (
              <tr key={customer.id} className="border-t border-gray-100">
                <td className="p-4">
                  <div>
                    <p className="font-medium">{customer.full_name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                      {customer.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4">{customer.total_orders}</td>
                <td className="p-4 font-medium">{formatMWK(customer.total_spent)}</td>
                <td className="p-4 text-sm text-gray-500">
                  {customer.last_order_date ? format(new Date(customer.last_order_date), "PP") : "Never"}
                </td>
                <td className="p-4 text-right">
                  {customer.phone && (
                    <Button variant="outline" size="sm" onClick={() => {
                      const phone = customer.phone.replace(/[^0-9]/g, "");
                      const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
                      window.open(`https://wa.me/${waPhone}`, "_blank");
                    }}>
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-gray-500">No customers found</div>
        )}
      </div>

      {/* Subscribers Table */}
      {activeTab === "subscribers" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Phone</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">WhatsApp</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Subscribed</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <a href={`mailto:${sub.email}`} className="text-blue-600 hover:underline">{sub.email}</a>
                  </td>
                  <td className="p-4">{sub.name || "-"}</td>
                  <td className="p-4">{sub.phone || "-"}</td>
                  <td className="p-4">
                    {sub.whatsapp_consent && sub.phone ? (
                      <Button variant="outline" size="sm" onClick={() => {
                        const phone = sub.phone.replace(/[^0-9]/g, "");
                        const waPhone = phone.startsWith("0") ? `265${phone.slice(1)}` : phone;
                        window.open(`https://wa.me/${waPhone}`, "_blank");
                      }}>
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{format(new Date(sub.subscribed_at), "PP")}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {sub.is_active ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => {
                      window.open(`mailto:${sub.email}`);
                    }}>
                      <Mail className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscribers.length === 0 && (
            <div className="p-8 text-center text-gray-500">No subscribers yet</div>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      {campaignOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4">
            <h2 className="font-bold text-xl">
              {campaignType === "email" ? "Send Email Campaign" : "Send WhatsApp Campaign"}
            </h2>
            
            {/* Channel Selection */}
            <div className="flex gap-2">
              <button onClick={() => setCampaignType("whatsapp")} className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${campaignType === "whatsapp" ? "bg-green-600 text-white" : "bg-gray-100"}`}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <button onClick={() => setCampaignType("email")} className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${campaignType === "email" ? "bg-orange-500 text-white" : "bg-gray-100"}`}>
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>

            <p className="text-sm text-gray-500">
              {campaignType === "email" 
                ? `Send to ${subscribers.filter(s => s.is_active).length} subscribers with email consent`
                : `Open WhatsApp for ${customers.filter(c => c.phone).length} customers`
              }
            </p>
            
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Flash Sale Announcement"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Message *</Label>
              <textarea
                value={campaignForm.message}
                onChange={(e) => setCampaignForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Enter your message to customers..."
                className="w-full h-32 p-3 rounded-lg border border-gray-200"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCampaignOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={sendCampaign} disabled={sending || !campaignForm.message.trim()} className="flex-1 bg-green-600">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCRM;