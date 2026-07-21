import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";
import { Link } from "react-router-dom";
import { Package, DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Wallet, Banknote, Receipt } from "lucide-react";

interface Stats {
  totalOrders: number;
  grossOrders: number;
  netRevenue: number;
  netProfit: number;
  pendingOrders: number;
  paidOrders: number;
  totalCustomers: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  note?: string;
}

const TRANSPORT_COST = 4000;
const PAYCHANGU_FEE_PERCENT = 4;

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    grossOrders: 0,
    netRevenue: 0,
    netProfit: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Get all orders
    const { data: allOrders } = await supabase.from("orders").select("id, total_mwk, delivery_fee_mwk, is_paid, payment_method, status");
    
    if (allOrders) {
      // Gross orders - all orders total
      const grossOrders = allOrders.reduce((sum, o) => sum + (o.total_mwk || 0), 0);
      
      // Paid orders only
      const paidOrdersList = allOrders.filter(o => o.is_paid === true);
      const paidOrders = paidOrdersList.length;
      
      // Net Revenue - paid orders subtotal (without delivery fees)
      const netRevenue = paidOrdersList.reduce((sum, o) => sum + ((o.total_mwk || 0) - (o.delivery_fee_mwk || 0)), 0);
      
      // Calculate fees and profit
      let totalDeliveryFees = 0;
      let totalPaychanguFees = 0;
      
      paidOrdersList.forEach(order => {
        totalDeliveryFees += order.delivery_fee_mwk || 0;
        // Only apply PayChangu fee for paychangu payments
        if (order.payment_method === "paychangu") {
          const orderSubtotal = (order.total_mwk || 0) - (order.delivery_fee_mwk || 0);
          totalPaychanguFees += Math.round(orderSubtotal * (PAYCHANGU_FEE_PERCENT / 100));
        }
      });
      
      // Net Profit = Revenue - Delivery Fees - Transport Cost - PayChangu Fees
      const transportCost = paidOrders * TRANSPORT_COST;
      const netProfit = netRevenue - totalDeliveryFees - transportCost - totalPaychanguFees;
      
      // Get unique customers
      const uniquePhones = new Set(allOrders.map(o => o.customer_phone).filter(Boolean));
      
      // Pending orders
      const pendingOrders = allOrders.filter(o => o.status === "new" || o.status === "confirmed").length;
      
      setStats({
        totalOrders: allOrders.length,
        grossOrders,
        netRevenue,
        netProfit: Math.max(0, netProfit),
        pendingOrders,
        paidOrders,
        totalCustomers: uniquePhones.size,
      });
    }
    setLoading(false);
  };

  const statCards = [
    { 
      label: "Total Orders", 
      value: stats.totalOrders.toString(), 
      icon: Package,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    { 
      label: "Gross Orders", 
      value: formatMWK(stats.grossOrders), 
      icon: Receipt,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    { 
      label: "Net Revenue", 
      value: formatMWK(stats.netRevenue), 
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      note: "(paid only)",
    },
    { 
      label: "Net Profit", 
      value: formatMWK(stats.netProfit), 
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-600/10",
      note: "(-delivery -transport)",
    },
    { 
      label: "Paid Orders", 
      value: stats.paidOrders.toString(), 
      icon: Wallet,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    { 
      label: "Pending", 
      value: stats.pendingOrders.toString(), 
      icon: TrendingUp,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    { 
      label: "Customers", 
      value: stats.totalCustomers.toString(), 
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border/60 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display font-bold text-2xl mt-1">{stat.value}</p>
                {stat.note && <p className="text-xs text-muted-foreground mt-0.5">{stat.note}</p>}
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/admin/orders"
          className="flex items-center justify-between p-6 bg-card border border-border/60 rounded-2xl hover:border-primary/50 transition-colors"
        >
          <div>
            <p className="font-display font-semibold">Manage Orders</p>
            <p className="text-sm text-muted-foreground">View and update order status</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
        </Link>
        
        <Link
          to="/admin/products"
          className="flex items-center justify-between p-6 bg-card border border-border/60 rounded-2xl hover:border-primary/50 transition-colors"
        >
          <div>
            <p className="font-display font-semibold">Manage Products</p>
            <p className="text-sm text-muted-foreground">Add or edit products</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent Orders Preview */}
      <RecentOrders />
    </div>
  );
};

const RecentOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, status, total_mwk, created_at, customer_name")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setOrders(data || []));
  }, []);

  const statusColors: Record<string, string> = {
    new: "bg-accent",
    confirmed: "bg-primary",
    dispatched: "bg-purple-500",
    delivered: "bg-green-500",
    cancelled: "bg-destructive",
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold">Recent Orders</h2>
        <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
      </div>
      
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No orders yet</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/orders?order=${order.id}`}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div>
                <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMWK(order.total_mwk)}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusColors[order.status] || "bg-gray-500"}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;