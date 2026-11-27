import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { MapPin, MessageCircle, Truck } from "lucide-react";

const WHATSAPP_NUMBER = "+265 982 972 977";
const WHATSAPP_LINK = "https://wa.me/265982972977";

const Contact = () => (
  <div className="min-h-screen bg-[#fbfbfc] text-[#141414]">
    <SEO {...defaultSEO.contact} path="/contact" />

    <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#0a0a0a] text-white">
      <div className="absolute inset-0">
        <img src="/images/sb/street-campaign.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-25" loading="eager" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
      </div>
      <div className="container relative py-20 sm:py-28">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Contact SB</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl">Need help?</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">Ask about size, stock, delivery, or your order. We reply fast on WhatsApp.</p>
      </div>
    </section>

    <div className="container py-14 sm:py-20">
      <div className="grid gap-px bg-black/10 lg:grid-cols-3">
        <div className="flex flex-col justify-between bg-primary p-7 text-white sm:p-10">
          <div>
            <MessageCircle className="h-6 w-6 text-white/80" />
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight">WhatsApp</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">Fastest way to get help.</p>
            <p className="mt-2 text-sm font-semibold text-white">{WHATSAPP_NUMBER}</p>
          </div>
          <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 items-center justify-center bg-white px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-blue-50">
            Chat now
          </a>
        </div>

        <div className="bg-white p-7 sm:p-10">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#141414]">Pickup</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">Pickup in Blantyre. We message you when ready.</p>
          <p className="mt-3 text-sm text-gray-600">Ask on WhatsApp for pickup details.</p>
        </div>

        <div className="bg-white p-7 sm:p-10">
          <Truck className="h-6 w-6 text-primary" />
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#141414]">Delivery</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">Blantyre: 1-3 days.</p>
          <p className="mt-1 text-sm text-gray-600">Other areas: 3-5 working days.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-px bg-black/10 sm:grid-cols-2">
        <div className="bg-[#f6f6f4] p-7 sm:p-10">
          <h2 className="font-display text-xl font-bold tracking-tight text-[#141414]">Safe payment</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["Airtel Money", "TNM Mpamba", "Visa", "Mastercard", "PayChangu"].map((m) => <span key={m} className="border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700">{m}</span>)}
          </div>
          <p className="mt-4 text-sm text-gray-600">If payment fails, retry from your order page.</p>
        </div>
        <div className="bg-[#f6f6f4] p-7 sm:p-10">
          <h2 className="font-display text-xl font-bold tracking-tight text-[#141414]">Buy with confidence</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
            <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{WHATSAPP_NUMBER}</a> on WhatsApp</li>
            <li>14 day size exchange on eligible items.</li>
            <li>30 day quality cover for faults.</li>
            <li>Order confirmation and tracking.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
