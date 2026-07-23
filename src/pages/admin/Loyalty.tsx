import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, Gift, Users, TrendingUp, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  points_per_mwk: number;
  points_to_redeem: number;
  reward_value_mwk: number;
  is_active: boolean;
}

interface LoyaltyTier {
  id: string;
  name: string;
  min_lifetime_points: number;
  points_multiplier: number;
  discount_percent: number;
  free_delivery: boolean;
}

const AdminLoyalty = () => {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total_members: 0, total_points: 0, redeemed_points: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progRes, tierRes, statsRes] = await Promise.all([
        supabase.from("loyalty_programs").select("*").order("created_at", { ascending: false }),
        supabase.from("loyalty_tiers").select("*").order("min_lifetime_points", { ascending: true }),
        supabase.from("customer_loyalty").select("count, sum(available_points), sum(redeemed_points)"),
      ]);

      setPrograms(progRes.data || []);
      setTiers(tierRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveProgram = async (program: Partial<LoyaltyProgram>) => {
    setSaving(true);
    try {
      if (program.id) {
        await supabase.from("loyalty_programs").update(program).eq("id", program.id);
        toast({ title: "Program updated!" });
      } else {
        await supabase.from("loyalty_programs").insert(program);
        toast({ title: "Program created!" });
      }
      fetchData();
    } catch (err) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveTier = async (tier: Partial<LoyaltyTier>) => {
    setSaving(true);
    try {
      if (tier.id) {
        await supabase.from("loyalty_tiers").update(tier).eq("id", tier.id);
        toast({ title: "Tier updated!" });
      } else {
        await supabase.from("loyalty_tiers").insert(tier);
        toast({ title: "Tier created!" });
      }
      fetchData();
    } catch (err) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (program: LoyaltyProgram) => {
    await supabase.from("loyalty_programs").update({ is_active: !program.is_active }).eq("id", program.id);
    fetchData();
  };

  const deleteProgram = async (id: string) => {
    if (confirm("Delete this program?")) {
      await supabase.from("loyalty_programs").delete().eq("id", id);
      fetchData();
      toast({ title: "Program deleted" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl">Loyalty & Rewards</h1>
        <p className="text-gray-500">Manage rewards programs and tiers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <Users className="h-8 w-8 text-gray-900 mb-2" />
            <p className="text-2xl font-bold">{stats.total_members}</p>
            <p className="text-sm text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Gift className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.total_points.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Points Issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <TrendingUp className="h-8 w-8 text-gray-900 mb-2" />
            <p className="text-2xl font-bold">{stats.redeemed_points.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Points Redeemed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Award className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{tiers.length}</p>
            <p className="text-sm text-gray-500">Active Tiers</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reward Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((prog) => (
              <div key={prog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{prog.name}</p>
                  <p className="text-sm text-gray-500">{prog.description}</p>
                  <p className="text-xs mt-1">
                    Earn 1 pt per MK {prog.points_per_mwk.toLocaleString()} â€¢ 
                    Redeem {prog.points_to_redeem} pts = MK {prog.reward_value_mwk.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={prog.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleActive(prog)}
                  >
                    {prog.is_active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProgram(prog.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tier Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold capitalize">{tier.name}</p>
                <p className="text-sm text-gray-500">{tier.min_lifetime_points.toLocaleString()}+ points</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>{tier.points_multiplier}x points multiplier</p>
                  {tier.discount_percent > 0 && <p className="text-green-600">{tier.discount_percent}% discount</p>}
                  {tier.free_delivery && <p className="text-green-600">Free delivery</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Set up reward programs - how customers earn points per MWK spent</li>
            <li>Define tiers - bronze, silver, gold, platinum with benefits</li>
            <li>Customers automatically earn points on purchases</li>
            <li>Points are tracked in customer_loyalty table</li>
            <li>Customers can view their points at /rewards page</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoyalty;