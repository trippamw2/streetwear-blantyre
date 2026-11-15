import { PolicyLayout, PolicySection, PolicyList } from "./PolicyLayout";

const Privacy = () => (
  <PolicyLayout
    seo="privacy"
    eyebrow="Your Data"
    title="Privacy Policy"
    intro="This policy explains what information SB Streetwear collects, why we collect it and how we look after it."
  >
    <PolicySection title="Information we collect">
      <PolicyList
        items={[
          "Contact details you give us, such as your name, phone number and email address.",
          "Delivery details, including your delivery area and any delivery notes.",
          "Order details, including the items you buy, sizes and order history.",
          "Messages you send us on WhatsApp or through the contact form.",
          "Basic technical information, such as browser type and pages visited, used to keep the site working.",
        ]}
      />
      <p>
        We do not collect or store full card numbers. Payments are handled by our payment partners.
      </p>
    </PolicySection>

    <PolicySection title="How we use your information">
      <PolicyList
        items={[
          "To process and deliver your order.",
          "To contact you about your order, delivery or a return.",
          "To answer questions about sizing, stock and availability.",
          "To send offers and new arrival updates, only if you have opted in.",
          "To keep records for accounting and to prevent fraud.",
        ]}
      />
    </PolicySection>

    <PolicySection title="Sharing your information">
      <p>
        We share only what is needed to complete your order. This can include delivery partners,
        payment providers and the service providers that run our website and messaging.
      </p>
      <p>
        We do not sell your personal information. We do not share it with advertisers for their own
        marketing.
      </p>
    </PolicySection>

    <PolicySection title="Keeping your information safe">
      <p>
        We use reputable service providers with controlled access to store order and customer data.
        Access is limited to people who need it to run the store.
      </p>
      <p>
        No online system is completely risk free. If you believe your information has been
        compromised, contact us immediately so we can investigate.
      </p>
    </PolicySection>

    <PolicySection title="How long we keep information">
      <p>
        Order records are kept for as long as needed for accounting, warranty and legal purposes.
        Marketing contact details are kept until you unsubscribe or ask us to remove them.
      </p>
    </PolicySection>

    <PolicySection title="Your choices">
      <PolicyList
        items={[
          "You can ask to see the personal information we hold about you.",
          "You can ask us to correct information that is wrong.",
          "You can ask us to delete information we no longer need to keep.",
          "You can unsubscribe from marketing messages at any time.",
        ]}
      />
      <p>
        Send requests through our contact page or WhatsApp. We may need to confirm your identity
        before acting on a request.
      </p>
    </PolicySection>

    <PolicySection title="Cookies">
      <p>
        We use essential cookies and local storage to keep your cart, wishlist and session working.
        Analytics, where used, help us understand which pages are useful so we can improve the store.
        You can clear cookies in your browser settings, though some features may stop working.
      </p>
    </PolicySection>
  </PolicyLayout>
);

export default Privacy;
