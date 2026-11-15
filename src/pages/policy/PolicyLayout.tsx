import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ReactNode } from "react";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";

type SEOKey = keyof typeof defaultSEO;

interface PolicyLayoutProps {
  seo: SEOKey;
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}

export const PolicyLayout = ({
  seo,
  eyebrow,
  title,
  intro,
  updated = "November 2026",
  children,
}: PolicyLayoutProps) => (
  <div className="bg-white">
    <SEO {...defaultSEO[seo]} />

    <section className="border-b border-gray-200 bg-gray-50">
      <div className="container max-w-3xl py-10 sm:py-14">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <p className="eyebrow mb-3 text-primary">{eyebrow}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">{intro}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
          Last updated: {updated}
        </p>
      </div>
    </section>

    <div className="container max-w-3xl py-10 sm:py-14">
      <div className="space-y-8 text-gray-600">{children}</div>

      <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <p className="font-display text-lg font-bold text-gray-900">Still need help?</p>
        <p className="mt-1 text-sm text-gray-500">
          Message us on WhatsApp and we will get back to you as soon as we can.
        </p>
        <a
          href={buildWhatsAppLink(defaultMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>
    </div>
  </div>
);

interface PolicySectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export const PolicySection = ({ title, children, icon }: PolicySectionProps) => (
  <section className="space-y-3">
    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900 sm:text-xl">
      {icon}
      {title}
    </h2>
    <div className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base">{children}</div>
  </section>
);

export const PolicyList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
