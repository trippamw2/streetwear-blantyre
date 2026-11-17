import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LFLink, useLFNavigate } from "@/components/lf/lfRouter";
import { lfPath, lfUrl } from "@/lib/brandSite";
import { z } from "zod";
import { Loader2, Fish } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const phoneSchema = z.string().trim().min(7, "Enter a valid phone").max(20);

const LakeFreshAuth = () => {
  const navigate = useLFNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") || lfPath("/");

  useEffect(() => {
    if (!authLoading && user) navigate(redirect, { replace: true });
  }, [authLoading, user, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedEmail = emailSchema.safeParse(email);
      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedEmail.success) throw new Error(parsedEmail.error.issues[0].message);
      if (!parsedPassword.success) throw new Error(parsedPassword.error.issues[0].message);

      if (mode === "signup") {
        const parsedName = nameSchema.safeParse(fullName);
        const parsedPhone = phoneSchema.safeParse(phone);
        if (!parsedName.success) throw new Error(parsedName.error.issues[0].message);
        if (!parsedPhone.success) throw new Error(parsedPhone.error.issues[0].message);

        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password: parsedPassword.data,
          options: {
            emailRedirectTo: lfUrl("/auth"),
            data: { full_name: parsedName.data, phone: parsedPhone.data },
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate(redirect, { replace: true });
        } else {
          toast({
            title: "Check your email",
            description: "Confirm your email address, then sign in to continue.",
          });
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password: parsedPassword.data,
        });
        if (error) throw error;
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#EAF6FB]/40">
      <SEO
        brand="lake-fresh"
        title="Sign in | Lake Fresh Fish Mart"
        description="Sign in to choose fresh fish, add a free recipe and follow your delivery in Blantyre."
      />
      <div className="container flex min-h-[70vh] max-w-md flex-col justify-center py-14">
        <div className="mb-6 text-center">
          <span className="mx-auto inline-flex w-full max-w-[280px] items-center justify-center rounded-3xl bg-white px-6 py-4 shadow-lg ring-4 ring-white">
            <img
              src="/brand/lake-fresh/icon.png"
              alt="Lake Fresh Fish Mart"
              className="h-20 w-auto max-w-full object-contain sm:h-24"
            />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-[#073B78]">
            {mode === "signin" ? "Welcome back" : "Join Lake Fresh"}
          </h1>
          <p className="mt-2 text-sm text-[#073B78]/60">
            {mode === "signin"
              ? "Sign in to pick your fish, choose a free recipe and follow your delivery."
              : "Make an account so your fish order and delivery details stay in one place."}
          </p>
          <p className="mt-2 text-xs text-[#073B78]/70">
            We know lake fish and we keep your order simple from basket to door.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lf-name">Full name</Label>
                  <Input
                    id="lf-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lf-phone">Phone or WhatsApp</Label>
                  <Input
                    id="lf-phone"
                    type="tel"
                    placeholder="+265 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={20}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="lf-email">Email</Label>
              <Input
                id="lf-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lf-password">Password</Label>
              <Input
                id="lf-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={72}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#073B78] py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-[#073B78]/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#073B78]/60">
            {mode === "signin" ? "New to Lake Fresh?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-[#073B78] underline-offset-2 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[#073B78]/50">
          <LFLink to="/lf" className="hover:text-[#073B78]">← Back to Lake Fresh</LFLink>
        </p>
      </div>
    </div>
  );
};

export default LakeFreshAuth;
