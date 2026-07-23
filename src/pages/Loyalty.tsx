import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useReferral } from "@/hooks/useReferral";
import { SEO, defaultSEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { PromotionSlider } from "@/components/PromotionSlider";
import { Gift, Star, TrendingUp, Clock, ArrowRight, ShoppingBag, Zap, Crown, Award, Gem, Check, Minus, Plus, Users, Copy, Share2, Gift as GiftIcon } from "lucide-react";
import { formatMWK } from "@/data/products";
import { toast } from "@/hooks/use-toast";

const tierConfig = {
  bronze: { icon: Gem, color: "bg-amber-700", text: "text-amber-700", bg: "bg-amber-50" },
  silver: { icon: Award, color: "bg-gray-400", text: "text-gray-400", bg: "bg-gray-50" },
  gold: { icon: Crown, color: "bg-yellow-500", text: "text-yellow-600", bg: "bg-yellow-50" },
  platinum: { icon: Star, color: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
};

const Loyalty = () => {
  const { user } = useAuth();
  const { loyalty, program, tiers, transactions, loading, getRewardValue, redeemPoints, error } = useLoyalty(user?.id, user?.email);
  const { referralCode, stats, loading: referralLoading, copied, copyCode, shareReferral } = useReferral();
  const [redeeming, setRedeeming] = useState(false);

  if (!user) {
    return (
      <div className="container py-6 sm:py-12">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <Gift className="h-12 w-12 mx-auto text-gray-400" />
          <h1 className="font-display font-bold text-2xl sm:text-3xl">Join Streetwear Blantyre Rewards</h1>
          <p className="text-muted-foreground">Sign in to earn points on every purchase!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="lg" className="bg-gray-900">
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageSkeleton />;
  }

  const currentTier = loyalty?.tier || "bronze";
  const tierInfo = tierConfig[currentTier as keyof typeof tierConfig] || tierConfig.bronze;
  const redeemablePoints = loyalty?.available_points || 0;
  const rewardValue = getRewardValue(redeemablePoints);

  // Calculate how many points are needed for next tier
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier);
  const nextTier = tiers[currentTierIndex + 1];
  const pointsToNext = nextTier ? nextTier.min_lifetime_points - (loyalty?.total_points || 0) : 0;

  return (
    <div className="container py-4 sm:py-8 md:py-12">
      <SEO {...defaultSEO.rewards} />
      <div className="mb-4 sm:mb-6">
        <PromotionSlider page="shop" />
      </div>

      <div className="max-w-2xl space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl">Streetwear Blantyre Rewards</h1>
        <p className="text-gray-500 text-sm sm:text-base">Earn points on every purchase. Redeem for discounts.</p>
      </div>

      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tierInfo.bg} border mb-6`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`h-12 sm:h-16 w-12 sm:w-16 rounded-full ${tierInfo.color} flex items-center justify-center`}>
              <tierInfo.icon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground uppercase">Current Tier</p>
              <p className={`font-display font-bold text-xl sm:text-2xl ${tierInfo.text} capitalize`}>{currentTier}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">Available Points</p>
            <p className="font-display font-bold text-3xl sm:text-4xl text-gray-900">{redeemablePoints.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Worth {formatMWK(rewardValue)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier && (
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-muted-foreground">Progress to {nextTier.name}</span>
              <span className="font-medium">{pointsToNext.toLocaleString()} pts to go</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${tierInfo.color} rounded-full`} style={{ width: `${Math.min(100, ((loyalty?.total_points || 0) / nextTier.min_lifetime_points) * 100)}%` }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Redeem Section */}
      {loyalty && loyalty.available_points >= (program?.points_to_redeem || 100) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-200 bg-green-50 p-4 sm:p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Redeem Your Points!</h3>
          </div>
          <p className="text-sm text-green-700 mb-4">
            {redeemablePoints} points = {formatMWK(rewardValue)} off your next order!
          </p>
          <Button
            onClick={() => {
              toast({ 
                title: "Points Ready!", 
                description: `Use ${program?.points_to_redeem || 100} points at checkout for ${formatMWK(program?.reward_value_mwk || 1000)} off!`,
                duration: 5000
              });
            }}
            variant="hero"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Zap className="h-4 w-4 mr-2" /> Use at Checkout
          </Button>
        </motion.div>
      )}

      {/* How It Works */}
      <h2 className="font-display font-bold text-lg sm:text-xl mb-3 sm:mb-4">How It Works</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {[
          { icon: ShoppingBag, title: "Shop", desc: "Earn points" },
          { icon: Gift, title: "Redeem", desc: "Get discounts" },
          { icon: Zap, title: "Save", desc: "On every order" },
          { icon: Crown, title: "Upgrade", desc: "Unlock perks" },
        ].map((step) => (
          <div key={step.title} className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
            <step.icon className="h-5 sm:h-6 w-5 sm:w-6 mx-auto mb-1 text-gray-900" />
            <p className="font-semibold text-xs sm:text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <h2 className="font-display font-bold text-lg sm:text-xl mb-3 sm:mb-4">Tier Benefits</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {tiers.map((tier) => {
          const config = tierConfig[tier.name as keyof typeof tierConfig] || tierConfig.bronze;
          return (
            <div key={tier.name} className={`p-3 sm:p-4 rounded-xl border ${
              tier.name === currentTier ? `${config.bg} border-2` : "border-gray-100 bg-white"
            }`}>
              <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center mb-2`}>
                <config.icon className="h-4 w-4 text-white" />
              </div>
              <p className="font-semibold text-sm capitalize">{tier.name}</p>
              <p className="text-xs text-muted-foreground">{tier.min_lifetime_points.toLocaleString()}+ pts</p>
              {tier.discount_percent > 0 && (
                <p className="text-xs font-medium text-green-600">{tier.discount_percent}% off</p>
              )}
              {tier.free_delivery && (
                <p className="text-xs font-medium text-green-600">Free delivery</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Referral Program */}
      <h2 className="font-display font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-900" /> Refer & Earn
      </h2>
      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-3">Share your code. Earn 500 points per friend who signs up.</p>
            {referralCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-4 py-4 font-mono text-xl font-bold text-gray-900 text-center">
                    {referralCode.code}
                  </code>
                  <Button size="icon" variant="outline" onClick={copyCode} className="h-14 w-14 border-gray-200 hover:bg-gray-50">
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={shareReferral} variant="hero" className="flex-1 text-base py-3">
                    <Share2 className="h-5 w-5 mr-2" /> Share Link
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Your friend gets K200 off â€¢ You earn 500 pts
                </p>
              </div>
            ) : (
              <div className="animate-pulse bg-gray-200 rounded-xl h-20" />
            )}
          </div>
          <div className="flex sm:flex-col gap-3">
            <div className="bg-white rounded-xl p-4 text-center min-w-[80px]">
              <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
              <p className="text-xs font-medium text-muted-foreground">Friends</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center min-w-[80px]">
              <p className="text-3xl font-bold text-green-600">{stats.totalEarned}</p>
              <p className="text-xs font-medium text-muted-foreground">Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h2 className="font-display font-bold text-lg sm:text-xl mb-3 sm:mb-4">Recent Activity</h2>
      <div className="rounded-xl border border-gray-100 overflow-hidden mb-6">
        {transactions.length > 0 ? (
          transactions.map((tx, i) => (
            <div key={tx.id} className={`flex items-center justify-between p-3 sm:p-4 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  tx.points > 0 ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {tx.points > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <Gift className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm capitalize">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.description}</p>
                </div>
              </div>
              <p className={`font-semibold text-sm ${tx.points > 0 ? "text-green-600" : "text-gray-600"}`}>
                {tx.points > 0 ? "+" : ""}{tx.points} pts
              </p>
            </div>
          ))
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <Clock className="h-8 sm:h-10 w-8 sm:w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400">Start shopping to earn points!</p>
          </div>
        )}
      </div>

      <Button asChild variant="hero" size="lg" className="w-full">
        <Link to="/shop">
          Shop & Earn Points <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default Loyalty;