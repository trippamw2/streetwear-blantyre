import { BadgeCheck, MessageCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Delivery across Malawi", description: "Blantyre usually 1 to 3 days. Other areas usually 3 to 5 working days." },
  { icon: ShieldCheck, title: "Secure PayChangu payment", description: "Pay with Airtel Money, TNM Mpamba, Visa, or Mastercard. We never store your full payment details." },
  { icon: RefreshCw, title: "Easy exchanges & quality cover", description: "14 day size exchanges on eligible items and 30 day quality cover for faults." },
  { icon: MessageCircle, title: "Real support on WhatsApp", description: "Questions before or after you order? Chat with us on +265 982 972 977." },
];

interface StorefrontTrustStripProps {
  compact?: boolean;
  className?: string;
}

export const StorefrontTrustStrip = (_props: StorefrontTrustStripProps) => (
  <section className="border-y border-gray-200 bg-gray-50">
    <div className="container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4 sm:py-10">
      {items.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
