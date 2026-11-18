import { LakeFreshPolicyLayout, LakeFreshPolicySection } from "@/components/lf/LakeFreshPolicyLayout";
import { lfPhotoCredits, type LFPhotoCredit } from "@/data/lfPhotoCredits";

const CreditCard = ({ credit }: { credit: LFPhotoCredit }) => (
  <div className="rounded-2xl border border-[#39B54A]/20 bg-white p-4">
    <p className="font-display text-sm font-extrabold text-[#073B78]">{credit.label}</p>
    <p className="mt-1 text-xs text-[#073B78]/70">Photo by {credit.creator}</p>
    <p className="mt-2 text-xs font-bold text-[#073B78]/60">{credit.license}</p>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-[#08A9E8]">
      <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#073B78]">
        Read terms
      </a>
      <a href={credit.source} target="_blank" rel="noopener noreferrer" className="hover:text-[#073B78]">
        View source
      </a>
    </div>
  </div>
);

const LakeFreshPhotoCredits = () => (
  <LakeFreshPolicyLayout
    seo="lfPhotoCredits"
    seoPath="/photo-credits"
    eyebrow="Photo Sources"
    title="Photo Credits"
    intro="You can see the fish and seasonings before you order. We use real photos from Wikimedia Commons to help you choose. This page names each photographer and shares the terms for each photo."
    updated="18 November 2026"
  >
    <LakeFreshPolicySection title="How we use these photos">
      <p>
        We use photos to show fish, spices and meals you can cook at home. A photo helps you see what
        you are choosing before you order.
      </p>
      <p>
        Some photos are made smaller or cropped to fit a phone screen. The photos are examples. Your
        order is the fish and seasoning you choose.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Catch photos">
      <div className="grid gap-3 sm:grid-cols-2">
        {lfPhotoCredits
          .filter((credit) => credit.group === "Catch")
          .map((credit) => (
            <CreditCard key={credit.id} credit={credit} />
          ))}
      </div>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Seasoning photos">
      <div className="grid gap-3 sm:grid-cols-2">
        {lfPhotoCredits
          .filter((credit) => credit.group === "Seasoning")
          .map((credit) => (
            <CreditCard key={credit.id} credit={credit} />
          ))}
      </div>
    </LakeFreshPolicySection>
  </LakeFreshPolicyLayout>
);

export default LakeFreshPhotoCredits;
