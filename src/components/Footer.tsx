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
      toast({ title: "Subscribed!", description: "Get 10% off your first order" });
    } else {
      toast({ variant: "destructive", title: "Something went wrong", description: "Could not subscribe. Try again later." });
    }

    setLoading(false);
  };

  const paymentMethods = ["Visa", "Mastercard", "Airtel Money", "TNM Mpamba"];

  return (
    <footer className="bg-white border-t border-gray-100 mt-24">
      {/* Newsletter */}
      <div className="border-b border-gray-100">
        <div className="container py-12">
          {subscribed ? (
            <p className="text-sm text-gray-500">Thanks for subscribing. Check your inbox for 10% off.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-lg">
              <div className="flex-1 w-full">
                <label htmlFor="footer-email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Newsletter</label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading || !email} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Logo className="h-10" />
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
              Streetwear Blantyre brings you the culture. Fits picked for your life. Delivered to your door.
            </p>
            <p className="text-sm text-gray-900 font-medium">Upgrade your everyday.</p>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">We accept</p>
              <div className="flex gap-3 flex-wrap">
                {paymentMethods.map((name) => (
                  <span key={name} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li><Link to="/combos" className="hover:text-gray-900 transition-colors">Fashion Bundles</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900 transition-colors">All Products</Link></li>
              <li><Link to="/shop?cat=t-shirts" className="hover:text-gray-900 transition-colors">T-Shirts</Link></li>
              <li><Link to="/shop?cat=hoodies" className="hover:text-gray-900 transition-colors">Hoodies</Link></li>
              <li><Link to="/shop?cat=caps" className="hover:text-gray-900 transition-colors">Caps</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li><Link to="/orders" className="hover:text-gray-900 transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-gray-900 transition-colors">Contact Us</Link></li>
              <li><a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">WhatsApp</a></li>
              <li><Link to="/about" className="hover:text-gray-900 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li><Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/returns" className="hover:text-gray-900 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/warranty" className="hover:text-gray-900 transition-colors">Warranty Info</Link></li>
              <li><Link to="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-6 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Streetwear Blantyre. Wear the Culture.</p>
          <p className="uppercase tracking-wider">Malawi</p>
        </div>
      </div>
    </footer>
  );
};
