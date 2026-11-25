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
      <div className="container py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Contact SB</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Need help?</h1>
        <p className="mt-3 max-w-xl text-base text-gray-600">Ask us about size, stock, delivery, or your order. We’re happy to help.</p>
      </div>
    </section>

    <div className="container py-12 sm:py-16">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl bg-primary p-6 text-white sm:p-8">
          <div>
            <MessageCircle className="h-7 w-7 text-white/80" />
            <h2 className="mt-3 font-display text-2xl font-extrabold">WhatsApp</h2>
            <p className="mt-2 text-sm text-white/85">Fastest way to get help.</p>
            <p className="mt-2 text-sm font-semibold text-white">{WHATSAPP_NUMBER}</p>
          </div>
          <Button asChild size="lg" className="mt-6 w-full bg-white text-primary hover:bg-gray-100">
            <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">Chat now</a>
          </Button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <MapPin className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Pickup</h2>
          <p className="mt-2 text-sm text-gray-600">Pick up in Blantyre. We’ll message you when it’s ready.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <Truck className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Delivery</h2>
          <p className="mt-2 text-sm text-gray-600">Blantyre: 1-3 days. Other areas: 3-5 working days.</p>
          <p className="mt-3 text-sm text-gray-600">We deliver across Malawi.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="font-display text-lg font-bold text-gray-900">Safe payment</h2>
          <p className="mt-2 text-sm text-gray-600">Pay with Airtel Money, TNM Mpamba, Visa, or Mastercard through PayChangu.</p>
          <p className="mt-2 text-sm text-gray-600">If payment fails, you can retry from your order page.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="font-display text-lg font-bold text-gray-900">Buy with confidence</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>WhatsApp help: <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{WHATSAPP_NUMBER}</a></li>
            <li>14 day size exchanges on eligible items.</li>
            <li>30 day quality cover for faults.</li>
            <li>Order confirmation and tracking.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
