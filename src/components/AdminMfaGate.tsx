import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type GateState = "checking" | "enroll" | "challenge" | "allowed";

/** Blocks admin screens until the signed-in user has a verified second factor. */
export const AdminMfaGate = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GateState>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setError(null);
      const { data: level, error: levelError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (levelError) {
        setError("We could not check your security level. Please sign out and sign in again.");
        setState("challenge");
        return;
      }
      if (level?.currentLevel === "aal2") {
        setState("allowed");
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      const verified = factors?.totp?.find((factor) => factor.status === "verified");

      if (verified) {
        setFactorId(verified.id);
        setState("challenge");
        return;
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Lake Fresh Admin",
      });
      if (cancelled) return;
      if (enrollError || !enrolled) {
        setError(enrollError?.message || "We could not start two factor setup.");
        setState("challenge");
        return;
      }
      setFactorId(enrolled.id);
      setQrCode(enrolled.totp.qr_code);
      setState("enroll");
    };

    void start();
    return () => {
      cancelled = true;
    };
  }, []);

  const verifyCode = async () => {
    if (!factorId || code.trim().length < 6) {
      setError("Enter the 6 digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data) {
      setError(challenge.error?.message || "We could not start verification. Try again.");
      setBusy(false);
      return;
    }
    const result = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (result.error) {
      setError("That code did not work. Check your app and try again.");
      return;
    }
    setState("allowed");
    // Refresh so every Supabase client picks up the new assurance level.
    window.location.reload();
  };

  if (state === "allowed") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#073B78]">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="font-display text-lg font-extrabold">One more step</h1>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Admin access needs a code from your authenticator app. This protects customer details and money
          decisions.
        </p>

        {state === "checking" && (
          <p className="mt-6 text-sm text-gray-500">Checking your security level…</p>
        )}

        {state === "enroll" && qrCode && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-bold text-[#073B78]">Set up your authenticator app</p>
            <img
              src={qrCode}
              alt="Authenticator setup QR code"
              className="mx-auto h-48 w-48 rounded-lg border border-gray-200"
            />
            <p className="text-center text-xs text-gray-500">
              Scan this with Google Authenticator, Authy or another TOTP app.
            </p>
          </div>
        )}

        {(state === "enroll" || state === "challenge") && (
          <div className="mt-5 space-y-3">
            {state === "challenge" && (
              <p className="text-sm font-bold text-[#073B78]">Enter your 6 digit code</p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
              aria-label="Authenticator code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.4em]"
            />
            <button
              type="button"
              onClick={() => void verifyCode()}
              disabled={busy}
              className="w-full rounded-lg bg-[#073B78] px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {busy ? "Checking…" : "Continue"}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="mt-5 text-xs font-bold text-gray-500 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
