import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

const Contact = () => (
  <div className="container py-6 sm:py-12 md:py-20">
    <SEO {...defaultSEO.contact} />
    <div className="max-w-2xl space-y-2 sm:space-y-3 mb-8 sm:mb-12">
      <p className="text-sm font-semibold text-gradient uppercase tracking-widest">Contact</p>
      <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-6xl tracking-tight">
        Let's <span className="text-gradient">talk.</span>
      </h1>
      <p className="text-gray-500 text-sm sm:text-base sm:text-lg">
        Fastest way to reach us is WhatsApp. We reply in minutes.
      </p>
    </div>

    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="rounded-3xl p-8 bg-gradient-brand text-white space-y-5 shadow-glow">
        <MessageCircle className="h-10 w-10" />
        <div>
          <h2 className="font-display font-bold text-3xl">WhatsApp us</h2>
          <p className="text-white/85 mt-1">Order, ask anything, get help fast.</p>
        </div>
        <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
          <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" /> Chat now
          </a>
        </Button>
      </div>

      <div className="rounded-3xl p-8 bg-card border border-border/60 space-y-5">
        <h2 className="font-display font-bold text-2xl">Other ways to reach us</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand-soft border border-border flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-semibold">Phone</p>
              <a href="tel:+265888000000" className="text-gray-500 hover:text-gray-900">+265 888 000 000</a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand-soft border border-border flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-semibold">Email</p>
              <a href="mailto:hello@streetwearblantyre.mw" className="text-gray-500 hover:text-gray-900">hello@streetwearblantyre.mw</a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand-soft border border-border flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-semibold">Location</p>
              <p className="text-gray-500">Blantyre, Malawi &middot; Delivery nationwide</p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50/50 p-6 text-center">
      <p className="text-sm text-gray-500">
        We accept: <span className="text-gray-900 font-semibold">Airtel Money</span> &middot;{" "}
        <span className="text-gray-900 font-semibold">TNM Mpamba</span> &middot;{" "}
        <span className="text-gray-900 font-semibold">Bank Transfer</span>
      </p>
    </div>
  </div>
);

export default Contact;
