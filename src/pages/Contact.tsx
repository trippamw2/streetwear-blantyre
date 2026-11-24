import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { MapPin, MessageCircle, Phone, Truck } from "lucide-react";

const WHATSAPP_NUMBER = "+265 982 972 977";
const WHATSAPP_LINK = "https://wa.me/265982972977";

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
          <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Delivery & Pickup</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We deliver across Malawi. Blantyre orders usually arrive same day or within 1 to 3 days. Other areas typically take 3 to 5 working days.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Prefer WhatsApp? <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{WHATSAPP_NUMBER}</a>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-gray-900">Payments</h2>
          <p className="mt-2 text-sm text-gray-600">
            We accept <span className="font-semibold text-gray-900">Airtel Money</span>, <span className="font-semibold text-gray-900">TNM Mpamba</span>, and <span className="font-semibold text-gray-900">Visa/Mastercard</span> through secure PayChangu checkout.
          </p>
          <p className="mt-2 text-sm text-gray-600">Cash on delivery is not currently offered. If payment fails, you can retry from your order page or message us on WhatsApp.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-gray-900">Why customers can trust SB</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Real WhatsApp support: <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{WHATSAPP_NUMBER}</a></li>
            <li>14 day size exchanges on eligible unworn items.</li>
            <li>30 day quality cover for manufacturing faults.</li>
            <li>Order confirmation and tracking after checkout.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
