import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { Facebook, MapPin, MessageCircle, Truck } from "lucide-react";

const FACEBOOK_URL = import.meta.env.VITE_FACEBOOK_URL || "https://www.facebook.com/";

const Contact = () => (
  <div className="min-h-screen bg-white">
    <SEO {...defaultSEO.contact} path="/contact" />

    <section className="border-b border-gray-200 bg-[#f7f8fb]">
      <div className="container py-14 sm:py-20">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Contact SB</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
            We’re here to help.
          </h1>
          <p className="text-sm leading-relaxed text-gray-600 sm:text-lg">
            Questions about sizing, stock, orders, or delivery? Reach out and we’ll help you find what you need.
          </p>
        </div>
      </div>
    </section>

    <div className="container py-12 sm:py-16">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl bg-primary p-7 text-white sm:p-8">
          <div className="space-y-3">
            <MessageCircle className="h-7 w-7 text-white/80" />
            <h2 className="font-display text-2xl font-extrabold">WhatsApp Support</h2>
            <p className="text-sm leading-relaxed text-white/80">
              The fastest way to get help with orders, product availability, and styling questions.
            </p>
          </div>
          <Button asChild size="lg" className="mt-6 w-full bg-white text-primary hover:bg-gray-100">
            <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          </Button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 sm:p-8">
          <MapPin className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Store Pickup</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Collect your order in Blantyre. Choose pickup at checkout and we’ll notify you when it’s ready.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            Pickup details shared after order confirmation
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 sm:p-8">
          <Truck className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Delivery</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We deliver across Malawi. Blantyre orders usually arrive same day or within 1 to 3 days. Other areas typically take 3 to 5 working days.
          </p>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Facebook className="h-4 w-4" /> Follow SB on Facebook
          </a>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-gray-900">Payments</h2>
        <p className="mt-2 text-sm text-gray-600">
          We accept <span className="font-semibold text-gray-900">Airtel Money</span>, <span className="font-semibold text-gray-900">TNM Mpamba</span>, and <span className="font-semibold text-gray-900">bank/card payments</span> through our secure checkout.
        </p>
      </div>
    </div>
  </div>
);

export default Contact;
