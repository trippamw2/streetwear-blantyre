import { PolicyLayout, PolicySection, PolicyList } from "./PolicyLayout";

const Warranty = () => (
  <PolicyLayout
    seo="warranty"
    eyebrow="Quality Cover"
    title="Quality Cover"
    intro="If something is wrong with the item, we will help make it right."
  >
    <PolicySection title="What is covered">
      <PolicyList
        items={[
          "Manufacturing faults such as stitching that comes apart, faulty seams or broken fastenings.",
          "Fabric or print defects that are present before the item is worn.",
          "Incorrect sizing on our part, where the size on the tag does not match the size you ordered.",
        ]}
      />
      <p>
        Cover runs for <strong className="text-gray-900">30 days from delivery</strong>. Keep your
        order confirmation so we can find your purchase quickly.
      </p>
    </PolicySection>

    <PolicySection title="What is not covered">
      <PolicyList
        items={[
          "Normal wear and tear, including fading from repeated washing.",
          "Damage from incorrect washing, ironing, bleaching or drying.",
          "Accidental damage such as tears, burns, stains or snags.",
          "Items that have been altered, repaired elsewhere or resold.",
          "Change of mind about style, fit or colour. See our Returns page instead.",
        ]}
      />
    </PolicySection>

    <PolicySection title="How to make a claim">
      <ol className="list-decimal space-y-2 pl-5">
        <li>Message us on WhatsApp with your order number.</li>
        <li>Send a clear photo of the fault and the garment tag.</li>
        <li>We will confirm whether the item qualifies for cover.</li>
        <li>
          If approved, we arrange a repair, replacement or refund. Replacements depend on stock
          availability.
        </li>
      </ol>
      <p>
        We aim to resolve quality claims within 7 working days of approving them. Delivery costs
        for approved claims are covered by SB.
      </p>
    </PolicySection>

    <PolicySection title="Branded items">
      <p>
        Some items we sell are branded products from other suppliers. Where a brand offers its own
        guarantee, we will help you use it. Our 30 day quality cover still applies to faults present
        when the item arrives.
      </p>
    </PolicySection>
  </PolicyLayout>
);

export default Warranty;
