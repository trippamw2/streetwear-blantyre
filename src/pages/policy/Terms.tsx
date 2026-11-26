import { PolicyLayout, PolicySection } from "./PolicyLayout";

const Terms = () => (
  <PolicyLayout
    seo="terms"
    eyebrow="The Fine Print"
    title="Terms & Conditions"
    intro="Simple rules for shopping with SB."
  >
    <PolicySection title="1. About us">
      <p>
        SB sells streetwear clothing in Malawi: tees, vests, shirts, and shorts.
      </p>
      <p>
        We are a retailer. Some branded items come from other suppliers.
      </p>
    </PolicySection>

    <PolicySection title="2. Products and availability">
      <p>
        We work hard to describe and photograph items accurately. Colours can look slightly different
        from screen to screen, and measurements can vary a little between production runs.
      </p>
      <p>
        Stock is limited. An item in your bag is not reserved until payment is confirmed. If an item
        becomes unavailable after you order, we will contact you to offer an alternative, store credit
        or a refund.
      </p>
    </PolicySection>

    <PolicySection title="3. Prices and payment">
      <p>
        Prices are shown in Malawi Kwacha and include applicable taxes unless stated otherwise.
        Delivery fees are shown at checkout before you pay.
      </p>
      <p>
        We may change prices and promotions at any time. Changes do not affect orders that have
        already been confirmed.
      </p>
      <p>
        We accept the payment methods shown at checkout, which may include mobile money and bank
        transfer. Orders are processed once payment is confirmed.
      </p>
    </PolicySection>

    <PolicySection title="4. Orders and delivery">
      <p>
        You are responsible for giving us accurate contact and delivery details. If a delivery fails
        because the details are wrong or nobody is available to receive the order, we may need to
        charge for redelivery.
      </p>
      <p>
        Delivery estimates are guidance, not guarantees. Delays can happen because of weather,
        transport or events outside our control.
      </p>
    </PolicySection>

    <PolicySection title="5. Returns and quality cover">
      <p>
        Returns, exchanges and quality claims are handled under our Returns and Quality Cover pages.
        Those pages form part of these terms.
      </p>
    </PolicySection>

    <PolicySection title="6. Using the site">
      <p>You agree not to:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Use the site for unlawful purposes.</li>
        <li>Attempt to interfere with the site, its security or its payment systems.</li>
        <li>Copy, scrape or resell our content or images without permission.</li>
        <li>Submit false reviews or impersonate another person.</li>
      </ul>
    </PolicySection>

    <PolicySection title="7. Reviews and content">
      <p>
        If you submit a review, you confirm that it reflects your genuine experience. We may remove
        reviews that are abusive, misleading or unrelated to the product.
      </p>
      <p>
        All site content, branding and photography belong to SB or are used with
        permission. Do not reuse them without written consent.
      </p>
    </PolicySection>

    <PolicySection title="8. Liability">
      <p>
        We are responsible for supplying items that match their description and for handling your
        order with reasonable care. We are not responsible for indirect losses, such as lost
        opportunities, that arise from a delayed or cancelled order.
      </p>
      <p>
        Nothing in these terms removes rights you have under Malawi consumer law.
      </p>
    </PolicySection>

    <PolicySection title="9. Changes to these terms">
      <p>
        We may update these terms as the store grows. The version on this page applies at the time
        you place an order.
      </p>
    </PolicySection>
  </PolicyLayout>
);

export default Terms;
