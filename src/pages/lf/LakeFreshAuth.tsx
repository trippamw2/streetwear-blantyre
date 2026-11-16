import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") || "/lf";

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
            emailRedirectTo: `${window.location.origin}/lf/auth`,
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
    <div className="bg-[#ecfeff]/40">
      <SEO
        brand="lake-fresh"
        title="Sign in — Lake Fresh Fish Mart"
        description="Sign in to order fresh fish for next-day delivery in Blantyre."
      />
      <div className="container flex min-h-[70vh] max-w-md flex-col justify-center py-14">
        <div className="mb-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0a2540] text-[#22d3ee]">
            <Fish className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#0a2540]">
            {mode === "signin" ? "Welcome back" : "Join Lake Fresh"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {mode === "signin"
              ? "Sign in to place a next-day fish order and track it."
              : "Create an account to order fresh fish for your table."}
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
                  <Label htmlFor="lf-phone">Phone (WhatsApp)</Label>
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
              className="w-full bg-[#0a2540] py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-[#0a2540]/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === "signin" ? "New to Lake Fresh?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-[#0a2540] underline-offset-2 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          <Link to="/lf" className="hover:text-[#0a2540]">← Back to Lake Fresh</Link>
        </p>
      </div>
    </div>
  );
};

export default LakeFreshAuth;
