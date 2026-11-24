import { PolicyLayout, PolicySection, PolicyList } from "./PolicyLayout";

const Returns = () => (
  <PolicyLayout
    seo="returns"
    eyebrow="Easy Exchanges"
    title="Returns & Exchanges"
    intro="If a piece does not fit the way you hoped, talk to us. We keep the process simple and human."
  >
    <PolicySection title="The basics">
      <PolicyList
        items={[
          "You have 14 days from delivery to request a return or size exchange.",
          "Items must be unworn, unwashed and still have their original tags attached.",
          "Original packaging and any included accessories should be returned with the item.",
          "Proof of purchase, such as your order number or confirmation message, is required.",
          "To start a return or exchange, WhatsApp us at +265 982 972 977.",
        ]}
      />
    </PolicySection>

    <PolicySection title="Size exchanges">
      <p>
        Wrong size? Message us on WhatsApp with your order number and the size you need. If the size
        is in stock, we will reserve it and arrange the swap. If it is not, we will offer a refund or
        store credit instead.
      </p>
      <p>
        Exchanges are subject to stock availability. We cannot guarantee that every size will still
        be available after your order arrives.
      </p>
    </PolicySection>

    <PolicySection title="What cannot be returned">
      <PolicyList
        items={[
          "Items that have been worn, washed, altered or damaged after delivery.",
          "Items without their original tags or packaging.",
          "Sale items marked as final sale, where this is stated on the product page.",
          "Gift cards and digital vouchers.",
        ]}
      />
    </PolicySection>

    <PolicySection title="Refunds">
      <p>
        Once we receive and inspect a returned item, we will confirm whether it qualifies. Approved
        refunds are sent through the same payment method used for the order, or as store credit if
        you prefer.
      </p>
      <p>
        Refunds are usually processed within 5 to 10 working days after approval. Mobile money
        refunds can take a little longer depending on the provider.
      </p>
      <p>
        Original delivery fees are non refundable unless the return is because of a fault or an
        error on our side.
      </p>
    </PolicySection>

    <PolicySection title="Return delivery">
      <p>
        Return delivery is paid by the customer, except where the item is faulty or we sent the
        wrong item. In those cases we cover the return cost.
      </p>
      <p>
        Please message us before sending anything back so we can confirm the return address and
        avoid items going missing.
      </p>
    </PolicySection>
  </PolicyLayout>
);

export default Returns;
