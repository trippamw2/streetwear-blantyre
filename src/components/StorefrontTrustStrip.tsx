import { BadgeCheck, RefreshCw, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Delivery Across Malawi", description: "Reliable delivery from Blantyre to your doorstep." },
  { icon: ShieldCheck, title: "Secure Checkout", description: "Safe payments with trusted checkout options." },
  { icon: RefreshCw, title: "Easy Support", description: "Help with orders, sizing, and exchanges when you need it." },
  { icon: BadgeCheck, title: "Curated Quality", description: "Pieces selected for everyday style, comfort, and value." },
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
