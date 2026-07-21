import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  points_per_mwk: number;
  points_to_redeem: number;
  reward_value_mwk: number;
}

interface LoyaltyTier {
  name: string;
  min_lifetime_points: number;
  points_multiplier: number;
  discount_percent: number;
  free_delivery: boolean;
}

interface CustomerLoyalty {
  id: string;
  user_id: string;
  email: string;
  total_points: number;
  available_points: number;
  redeemed_points: number;
  lifetime_spent_mwk: number;
  tier: string;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

export function useLoyalty(userId?: string, userEmail?: string) {
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null);
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch customer loyalty
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (loyaltyError && loyaltyError.code !== "PGRST116") {
        throw loyaltyError;
      }

      if (loyaltyData) {
        setLoyalty(loyaltyData);
      } else {
        // Create loyalty record if not exists
        const { data: newLoyalty, error: createError } = await supabase
          .from("customer_loyalty")
          .insert({
            user_id: userId,
            email: userEmail || null,
            total_points: 0,
            available_points: 0,
            redeemed_points: 0,
            lifetime_spent_mwk: 0,
            tier: "bronze",
          })
          .select()
          .single();

        if (createError) throw createError;
        setLoyalty(newLoyalty);
      }

      // Fetch active program
      const { data: programData, error: programError } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("is_active", true)
        .single();
      if (programError) {
        console.error("Program fetch error:", programError);
      }
      setProgram(programData);

      // Fetch tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .order("min_lifetime_points", { ascending: true });
      if (tiersError) {
        console.error("Tiers fetch error:", tiersError);
      }
      setTiers(tiersData || []);

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (txError) {
        console.error("Transactions fetch error:", txError);
      }
      setTransactions(txData || []);
    } catch (err) {
      console.error("Loyalty fetch error:", err);
      setError("Failed to load loyalty");
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  // Earn points after purchase
  const earnPoints = useCallback(async (orderId: string, orderTotal: number) => {
    if (!userId || !program) return null;

    const points = Math.floor(orderTotal / program.points_per_mwk);
    if (points <= 0) return null;

    try {
      // Get current loyalty
      const { data: current } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", userId)
        .single();

      const newTotal = (current?.total_points || 0) + points;
      const newAvailable = (current?.available_points || 0) + points;
      const tier = calculateTier(newTotal);

      // Update loyalty
      await supabase
        .from("customer_loyalty")
        .upsert({
          user_id: userId,
          email: userEmail || current?.email,
          total_points: newTotal,
          available_points: newAvailable,
          tier,
          lifetime_spent_mwk: (current?.lifetime_spent_mwk || 0) + orderTotal,
          last_activity_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      // Record transaction
      await supabase
        .from("loyalty_transactions")
        .insert({
          user_id: userId,
          order_id: orderId,
          points,
          type: "earned",
          description: `Earned from order`,
        });

      return points;
    } catch (err) {
      console.error("Earn points error:", err);
      return null;
    }
  }, [userId, userEmail, program]);

  // Redeem points for discount
  const redeemPoints = useCallback(async (pointsToRedeem: number, orderTotal: number) => {
    if (!userId || !program || !loyalty) return { success: false, discount: 0 };

    if (loyalty.available_points < pointsToRedeem) {
      return { success: false, error: "Not enough points", discount: 0 };
    }

    const maxRedeem = Math.floor(orderTotal / program.reward_value_mwk) * program.points_to_redeem;
    const allowedRedeem = Math.min(pointsToRedeem, maxRedeem);

    const redemptions = Math.floor(allowedRedeem / program.points_to_redeem);
    const discount = redemptions * program.reward_value_mwk;

    if (discount <= 0) {
      return { success: false, error: "Minimum points required", discount: 0 };
    }

    try {
      const newAvailable = loyalty.available_points - allowedRedeem;
      const newRedeemed = loyalty.redeemed_points + allowedRedeem;

      // Update loyalty
      await supabase
        .from("customer_loyalty")
        .update({
          available_points: newAvailable,
          redeemed_points: newRedeemed,
          last_activity_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Record transaction
      await supabase
        .from("loyalty_transactions")
        .insert({
          user_id: userId,
          points: -allowedRedeem,
          type: "redeemed",
          description: `Redeemed for ${discount} MWK discount`,
        });

      // Refresh data
      fetchLoyaltyData();

      return { success: true, discount, pointsUsed: allowedRedeem };
    } catch (err) {
      console.error("Redeem error:", err);
      return { success: false, error: "Failed to redeem", discount: 0 };
    }
  }, [userId, program, loyalty, fetchLoyaltyData]);

  const calculatePoints = useCallback((orderTotal: number): number => {
    if (!program || orderTotal <= 0) return 0;
    return Math.floor(orderTotal / program.points_per_mwk);
  }, [program]);

  const calculateTier = useCallback((lifetimePoints: number): string => {
    for (const tier of tiers) {
      if (lifetimePoints >= tier.min_lifetime_points) {
        return tier.name;
      }
    }
    return "bronze";
  }, [tiers]);

  const getTierBenefits = useCallback((tierName: string): LoyaltyTier | undefined => {
    return tiers.find(t => t.name === tierName);
  }, [tiers]);

  const canRedeem = useCallback((points: number): boolean => {
    if (!program || !loyalty) return false;
    return loyalty.available_points >= program.points_to_redeem && points >= program.points_to_redeem;
  }, [program, loyalty]);

  const getRewardValue = useCallback((points: number): number => {
    if (!program || points <= 0) return 0;
    const redemptions = Math.floor(points / program.points_to_redeem);
    return redemptions * program.reward_value_mwk;
  }, [program]);

  return {
    loyalty,
    program,
    tiers,
    transactions,
    loading,
    error,
    refresh: fetchLoyaltyData,
    earnPoints,
    redeemPoints,
    calculatePoints,
    calculateTier,
    getTierBenefits,
    canRedeem,
    getRewardValue,
  };
}