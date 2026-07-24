import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReferralSignup } from "@/hooks/useReferral";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Gift } from "lucide-react";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const phoneSchema = z.string().trim().min(7, "Enter a valid phone").max(20);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const { applyReferralCode, applying } = useReferralSignup();

  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    const refFromStorage = localStorage.getItem("referredBy");
    if (refFromUrl) {
      setReferredBy(refFromUrl);
      localStorage.removeItem("referredBy");
    } else if (refFromStorage) {
      setReferredBy(refFromStorage);
    }
  }, [searchParams]);

  // Redirect if already logged in
  if (!authLoading && user) {
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
    navigate(redirect, { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const e1 = emailSchema.safeParse(email);
      const p1 = passwordSchema.safeParse(password);
      if (!e1.success) throw new Error(e1.error.issues[0].message);
      if (!p1.success) throw new Error(p1.error.issues[0].message);

      if (mode === "signup") {
        const n = nameSchema.safeParse(fullName);
        const ph = phoneSchema.safeParse(phone);
        if (!n.success) throw new Error(n.error.issues[0].message);
        if (!ph.success) throw new Error(ph.error.issues[0].message);

        const { error, data } = await supabase.auth.signUp({
          email: e1.data,
          password: p1.data,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: n.data, phone: ph.data },
          },
        });
        if (error) throw error;
        
        if (referredBy && data?.user) {
          await applyReferralCode(referredBy, data.user.id);
          toast({ title: "Account created!", description: "You got K200 off with referral!" });
        } else {
          toast({ title: "Account created!", description: "Start your culture journey to earn points!" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: e1.data, password: p1.data });
        if (error) throw error;
        toast({ title: "Welcome back" });
      }
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16">
      <SEO {...defaultSEO.auth} />
      <div className="rounded-3xl bg-card border border-gray-100 p-8 shadow-card">
        <div className="space-y-2 mb-6 text-center">
          <p className="text-sm font-semibold text-gradient uppercase tracking-widest">{mode === "signin" ? "Welcome back" : "Join Streetwear Blantyre"}</p>
          <h1 className="font-display font-bold text-3xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="text-sm text-gray-500">{mode === "signin" ? "Sign in to checkout and track orders." : "Sign up to earn rewards on every purchase."}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {referredBy && mode === "signup" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Gift className="h-4 w-4" />
              <span>You get K200 off with referral!</span>
            </div>
          )}
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (WhatsApp)</Label>
                <Input id="phone" type="tel" placeholder="+265 ..." value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          {mode === "signin" ? "New to Streetwear Blantyre?" : "Already have an account?"}{" "}
          <button type="button" className="text-gradient font-semibold" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>

        <p className="text-xs text-center text-muted-foreground mt-4">
          <Link to="/" className="hover:text-foreground">← Back to shop</Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
