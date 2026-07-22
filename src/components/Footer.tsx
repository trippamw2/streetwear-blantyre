import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Instagram, Facebook, MessageCircle, Mail, CheckCircle, Shield, Truck, CreditCard, Send, Loader2 } from "lucide-react";
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

  const paymentMethods = [
    { name: "Visa", color: "#1A1F71" },
    { name: "Mastercard", color: "#EB001B" },
    { name: "Airtel Money", color: "#FF5A00" },
    { name: "TNM Mpamba", color: "#00A651" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-24">
      {/* Newsletter & Trust Strip */}
      <div className="bg-blue-500">
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Newsletter */}
            <div className="text-white">
              <h3 className="font-display font-bold text-xl">10% off your first order</h3>
              <p className="text-white/80 text-sm">Subscribe for exclusive deals</p>
            </div>
{subscribed ? (
              <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-white" />
                <span className="text-white font-medium">You're subscribed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" disabled={loading || !email} className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Subscribe</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-b border-gray-100">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Secure Checkout</p>
                <p className="text-xs text-gray-500">256-bit SSL encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Genuine Products</p>
                <p className="text-xs text-gray-500">100% authentic brands</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Fast Delivery</p>
                <p className="text-xs text-gray-500">Across all Malawi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Easy Payments</p>
                <p className="text-xs text-gray-500">Mobile money & cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Logo className="h-12" />
            <p className="text-gray-500 max-w-sm text-sm">
              Streetwear Blantyre brings you the culture. Fits picked for your life. Delivered to your door.
            </p>
            <p className="text-sm text-blue-600 font-semibold">Upgrade your everyday.</p>
            
            {/* Social */}
            <div className="flex gap-4 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={buildWhatsAppLink("Hi Streetwear Blantyre!")} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            {/* Payment Methods */}
            <div className="pt-4">
              <p className="text-sm font-medium mb-3">We accept</p>
              <div className="flex gap-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.name}
                    className="px-3 py-1.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600"
                  >
                    {pm.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/combos" className="hover:text-blue-500 transition-colors">Fashion Bundles</Link></li>
              <li><Link to="/shop" className="hover:text-blue-500 transition-colors">All Products</Link></li>
              <li><Link to="/shop?cat=t-shirts" className="hover:text-blue-500 transition-colors">T-Shirts</Link></li>
              <li><Link to="/shop?cat=hoodies" className="hover:text-blue-500 transition-colors">Hoodies</Link></li>
              <li><Link to="/shop?cat=caps" className="hover:text-blue-500 transition-colors">Caps</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/orders" className="hover:text-blue-500 transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link></li>
              <li><a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</a></li>
              <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/terms" className="hover:text-blue-500 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/returns" className="hover:text-blue-500 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/warranty" className="hover:text-blue-500 transition-colors">Warranty Info</Link></li>
              <li><Link to="/faq" className="hover:text-blue-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12">
          <div className="container py-6 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Streetwear Blantyre. Wear the Culture.</p>
            <p className="uppercase tracking-wider">Malawi</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
