import { type ReactNode } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { LFLink } from "@/components/lf/lfRouter";
import { SEO, defaultSEO } from "@/components/SEO";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type SEOKey = keyof typeof defaultSEO;

interface LakeFreshPolicyLayoutProps {
  seo: SEOKey;
  seoPath: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}

export const LakeFreshPolicyLayout = ({
  seo,
  seoPath,
  eyebrow,
  title,
  intro,
  updated = "17 November 2026",
  children,
}: LakeFreshPolicyLayoutProps) => (
  <div className="bg-white">
    <SEO {...defaultSEO[seo]} path={seoPath} brand="lake-fresh" />

    <section className="border-b border-[#39B54A]/20 bg-[#F7FBFC]">
      <div className="container max-w-3xl py-10 sm:py-14">
        <LFLink
          to="/lf"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#073B78]/70 transition-colors hover:text-[#08A9E8]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lake Fresh
        </LFLink>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#08A9E8]">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#073B78] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#073B78]/75 sm:text-base">{intro}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#073B78]/50">
          Last updated: {updated}
        </p>
      </div>
    </section>

    <div className="container max-w-3xl py-10 sm:py-14">
      <div className="space-y-8 text-[#073B78]/80">{children}</div>

      <div className="mt-12 rounded-2xl border border-[#39B54A]/20 bg-[#F4FBF7] p-6">
        <p className="font-display text-lg font-extrabold text-[#073B78]">Still need help?</p>
        <p className="mt-1 text-sm text-[#073B78]/75">
          Ask us about this page or about an order. We are here to help.
        </p>
        <a
          href={buildWhatsAppLink("Hi Lake Fresh, I need help with an order.", undefined, "lake-fresh")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white"
        >
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#08A9E8]">
        <LFLink to="/lf/privacy" className="hover:text-[#073B78]">Privacy Policy</LFLink>
        <LFLink to="/lf/terms" className="hover:text-[#073B78]">Terms and Conditions</LFLink>
        <LFLink to="/lf/refund" className="hover:text-[#073B78]">Refund Policy</LFLink>
        <LFLink to="/lf/photo-credits" className="hover:text-[#073B78]">Photo Credits</LFLink>
      </div>
    </div>
  </div>
);

interface LakeFreshPolicySectionProps {
  title: string;
  children: ReactNode;
}

export const LakeFreshPolicySection = ({ title, children }: LakeFreshPolicySectionProps) => (
  <section className="space-y-3">
    <h2 className="font-display text-lg font-extrabold text-[#073B78] sm:text-xl">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-[#073B78]/75 sm:text-base">{children}</div>
  </section>
);

export const LakeFreshPolicyList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39B54A]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
