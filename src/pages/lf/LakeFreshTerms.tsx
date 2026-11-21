import {
  LakeFreshPolicyLayout,
  LakeFreshPolicyList,
  LakeFreshPolicySection,
} from "@/components/lf/LakeFreshPolicyLayout";

const LakeFreshTerms = () => (
  <LakeFreshPolicyLayout
    seo="lfTerms"
    seoPath="/terms"
    eyebrow="How We Work"
    title="Terms and Conditions"
    intro="You pick the fish. We clean, weigh and pack it, then bring it to your door. These terms explain what you and Lake Fresh agree to when you use our store."
  >
    <LakeFreshPolicySection title="1. About us">
      <p>
        Lake Fresh Fish Mart is a fresh fish store in Blantyre, Malawi. We are a registered business
        in Malawi. We sell fresh fish from Lake Malawi, seasonings and recipes for your home or
        kitchen. You can contact us on the WhatsApp number linked at the bottom of this page.
      </p>
      <p>
        Fish, seasonings and recipes are separate parts of the store. Seasonings are paid items.
        Every order comes with one free recipe. You choose the recipe.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="2. Who can order">
      <p>
        You must be 18 or older to place an order. If you are younger, ask a parent or guardian to
        order for you.
      </p>
      <p>
        We deliver only to the areas shown on our home page. Order by 8 PM and we deliver the next day
        when a slot is open. We may add more areas as we grow.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="3. Your order">
      <p>
        Check your basket and details before you press Place order. You can fix mistakes or stop
        before you pay.
      </p>
      <p>
        Your order starts when we send you a confirmation message after payment. We keep a record of
        your order, price, payment and delivery details. We send confirmation by message within 48
        hours, usually straight away.
      </p>
      <p>
        An item in your basket is not reserved until payment is confirmed. If we run out of an item
        after you pay, we will contact you and offer a similar item, a credit or a refund.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="4. Prices and payment">
      <LakeFreshPolicyList
        items={[
          "All prices are in Malawi Kwacha.",
          "Your delivery fee is shown before you pay.",
          "We use PayChangu for payment. We do not keep full card numbers.",
          "Orders are packed after payment is confirmed.",
          "Prices and offers can change, but they do not change an order we have already confirmed.",
          "Subscriptions use manual payment. You pay each cycle yourself. We never take money on a schedule.",
        ]}
      />
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="5. Fresh fish and clear weights">
      <p>
        Fish is a fresh food. Size, colour and weight can differ from one fish to another. We weigh
        your order before packing it and show the price clearly.
      </p>
      <p>
        We clean, weigh and pack fish in Blantyre. We use ice and clean boxes so your fish leaves us
        cold. Our team checks the order again before the driver leaves.
      </p>
      <p>
        Photos help you choose. They are a guide, not an exact picture of the fish you will receive.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="6. Delivery">
      <p>
        We work hard to deliver the next day in our delivery areas. Please give us the correct
        house number, street name, landmark and map pin. This helps our driver find you fast.
      </p>
      <p>
        We may text or call you when the driver is close. If nobody is available to receive the
        order, we will contact you. We may need to charge again for another delivery.
      </p>
      <p>
        Heavy rain, road trouble or a wrong address can cause a delay. If the delay is our fault and
        the fish is no longer safe to use, we will fix it under our Refund Policy.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="7. Looking after your fish">
      <p>
        Check your order when it arrives. If something is wrong, tell us before you cook it. Keep it
        cold and cook it the same day where you can.
      </p>
      <p>
        Fish may have bones and may cause allergies. Cook fish well before eating. Do not eat fish
        that smells or looks spoiled.
      </p>
      <p>
        Fresh fish needs care. Once you accept it and take it inside, we cannot take it back, but we
        will still help when the problem is ours.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="8. Using the store">
      <p>You agree not to:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Give us false name, address or payment details.</li>
        <li>Use the store for unlawful reasons.</li>
        <li>Try to break the store, its security or its payment tools.</li>
        <li>Copy our photos, words or brand without permission.</li>
        <li>Leave false reviews or pretend to be another person.</li>
      </ul>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="9. Recipes and content">
      <p>
        Our recipes are free with an order. They are for your own use. If you share them, please
        mention Lake Fresh.
      </p>
      <p>
        Our words, photos, logo and brand belong to Lake Fresh or are used with permission. Do not
        reuse them without our written consent.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="10. Responsibility">
      <p>
        We are responsible for packing the order you paid for and for handing it to our delivery
        team with reasonable care. We are not responsible for loss caused by a wrong address, no
        person at the delivery point, or events outside our control.
      </p>
      <p>Nothing in these terms removes your rights under Malawi consumer law.</p>
      <p>
        Tell us first if you have a complaint. If we cannot solve it, you may contact the Competition
        and Fair Trading Commission (CFTC) in Malawi.
      </p>
      <p>These terms follow the law of Malawi.</p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="11. Changes to these terms">
      <p>
        We may update these terms as the store grows. The version on this page applies at the time
        you place your order.
      </p>
    </LakeFreshPolicySection>
  </LakeFreshPolicyLayout>
);

export default LakeFreshTerms;
