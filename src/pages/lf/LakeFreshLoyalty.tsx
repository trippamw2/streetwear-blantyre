import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Gift, Loader2, Star, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { toast } from "@/hooks/use-toast";

const LakeFreshLoyalty = () => {
  const { user } = useAuth();

  const { data: loyalty, isLoading: loyaltyLoading } = useQuery({
    queryKey: ["lf", "loyalty", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", user!.id)
        .eq("brand_id", LF_BRAND_ID)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return data;
      const { data: created, error: createError } = await supabase
        .from("customer_loyalty")
        .insert({
          user_id: user!.id,
          email: user!.email || null,
          brand_id: LF_BRAND_ID,
          total_points: 0,
          available_points: 0,
          redeemed_points: 0,
          lifetime_spent_mwk: 0,
          tier: "bronze",
        })
        .select()
        .single();
      if (createError) throw new Error(createError.message);
      return created;
    },
  });

  const { data: program } = useQuery({
    queryKey: ["lf", "loyalty-program"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: referral } = useQuery({
    queryKey: ["lf", "referral", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("brand_id", LF_BRAND_ID)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return data;
      const code = `LF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { data: created, error: createError } = await supabase
        .from("user_referral_codes")
        .insert({
          user_id: user!.id,
          code,
          brand_id: LF_BRAND_ID,
          rewards_points: 0,
          rewards_redeemed: 0,
          max_referrals: 50,
        })
        .select()
        .single();
      if (createError) throw new Error(createError.message);
      return created;
    },
  });

  if (!user) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container py-12 text-center">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 font-display text-3xl font-extrabold text-[#073B78]">LakeFresh Rewards</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to earn points on every order and refer friends.</p>
          <Link to="/lf/auth" className="mt-6 inline-flex rounded-lg bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-white">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const copyCode = async () => {
    if (!referral?.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      toast({ title: "Copied", description: referral.code });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Rewards — Lake Fresh Fish Mart" description="Lake Fresh loyalty rewards." />
      <div className="container max-w-3xl py-10 sm:py-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#073B78]">REWARDS</h1>
        <p className="mt-2 text-sm text-gray-500">Earn points on every Lake Fresh order.</p>

        {loyaltyLoading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Available points</p>
              <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{loyalty?.available_points ?? 0}</p>
              <p className="mt-1 text-xs text-gray-500">Tier: {loyalty?.tier ?? "bronze"}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lifetime spent</p>
              <p className="mt-2 text-3xl font-extrabold text-[#073B78]">{loyalty?.lifetime_spent_mwk ?? 0} MWK</p>
              <p className="mt-1 text-xs text-gray-500">Total points: {loyalty?.total_points ?? 0}</p>
            </div>
          </div>
        )}

        {program ? (
          <div className="mt-6 rounded-2xl border border-[#08A9E8]/30 bg-[#EAF6FB]/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/60">Active program</p>
            <p className="mt-2 font-display text-lg font-extrabold text-[#073B78]">{program.name}</p>
            <p className="mt-1 text-sm text-gray-600">{program.description}</p>
            <p className="mt-2 text-xs text-gray-500">
              {program.points_per_mwk} points per MWK · redeem {program.points_to_redeem} points for {program.reward_value_mwk} MWK
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#073B78]" />
            <p className="font-display text-lg font-extrabold text-[#073B78]">Refer a friend</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">Share your code and earn rewards when friends order.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-[#073B78]">
              {referral?.code || "—"}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          {referral ? (
            <p className="mt-2 text-xs text-gray-500">
              Referrals: {referral.rewards_redeemed ?? 0} / {referral.max_referrals ?? 50}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LakeFreshLoyalty;
