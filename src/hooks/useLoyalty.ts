import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IS_LF_SITE } from "@/lib/brandSite";
import { LF_BRAND_ID, SB_BRAND_ID } from "@/lib/adminBrand";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  points_per_mwk: number;
  points_to_redeem: number;
  reward_value_mwk: number;
  max_redeem_percent: number;
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

export const defaultLoyaltyBrandId = (): string => (IS_LF_SITE ? LF_BRAND_ID : SB_BRAND_ID);

/**
 * Loyalty is per brand. The active storefront decides the default brand, and a
 * caller can override it for admin screens.
 */
export function useLoyalty(userId?: string, userEmail?: string, brandIdOverride?: string) {
  const brandId = brandIdOverride || defaultLoyaltyBrandId();
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null);
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    if (!userId) {
      setLoyalty(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", userId)
        .eq("brand_id", brandId)
        .maybeSingle();

      if (loyaltyError) throw loyaltyError;

      if (loyaltyData) {
        setLoyalty(loyaltyData);
      } else {
        // Create the zero balance row so this brand can reach the customer.
        // The database only allows a client to insert a zero balance row.
        const { data: created } = await supabase
          .from("customer_loyalty")
          .insert({
            user_id: userId,
            brand_id: brandId,
            email: userEmail || null,
            total_points: 0,
            available_points: 0,
            redeemed_points: 0,
            lifetime_spent_mwk: 0,
            tier: "bronze",
          })
          .select()
          .maybeSingle();

        if (created) {
          setLoyalty(created);
        } else {
          const { data: existing } = await supabase
            .from("customer_loyalty")
            .select("*")
            .eq("user_id", userId)
            .eq("brand_id", brandId)
            .maybeSingle();
          setLoyalty(existing || null);
        }
      }

      const { data: programData, error: programError } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (programError) console.warn("Loyalty program fetch failed", programError.message);
      setProgram(programData);

      const { data: tiersData, error: tiersError } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .eq("brand_id", brandId)
        .order("min_lifetime_points", { ascending: true });
      if (tiersError) console.warn("Loyalty tiers fetch failed", tiersError.message);
      setTiers(tiersData || []);

      const { data: txData, error: txError } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (txError) console.warn("Loyalty transactions fetch failed", txError.message);
      setTransactions(txData || []);
    } catch (err) {
      console.error("Loyalty fetch error:", err);
      setError("Failed to load loyalty");
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail, brandId]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  /**
   * Points are only credited once an order is actually paid. The database
   * function is idempotent, so calling it twice never double credits.
   */
  const earnPoints = useCallback(async (orderId: string) => {
    if (!userId) return null;
    try {
      const { data, error: rpcError } = await supabase.rpc("award_loyalty_for_order", {
        p_order_id: orderId,
      });
      if (rpcError) throw rpcError;
      await fetchLoyaltyData();
      const points = (data as { points?: number } | null)?.points;
      return typeof points === "number" ? points : null;
    } catch (err) {
      console.error("Earn points error:", err);
      return null;
    }
  }, [userId, fetchLoyaltyData]);

  /**
   * Redeems points on the server. The database validates the balance and the
   * per order cap, then deducts the points and returns the real discount.
   */
  const redeemPoints = useCallback(async (pointsToRedeem: number, orderTotal: number) => {
    if (!userId) return { success: false, error: "Sign in required", discount: 0, pointsUsed: 0 };

    try {
      const { data, error: rpcError } = await supabase.rpc("redeem_loyalty_points", {
        p_brand_id: brandId,
        p_points: Math.max(0, Math.floor(pointsToRedeem)),
        p_order_total: Math.max(0, orderTotal),
      });

      if (rpcError) throw rpcError;

      const result = (data || {}) as {
        ok?: boolean;
        reason?: string;
        points_used?: number;
        discount?: number;
        available?: number;
      };

      if (!result.ok) {
        const reason =
          result.reason === "not_enough_points"
            ? `Not enough points${typeof result.available === "number" ? ` (${result.available} available)` : ""}`
            : result.reason === "no_loyalty"
              ? "No rewards yet. Earn points with your first paid order."
              : result.reason === "no_program"
                ? "Rewards are not active right now."
                : "Could not redeem points";
        return { success: false, error: reason, discount: 0, pointsUsed: 0 };
      }

      await fetchLoyaltyData();
      return {
        success: true,
        discount: result.discount || 0,
        pointsUsed: result.points_used || 0,
      };
    } catch (err) {
      console.error("Redeem error:", err);
      return { success: false, error: "Failed to redeem", discount: 0, pointsUsed: 0 };
    }
  }, [userId, brandId, fetchLoyaltyData]);

  const calculatePoints = useCallback((orderTotal: number): number => {
    if (!program || orderTotal <= 0) return 0;
    return Math.floor(orderTotal / program.points_per_mwk);
  }, [program]);

  const calculateTier = useCallback((lifetimePoints: number): string => {
    for (const tier of tiers) {
      if (lifetimePoints >= tier.min_lifetime_points) return tier.name;
    }
    return "bronze";
  }, [tiers]);

  const getTierBenefits = useCallback((tierName: string): LoyaltyTier | undefined => {
    return tiers.find((t) => t.name === tierName);
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
    brandId,
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
