import {
  LakeFreshPolicyLayout,
  LakeFreshPolicyList,
  LakeFreshPolicySection,
} from "@/components/lf/LakeFreshPolicyLayout";

const LakeFreshRefund = () => (
  <LakeFreshPolicyLayout
    seo="lfRefund"
    seoPath="/refund"
    eyebrow="If Something Is Not Right"
    title="Refund Policy"
    intro="Fresh fish cannot sit in a basket for long. If your order is not right, tell us fast and we will help you in a fair and simple way."
  >
    <LakeFreshPolicySection title="Check your order on arrival">
      <p>
        Please check your fish, seasonings and order details when the driver arrives. Look at the
        weight, the items and the pack. Tell us before you cook the fish if something is wrong.
      </p>
      <p>
        Please message us within 2 hours of delivery and send a photo if you can. Keep the pack
        until we reply where you can. The sooner you tell us, the easier it is for us to help.
      </p>
      <p>
        Online shoppers normally have time to change their mind. Fresh fish is different because it
        spoils fast, so this right usually ends when we deliver your order. We still refund you when
        the problem is ours.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="When we will help">
      <LakeFreshPolicyList
        items={[
          "We sent the wrong fish or the wrong seasoning.",
          "The weight is not what you paid for.",
          "An item is missing from your order.",
          "The pack is damaged or the fish does not look or smell fresh.",
          "Our driver went to the wrong place or did not deliver your order.",
          "PayChangu took money twice for one order.",
          "The fish is no longer safe because a delay was our fault.",
        ]}
      />
      <p>
        When the problem is ours, we will replace the item, give you a credit or refund your money.
        You can choose the option that works best for you where we can offer it.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="When we may not refund">
      <LakeFreshPolicyList
        items={[
          "You change your mind after we deliver the fish.",
          "You gave us the wrong address, phone number or map pin.",
          "Nobody was available to receive the order at the delivery time.",
          "You cooked the fish before telling us about the problem.",
          "The fish size or colour is a little different from the photo.",
          "A delay was caused by heavy rain, road trouble or another event outside our control.",
        ]}
      />
      <p>
        Fresh fish is perishable, so we cannot take it back once you accept it. We will still listen
        to your issue and try to help where we can.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Before we pack or send">
      <p>
        If you change your mind, message us as soon as you can. If we have not packed your order, we
        will try to stop it and refund you. If it is already packed or with the driver, we may not be
        able to stop it.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="How to ask for a refund">
      <LakeFreshPolicyList
        items={[
          "Send us a WhatsApp message.",
          "Share your name, order number or PayChangu reference.",
          "Tell us what went wrong and send a photo if you can.",
          "Keep the pack until we reply where you can.",
        ]}
      />
      <p>
        We will reply as soon as we can. If we need more information, we will ask you for it. We keep
        a record of your report so we can improve our service.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="When you will get your money">
      <p>
        If we approve your refund, we send the money back through PayChangu or the payment method you
        used, unless you agree to another way. We follow Malawi law on refund deadlines.
      </p>
      <p>
        If we stop your order before packing, we refund within 14 days. If we fail to supply or
        deliver your order, we refund within 7 days of telling you about the problem.
      </p>
      <p>
        Delivery fees are refunded when we miss the delivery because of our mistake. We do not charge
        a restock fee on fresh fish.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Subscriptions">
      <p>
        Our subscriptions use manual payment. You pay each cycle yourself through PayChangu. We do
        not take money on a schedule.
      </p>
      <p>
        You can stop a subscription before you pay the next cycle. If you have already paid for a
        cycle, we handle it under this policy.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Your rights">
      <p>
        This policy does not remove your rights under Malawi consumer law. If you are not happy with
        our answer, please tell us so we can review it together. You may also contact the
        Competition and Fair Trading Commission (CFTC) in Malawi.
      </p>
    </LakeFreshPolicySection>
  </LakeFreshPolicyLayout>
);

export default LakeFreshRefund;
