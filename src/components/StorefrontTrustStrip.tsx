import { CreditCard, MessageCircle, RefreshCw, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Malawi delivery", description: "Blantyre 1-3 days. Other areas 3-5 days." },
  { icon: CreditCard, title: "Safe PayChangu pay", description: "Airtel Money, TNM Mpamba, Visa, Mastercard." },
  { icon: RefreshCw, title: "Easy exchange", description: "14 day size swap. 30 day quality cover." },
  { icon: MessageCircle, title: "WhatsApp help", description: "Chat us on +265 982 972 977." },
];

interface StorefrontTrustStripProps {
  compact?: boolean;
  className?: string;
}

export const StorefrontTrustStrip = ({ compact = false }: StorefrontTrustStripProps) => (
  <section className="border-y border-gray-200 bg-gray-50">
    <div className={`container grid gap-3 ${compact ? "grid-cols-2 py-4 sm:grid-cols-4" : "grid-cols-2 py-6 sm:gap-4 lg:grid-cols-4 sm:py-8"}`}>
      {items.map(({ icon: Icon, title, description }) => (
        <div key={title} className={`flex ${compact ? "items-center gap-2" : "items-start gap-3"}`}>
          <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${compact ? "h-8 w-8" : "mt-0.5 h-10 w-10"}`}>
            <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-gray-900 ${compact ? "text-xs leading-tight" : "text-sm"}`}>{title}</p>
            <p className={`text-gray-600 ${compact ? "mt-0.5 text-[11px] leading-snug" : "mt-1 text-xs leading-relaxed sm:text-sm"}`}>{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
