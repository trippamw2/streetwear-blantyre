import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ReferralWithUser {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  order_id: string | null;
  referee_reward: number;
  referrer_reward: number;
  status: string;
  created_at: string;
  referrer?: { email: string; id: string };
  referee?: { email: string; id: string };
}

interface ReferralCodeWithUser {
  id: string;
  user_id: string;
  code: string;
  rewards_points: number;
  rewards_redeemed: number;
  max_referrals: number;
  created_at: string;
  user?: { email: string };
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralWithUser[]>([]);
  const [codes, setCodes] = useState<ReferralCodeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: refs } = await supabase
        .from("referral_transactions")
        .select("*, referrer:user_id(email), referee:referee_id(email)")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: codes } = await supabase
        .from("user_referral_codes")
        .select("*, user:user_id(email)")
        .order("created_at", { ascending: false })
        .limit(50);

      setReferrals(refs || []);
      setCodes(codes || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("referral_transactions")
      .update({ status })
      .eq("id", id);
    loadData();
  };

  const addRewardPoints = async (userId: string, points: number) => {
    const { data: existing } = await supabase
      .from("customer_loyalty")
      .select("available_points")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("customer_loyalty")
        .update({ available_points: existing.available_points + points })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("customer_loyalty")
        .insert({ user_id: userId, available_points: points, total_points: points });
    }

    await supabase.from("loyalty_transactions").insert({
      user_id: userId,
      points,
      type: "referral_bonus",
      description: "Referral bonus reward",
    });

    loadData();
  };

  const filteredReferrals = referrals.filter(r =>
    r.referral_code.toLowerCase().includes(search.toLowerCase()) ||
    r.referrer?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.referee?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === "pending").length,
    completed: referrals.filter(r => r.status === "completed").length,
    totalReferrerRewards: referrals
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + (r.referrer_reward || 500), 0),
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Referral Management</h1>
            <p className="text-muted-foreground">Track referrals and reward referrers</p>
          </div>
          <Button onClick={loadData} variant="outline">Refresh</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Rewards Given</p>
            <p className="text-2xl font-bold">{stats.totalReferrerRewards} pts</p>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search by code or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {/* Referrals Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Referrals</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No referrals yet. Share the referral program to get started!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Code</th>
                  <th className="text-left p-3 text-sm font-medium">Referrer</th>
                  <th className="text-left p-3 text-sm font-medium">Referee</th>
                  <th className="text-left p-3 text-sm font-medium">Order</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="border-t">
                    <td className="p-3">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{ref.referral_code}</code>
                    </td>
                    <td className="p-3 text-sm">
                      {ref.referrer?.email || ref.referrer_id.slice(0, 8)}
                    </td>
                    <td className="p-3 text-sm">
                      {ref.referee?.email || ref.referee_id?.slice(0, 8)}
                    </td>
                    <td className="p-3 text-sm">
                      {ref.order_id ? (
                        <a href={`/admin/orders/${ref.order_id}`} className="text-gray-900 hover:underline">
                          {ref.order_id.slice(0, 8)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                        {ref.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {ref.status === "pending" && ref.order_id && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(ref.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        {ref.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addRewardPoints(ref.referee_id, ref.referee_reward)}
                          >
                            +{ref.referee_reward} pts
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Referral Codes */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">User Referral Codes</h2>
          </div>
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Code</th>
                <th className="text-left p-3 text-sm font-medium">User</th>
                <th className="text-left p-3 text-sm font-medium">Rewards Earned</th>
                <th className="text-left p-3 text-sm font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-t">
                  <td className="p-3">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {code.code}
                    </code>
                  </td>
                  <td className="p-3 text-sm">{code.user?.email || code.user_id.slice(0, 8)}</td>
                  <td className="p-3 text-sm">{code.rewards_redeemed} pts</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}