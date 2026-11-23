import { BadgeCheck, CreditCard, RefreshCw, Truck } from "lucide-react";

const assurances = [
  { icon: CreditCard, title: "Secure checkout", copy: "Pay with mobile money or card through PayChangu." },
  { icon: Truck, title: "Delivery across Malawi", copy: "Same day in Blantyre, nationwide shipping available." },
  { icon: RefreshCw, title: "14 day exchanges", copy: "Unworn pieces with tags can be exchanged." },
  { icon: BadgeCheck, title: "30 day quality cover", copy: "Faulty items are repaired, replaced or refunded." },
];

interface StorefrontTrustStripProps {
  className?: string;
  compact?: boolean;
}

export const StorefrontTrustStrip = ({ className = "", compact = false }: StorefrontTrustStripProps) => (
  <div
    className={`grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 ${
      compact ? "p-4 sm:grid-cols-2 sm:p-5" : "p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4"
    } ${className}`}
  >
    {assurances.map(({ icon: Icon, title, copy }) => (
      <div key={title} className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {!compact && <p className="mt-1 text-xs leading-relaxed text-gray-600">{copy}</p>}
        </div>
      </div>
    ))}
  </div>
);
