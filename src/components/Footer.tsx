import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Loader2 } from "lucide-react";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    let saved = false;

    try {
      const { error } = await supabase
        .from("customer_subscribers")
        .upsert({ email }, { onConflict: "email" });

      if (!error || error.code === "23505") {
        saved = true;
      } else {
        console.error("Subscribe error:", error);
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    }

    try {
      const { subscribeToList } = await import("@/lib/brevo");
      const ok = await subscribeToList(email, email.split("@")[0]);
      if (ok) saved = true;
    } catch {
      // brevo not configured – non-critical
    }

    if (saved) {
      setSubscribed(true);
      toast({ title: "You're in.", description: "Welcome to the movement. Check your inbox." });
    } else {
      toast({ variant: "destructive", title: "Something went wrong", description: "Could not subscribe. Try again later." });
    }

    setLoading(false);
  };

  const paymentMethods = ["Visa", "Mastercard", "Airtel Money", "TNM Mpamba"];

  return (
    <footer className="bg-navy text-white mt-24">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container py-12">
          {subscribed ? (
            <p className="text-sm text-white/60">Thanks for joining. You're part of the movement now.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-lg">
              <div className="flex-1 w-full">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Become Part of the Culture</p>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-0 py-2 border-0 border-b border-white/20 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading || !email} className="px-6 py-2.5 bg-white text-navy text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Logo className="h-24 sm:h-28 md:h-32 lg:h-40 xl:h-48" />
            <p className="text-white/50 max-w-sm text-sm leading-relaxed">
              Born in Blantyre, Malawi. SB brings together T shirts, football jerseys and short sleeve shirts for everyday life, sport and outdoor experiences.
            </p>
            <p className="text-sm text-white/80 font-medium">SB Streetwear — Wear Your Identity.</p>

            <div className="pt-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">We accept</p>
              <div className="flex gap-3 flex-wrap">
                {paymentMethods.map((name) => (
                  <span key={name} className="px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Experience</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link to="/shop?category=t-shirts" className="hover:text-white transition-colors">T Shirts</Link></li>
              <li><Link to="/shop?category=jerseys" className="hover:text-white transition-colors">Football Jerseys</Link></li>
              <li><Link to="/shop?category=short-sleeve-shirts" className="hover:text-white transition-colors">Short Sleeve Shirts</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Connect</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Info</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-white/40 text-center md:text-left">
            &copy; {new Date().getFullYear()} SB Streetwear. Wear Your Identity. Blantyre, Malawi.
          </p>
          <p className="text-xs text-white/40 uppercase tracking-wider">Blantyre, Malawi</p>
        </div>
      </div>
    </footer>
  );
};
