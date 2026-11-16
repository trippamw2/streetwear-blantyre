import { useState } from "react";
import { LFLink } from "@/components/lf/lfRouter";
import { ArrowRight, Copy, Gift, Loader2, Sparkles, Star, Users } from "lucide-react";
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
      <div className="bg-white">
        <SEO brand="lake-fresh" title="Rewards — Lake Fresh Fish Mart" description="Lake Fresh loyalty rewards." />
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F4FBF7] via-white to-[#F7FCEB]">
          <div className="container py-16 text-center sm:py-20">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7ED321]/20 text-[#39B54A]">
              <Gift className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              LAKEFRESH REWARDS
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Sign in to earn points on every order, unlock tiers and refer friends for more.
            </p>
            <LFLink
              to="/lf/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#39B54A] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </LFLink>
          </div>
        </section>
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

      <section className="relative overflow-hidden border-b border-[#F2FBEE] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Every order counts
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">REWARDS</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Earn points on every Lake Fresh order, grow your tier and share your code to reward friends.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl py-10 sm:py-14">
        {loyaltyLoading ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#39B54A]" /> Loading…
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#39B54A]/25 bg-[#F4FBF7] p-5">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#7ED321]/25" />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#39B54A] shadow-sm">
                  <Star className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#2c6e12]">Available points</p>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#073B78]">{loyalty?.available_points ?? 0}</p>
              <p className="mt-1 text-xs capitalize text-gray-500">Tier: {loyalty?.tier ?? "bronze"}</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#08A9E8]/25 bg-[#EAF6FB] p-5">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#08A9E8]/20" />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#08A9E8] shadow-sm">
                  <Gift className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/70">Lifetime spent</p>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#073B78]">{loyalty?.lifetime_spent_mwk ?? 0} MWK</p>
              <p className="mt-1 text-xs text-gray-500">Total points: {loyalty?.total_points ?? 0}</p>
            </div>
          </div>
        )}

        {program ? (
          <div className="mt-5 rounded-2xl border border-[#7ED321]/40 bg-gradient-to-br from-[#F4FBF7] to-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#39B54A]">Active program</p>
            <p className="mt-2 font-display text-lg font-extrabold text-[#073B78]">{program.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{program.description}</p>
            <p className="mt-3 inline-flex flex-wrap gap-2 text-[11px] text-[#2c6e12]">
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                {program.points_per_mwk} points per MWK
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                Redeem {program.points_to_redeem} points for {program.reward_value_mwk} MWK
              </span>
            </p>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A9E8]/10 text-[#08A9E8]">
              <Users className="h-4 w-4" />
            </span>
            <p className="font-display text-lg font-extrabold text-[#073B78]">Refer a friend</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">Share your code and earn rewards when friends order.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-xl border border-dashed border-[#08A9E8]/40 bg-[#EAF6FB]/50 px-3 py-2.5 text-sm font-bold tracking-wide text-[#073B78]">
              {referral?.code || "N/A"}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08A9E8] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
            >
              <Copy className="h-3.5 w-3.5" /> Copy code
            </button>
          </div>
          {referral ? (
            <p className="mt-2 text-xs text-gray-500">
              Referrals: {referral.rewards_redeemed ?? 0} / {referral.max_referrals ?? 50}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl bg-[#073B78] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-extrabold text-white">Ready for more points?</p>
            <p className="mt-1 text-xs text-white/60">Fresh fish, signature spices and a free recipe — all in one order.</p>
          </div>
          <LFLink
            to="/lf/fish"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7ED321] px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78]"
          >
            Shop the catch <ArrowRight className="h-3.5 w-3.5" />
          </LFLink>
        </div>
      </div>
    </div>
  );
};

export default LakeFreshLoyalty;
