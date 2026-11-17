import { LFLink } from "@/components/lf/lfRouter";
import { ArrowRight, Copy, Gift, Loader2, Share2, Sparkles, Star, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useReferral } from "@/hooks/useReferral";
import { formatMWK } from "@/data/products";

const LakeFreshLoyalty = () => {
  const { user } = useAuth();
  const { loyalty, program, tiers, loading: loyaltyLoading } = useLoyalty(
    user?.id,
    user?.email,
    LF_BRAND_ID,
  );
  const {
    referralCode,
    stats,
    loading: referralLoading,
    copied,
    copyCode,
    shareReferral,
  } = useReferral(LF_BRAND_ID);

  if (!user) {
    return (
      <div className="bg-white">
        <SEO brand="lake-fresh" title="Rewards | Lake Fresh Fish Mart" description="Lake Fresh loyalty rewards." />
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F4FBF7] via-white to-[#F7FCEB]">
          <div className="container py-16 text-center sm:py-20">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7ED321]/20 text-[#39B54A]">
              <Gift className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
              LAKEFRESH REWARDS
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#073B78]/70">
              Sign in to earn points on every order and share your code with a friend.
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

  const availablePoints = loyalty?.available_points ?? 0;
  const lifetimeSpent = loyalty?.lifetime_spent_mwk ?? 0;
  const tier = loyalty?.tier ?? "bronze";
  const nextTier = tiers.find((t) => t.min_lifetime_points > (loyalty?.total_points ?? 0));

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Rewards | Lake Fresh Fish Mart" description="Lake Fresh loyalty rewards." />

      <section className="relative overflow-hidden border-b border-[#F2FBEE] bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF6FB]">
        <div className="container py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#39B54A] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Every order counts
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78] sm:text-5xl">REWARDS</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#073B78]/70 sm:text-base">
            Every fish order earns points. As you order more, you reach new rewards and can share your code with
            friends.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl py-10 sm:py-14">
        {loyaltyLoading ? (
          <p className="flex items-center gap-2 text-sm text-[#073B78]/60">
            <Loader2 className="h-4 w-4 animate-spin text-[#39B54A]" /> Loading
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
              <p className="mt-3 text-3xl font-extrabold text-[#073B78]">{availablePoints}</p>
              <p className="mt-1 text-xs capitalize text-[#073B78]/60">Tier: {tier}</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#08A9E8]/25 bg-[#EAF6FB] p-5">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#08A9E8]/20" />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#08A9E8] shadow-sm">
                  <Gift className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#073B78]/70">Lifetime spent</p>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#073B78]">{formatMWK(lifetimeSpent)}</p>
              <p className="mt-1 text-xs text-[#073B78]/60">Total points: {loyalty?.total_points ?? 0}</p>
            </div>
          </div>
        )}

        {program ? (
          <div className="mt-5 rounded-2xl border border-[#7ED321]/40 bg-gradient-to-br from-[#F4FBF7] to-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#39B54A]">Active program</p>
            <p className="mt-2 font-display text-lg font-extrabold text-[#073B78]">{program.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#073B78]/70">{program.description}</p>
            <p className="mt-3 inline-flex flex-wrap gap-2 text-[11px] text-[#2c6e12]">
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                1 point per {formatMWK(program.points_per_mwk)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                {program.points_to_redeem} points = {formatMWK(program.reward_value_mwk)} off
              </span>
            </p>
            {nextTier ? (
              <p className="mt-3 text-xs text-[#073B78]/60">
                Next tier: <span className="font-bold capitalize text-[#073B78]">{nextTier.name}</span> at{" "}
                {nextTier.min_lifetime_points.toLocaleString()} lifetime points.
              </p>
            ) : null}
          </div>
        ) : null}

        {tiers.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-[#073B78]">
              <Sparkles className="h-4 w-4 text-[#7ED321]" /> Tier benefits
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map((t) => (
                <div
                  key={t.name}
                  className={`rounded-xl border p-3 ${
                    t.name === tier ? "border-[#39B54A] bg-[#F4FBF7]" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-extrabold capitalize text-[#073B78]">{t.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#073B78]/60">{t.min_lifetime_points.toLocaleString()}+ points</p>
                  <p className="mt-2 text-[11px] text-[#073B78]/70">{t.points_multiplier}x points</p>
                  {t.discount_percent > 0 && (
                    <p className="text-[11px] font-semibold text-[#2c6e12]">{t.discount_percent}% off orders</p>
                  )}
                  {t.free_delivery && <p className="text-[11px] font-semibold text-[#2c6e12]">Free delivery</p>}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A9E8]/10 text-[#08A9E8]">
              <Users className="h-4 w-4" />
            </span>
            <p className="font-display text-lg font-extrabold text-[#073B78]">Refer a friend</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#073B78]/60">
            Share your code and you both earn points when their first order is paid.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-xl border border-dashed border-[#08A9E8]/40 bg-[#EAF6FB]/50 px-3 py-2.5 text-sm font-bold tracking-wide text-[#073B78]">
              {referralLoading ? "Loading" : referralCode?.code || "Sign in to get your code"}
            </code>
            <button
              type="button"
              onClick={copyCode}
              disabled={!referralCode}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08A9E8] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={shareReferral}
              disabled={!referralCode}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#073B78]/20 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#073B78] disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
          {referralCode ? (
            <p className="mt-2 text-xs text-[#073B78]/60">
              {stats.successfulReferrals} paid orders from {stats.totalReferrals} friends.{" "}
              {stats.totalEarned.toLocaleString()} points earned.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl bg-[#073B78] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-extrabold text-white">Want more points?</p>
            <p className="mt-1 text-xs text-white/60">
              Every order has fresh fish, spice blends and one free recipe of your choice.
            </p>
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
