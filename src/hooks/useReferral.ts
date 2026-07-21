import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  rewards_points: number;
  rewards_redeemed: number;
  max_referrals: number;
  created_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarned: number;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, successfulReferrals: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadReferralCode();
  }, [user]);

  const loadReferralCode = async () => {
    if (!user) return;
    
try {
      const shortCode = user.id.slice(0, 8).toUpperCase();
      const code = `SB${shortCode}`;
      
      // Try insert first, if dup then upsert
      const { data: newCode, error: insertErr } = await supabase
        .from("user_referral_codes")
        .upsert({ user_id: user.id, code }, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      
      if (newCode) {
        setReferralCode(newCode as any);
        loadStats(code);
      } else if (insertErr) {
        // Fallback: just use local code
        setReferralCode({ id: "", user_id: user.id, code, rewards_points: 0, rewards_redeemed: 0, max_referrals: 5, created_at: "" } as any);
      }
    } catch (e) {
      const shortCode = user.id.slice(0, 8).toUpperCase();
      const code = `SB${shortCode}`;
      const { data: newCode } = await supabase
        .from("user_referral_codes")
        .upsert({ user_id: user.id, code }, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (newCode) setReferralCode(newCode as any);
    }
    setLoading(false);
  };

  const loadStats = async (code: string) => {
    const { data: referrals } = await supabase
      .from("referral_transactions")
      .select("*")
      .eq("referral_code", code);

    if (referrals) {
      const successful = referrals.filter((r: any) => r.status === "completed").length;
      setStats({
        totalReferrals: referrals.length,
        successfulReferrals: successful,
        totalEarned: successful * 500,
      });
    }
  };

  const copyCode = async () => {
    if (!referralCode) return;
    const referralLink = `${window.location.origin}?ref=${referralCode.code}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    const referralLink = `${window.location.origin}?ref=${referralCode.code}`;
    const text = `Get K200 off your first Streetwear Blantyre order! Use my referral code: ${referralCode.code} - ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { copyCode(); }
    } else {
      copyCode();
    }
  };

  return { referralCode, stats, loading, copied, copyCode, shareReferral };
};

export const useReferralSignup = () => {
  const [applying, setApplying] = useState(false);

  const applyReferralCode = async (code: string, newUserId: string) => {
    if (!code) return { success: false, error: "No code provided" };
    
    setApplying(true);
    try {
      const { data: referral } = await supabase
        .from("user_referral_codes")
        .select("*, user:user_id(email)")
        .eq("code", code.toUpperCase())
        .single();

      if (!referral) {
        return { success: false, error: "Invalid referral code" };
      }

      const { data: transaction } = await supabase
        .from("referral_transactions")
        .insert({
          referrer_id: referral.user_id,
          referee_id: newUserId,
          referral_code: code.toUpperCase(),
          status: "pending",
        })
        .select()
        .single();

      if (transaction) {
        return { success: true, transaction };
      }
      return { success: false, error: "Could not create referral" };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setApplying(false);
    }
  };

  const markReferralComplete = async (transactionId: string, orderId: string) => {
    await supabase
      .from("referral_transactions")
      .update({ status: "completed", order_id: orderId })
      .eq("id", transactionId);

    await supabase.rpc("add_referral_rewards", { transaction_id: transactionId });
  };

  return { applyReferralCode, markReferralComplete, applying };
};