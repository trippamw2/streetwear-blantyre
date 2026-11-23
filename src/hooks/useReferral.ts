import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { IS_LF_SITE, lfUrl } from "@/lib/brandSite";
import { LF_BRAND_ID, SB_BRAND_ID } from "@/lib/adminBrand";

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

const PENDING_KEY = "brand_pending_referral";

/** The brand a referral belongs to on this storefront. */
export const currentReferralBrandId = (): string => (IS_LF_SITE ? LF_BRAND_ID : SB_BRAND_ID);

const brandPrefix = (isLf: boolean) => (isLf ? "LF" : "STB");

const referralLinkFor = (code: string, isLf: boolean) => {
  const base = isLf ? lfUrl("/") : window.location.origin + "/";
  return `${base}${base.includes("?") ? "&" : "?"}ref=${code}`;
};

export const useReferral = (brandIdOverride?: string) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, successfulReferrals: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const brandId = brandIdOverride || currentReferralBrandId();
  const isLf = brandId === LF_BRAND_ID;

  const loadReferralCode = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setLoading(false);
      return;
    }

    const shortCode = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
    const code = `${brandPrefix(isLf)}${shortCode}`;

    const { data, error } = await supabase
      .from("user_referral_codes")
      .upsert(
        { user_id: user.id, brand_id: brandId, code },
        { onConflict: "user_id,brand_id" },
      )
      .select()
      .maybeSingle();

    if (data) {
      setReferralCode(data as ReferralCode);
      await loadStats(data.code);
    } else if (error) {
      // A code already exists but could not be upserted. Read it instead.
      const { data: existing } = await supabase
        .from("user_referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (existing) {
        setReferralCode(existing as ReferralCode);
        await loadStats(existing.code);
      }
    }

    setLoading(false);
  }, [user, brandId, isLf]);

  const loadStats = async (code: string) => {
    const { data: referrals } = await supabase
      .from("referral_transactions")
      .select("status, referrer_reward")
      .eq("referral_code", code)
      .eq("brand_id", brandId);

    if (referrals) {
      const completed = referrals.filter((r: any) => r.status === "completed");
      setStats({
        totalReferrals: referrals.length,
        successfulReferrals: completed.length,
        totalEarned: completed.reduce((sum: number, r: any) => sum + (r.referrer_reward || 0), 0),
      });
    }
  };

  useEffect(() => {
    loadReferralCode();
  }, [loadReferralCode]);

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralLinkFor(referralCode.code, isLf));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    const link = referralLinkFor(referralCode.code, isLf);
    const brand = isLf ? "Lake Fresh Fish Mart" : "Wear What Speaks";
    const text = `Order from ${brand} and use my referral code: ${referralCode.code}. ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  return { referralCode, stats, loading, copied, copyCode, shareReferral };
};

export const useReferralSignup = () => {
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);

  const applyReferralCode = async (code: string) => {
    if (!code) return { success: false, error: "No code provided" };

    setApplying(true);
    try {
      const { data, error } = await supabase.rpc("apply_referral_code", { p_code: code.trim() });

      if (error) return { success: false, error: error.message };

      const result = (data || {}) as { ok?: boolean; reason?: string };
      if (result.ok) {
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch { /* best-effort: ignore */ }
        return { success: true };
      }

      if (result.reason === "sign_in_required") {
        // New accounts without a session yet: keep the code and apply after sign in.
        try {
          localStorage.setItem(PENDING_KEY, code.trim().toUpperCase());
        } catch { /* best-effort: ignore */ }
        return { success: true, pending: true };
      }

      return { success: false, error: result.reason || "Could not apply referral code" };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Could not apply referral code" };
    } finally {
      setApplying(false);
    }
  };

  // Apply a code that was saved before the account had a session.
  useEffect(() => {
    if (!user) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(PENDING_KEY);
    } catch { /* best-effort: ignore */ }
    if (!stored) return;

    supabase
      .rpc("apply_referral_code", { p_code: stored })
      .then(({ data }) => {
        const result = (data || {}) as { ok?: boolean };
        if (result.ok) {
          try {
            localStorage.removeItem(PENDING_KEY);
          } catch { /* best-effort: ignore */ }
        }
      })
      .catch(() => {});
  }, [user]);

  return { applyReferralCode, applying };
};
