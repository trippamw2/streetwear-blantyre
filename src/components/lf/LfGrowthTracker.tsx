/**
 * First party growth signals for Lake Fresh.
 * No third party scripts, no email, no user id, no cookie. Only a random
 * session key plus a page path and campaign labels are sent to our own RPC.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { canonicalPathFor } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "lf_growth_session";
const SENT_KEY = "lf_growth_sent";
const ATTRIBUTION_KEY = "lf_growth_attribution";

type Attribution = {
  ref_code: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const newSessionKey = () => {
  try {
    const native = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
    if (native && UUID_PATTERN.test(native)) return native;
  } catch {
    // Older phones may not expose randomUUID. Use the fallback below.
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const getSessionKey = () => {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && UUID_PATTERN.test(existing)) return existing;
    const created = newSessionKey();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return newSessionKey();
  }
};

const clean = (value: string | null | undefined, max: number) =>
  String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_\-. ]/g, "")
    .slice(0, max);

const eventForPath = (path: string) => {
  if (/^\/fish\/[^/]+/.test(path)) return "product_view";
  if (path === "/fish" || path === "/spices") return "catalog_view";
  if (path === "/checkout") return "checkout_started";
  return "page_view";
};

const readAttribution = (search: string): Attribution => {
  const params = new URLSearchParams(search);
  const fromUrl: Attribution = {
    ref_code: clean(params.get("ref"), 40),
    utm_source: clean(params.get("utm_source"), 80),
    utm_medium: clean(params.get("utm_medium"), 80),
    utm_campaign: clean(params.get("utm_campaign"), 120),
  };

  let stored: Partial<Attribution> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}") || {};
  } catch {
    stored = {};
  }

  const merged: Attribution = {
    ref_code: fromUrl.ref_code || clean(stored.ref_code, 40),
    utm_source: fromUrl.utm_source || clean(stored.utm_source, 80),
    utm_medium: fromUrl.utm_medium || clean(stored.utm_medium, 80),
    utm_campaign: fromUrl.utm_campaign || clean(stored.utm_campaign, 120),
  };

  if (!merged.ref_code) {
    try {
      merged.ref_code = clean(localStorage.getItem("brand_pending_referral"), 40);
    } catch {
      merged.ref_code = "";
    }
  }

  if (Object.values(merged).some(Boolean)) {
    try {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(merged));
    } catch {
      // Attribution is optional. Continue without persisting it.
    }
  }

  return merged;
};

const readSent = (): string[] => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const markSent = (path: string) => {
  const sent = [...new Set([...readSent(), path])].slice(-30);
  try {
    sessionStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    // The in memory ref still prevents duplicate sends in this tab.
  }
};

export const LfGrowthTracker = () => {
  const location = useLocation();
  const sentInMemory = useRef<Set<string>>(new Set());

  useEffect(() => {
    const path = canonicalPathFor("lake-fresh", location.pathname).slice(0, 160);
    if (!/^\//.test(path) || sentInMemory.current.has(path) || readSent().includes(path)) return;
    sentInMemory.current.add(path);

    const attribution = readAttribution(location.search);
    const payload = {
      p_event_type: eventForPath(path),
      p_session_key: getSessionKey(),
      p_path: path,
      p_ref_code: attribution.ref_code || null,
      p_utm_source: attribution.utm_source || null,
      p_utm_medium: attribution.utm_medium || null,
      p_utm_campaign: attribution.utm_campaign || null,
    };

    markSent(path);
    void supabase.rpc("lf_record_growth_event", payload).then(({ error }) => {
      if (error) {
        // Tracking must never break a customer journey. Allow a retry later.
        sentInMemory.current.delete(path);
        const sent = readSent().filter((item) => item !== path);
        try {
          sessionStorage.setItem(SENT_KEY, JSON.stringify(sent));
        } catch {
          // Ignore storage failures.
        }
      }
    });
  }, [location.pathname, location.search]);

  return null;
};

export default LfGrowthTracker;
