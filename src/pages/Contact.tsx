import { Button } from "@/components/ui/button";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";

const Contact = () => (
  <div className="container py-16 sm:py-24 md:py-32">
    <SEO {...defaultSEO.contact} />
    <div className="max-w-2xl space-y-3 mb-12 sm:mb-16">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em]">Contact</p>
      <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight">
        Let's talk.
      </h1>
      <p className="text-gray-500 text-sm sm:text-base sm:text-lg">
        Fastest way to reach us is WhatsApp. We reply in minutes.
      </p>
    </div>

    <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
      <div className="bg-gray-900 p-8 sm:p-10 space-y-5">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">WhatsApp us</h2>
          <p className="text-white/60 mt-2 text-sm">Order, ask anything, get help fast.</p>
        </div>
        <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
          <a href={buildWhatsAppLink(defaultMessage)} target="_blank" rel="noopener noreferrer">
            Chat now
          </a>
        </Button>
      </div>

      <div className="bg-gray-50 p-8 sm:p-10 space-y-5">
        <h2 className="font-display font-bold text-2xl sm:text-3xl">Other ways to reach us</h2>
        <ul className="space-y-5">
          <li>
            <p className="font-semibold text-sm">Phone</p>
            <a href="tel:+265888000000" className="text-gray-500 hover:text-gray-900 text-sm">+265 888 000 000</a>
          </li>
          <li>
            <p className="font-semibold text-sm">Email</p>
            <a href="mailto:hello@streetwearblantyre.mw" className="text-gray-500 hover:text-gray-900 text-sm">hello@streetwearblantyre.mw</a>
          </li>
          <li>
            <p className="font-semibold text-sm">Location</p>
            <p className="text-gray-500 text-sm">Blantyre, Malawi &middot; Delivery nationwide</p>
          </li>
        </ul>
      </div>
    </div>

    <div className="mt-10 border-t border-gray-100 pt-8 text-center">
      <p className="text-sm text-gray-500">
        We accept: <span className="text-gray-900 font-semibold">Airtel Money</span> &middot;{" "}
        <span className="text-gray-900 font-semibold">TNM Mpamba</span> &middot;{" "}
        <span className="text-gray-900 font-semibold">Bank Transfer</span>
      </p>
    </div>
  </div>
);

export default Contact;
