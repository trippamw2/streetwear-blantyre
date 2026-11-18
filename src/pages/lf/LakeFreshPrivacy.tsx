import {
  LakeFreshPolicyLayout,
  LakeFreshPolicyList,
  LakeFreshPolicySection,
} from "@/components/lf/LakeFreshPolicyLayout";

const LakeFreshPrivacy = () => (
  <LakeFreshPolicyLayout
    seo="lfPrivacy"
    seoPath="/privacy"
    eyebrow="Your Information"
    title="Privacy Policy"
    intro="You choose your fish and we bring it to your door. This page explains what information we need to do that, why we need it and how we look after it."
  >
    <LakeFreshPolicySection title="Who we are">
      <p>
        Lake Fresh Fish Mart is a fresh fish store in Blantyre, Malawi. We are a registered business
        in Malawi. We sell fresh fish from Lake Malawi, seasonings and simple recipes. We pack fish
        in Blantyre and deliver it to homes and kitchens in our delivery areas.
      </p>
      <p>
        If you have a question about your information, chat with us on WhatsApp. The link is at the
        bottom of this page.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Information we collect">
      <LakeFreshPolicyList
        items={[
          "Your name, phone number and email address, when you give them to us.",
          "Your delivery area, house number, street name, landmark, map pin and delivery notes.",
          "The fish, seasonings and recipe you choose, plus your order history.",
          "Your payment status, payment reference and refund details from PayChangu.",
          "Messages you send us on WhatsApp or through the store.",
          "Basic phone or browser details that help the store work and keep it safe.",
        ]}
      />
      <p>
        We do not keep full card numbers. PayChangu handles your payment details and gives us only
        the information we need to confirm your order.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="How we use your information">
      <LakeFreshPolicyList
        items={[
          "To take your order, pack it and send it with our driver.",
          "To call or message you about your order, delivery window or address.",
          "To make a route sheet so our driver can find your home or kitchen.",
          "To keep a photo after delivery, when we need proof that an order arrived.",
          "To answer your questions and solve problems with an order.",
          "To handle refunds, rewards, referrals and manual subscriptions.",
          "To keep records for accounting and to stop fraud.",
        ]}
      />
      <p>
        We use your information to carry out our agreement with you, to follow Malawi law and to
        keep the store safe. We ask for your permission before sending you offers.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Sharing your information">
      <p>
        We share only what is needed to complete your order. This can include our delivery team,
        PayChangu, our website host and the services that help us send messages or store photos.
      </p>
      <p>
        We do not sell your information. We do not give it to advertisers for their own marketing.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Keeping your information safe">
      <p>
        We limit access to the people who need your information to pack, deliver and support your
        order. We use tools with access controls to keep order records and photos safe.
      </p>
      <p>
        No online system is risk free. If you think your information has been misused, tell us right
        away so we can look into it.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="How long we keep information">
      <p>
        We keep order, payment and delivery records for as long as we need them for service,
        accounting and Malawi law. We keep marketing messages only until you ask us to stop.
      </p>
      <p>
        Delivery photos are kept for order records and to solve disputes. You can ask us to remove a
        photo when we no longer need it.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Your rights">
      <p>
        Malawi's Data Protection Act No. 3 of 2024 gives you rights over your personal information.
        You can ask us to show you what we hold, correct it, delete it when we no longer need it, or
        stop using it for marketing.
      </p>
      <p>
        Send your request on WhatsApp. We may ask you to confirm your identity first. We will reply
        as soon as we can. If you are not happy with our answer, you may contact Malawi's Data
        Protection Authority hosted by MACRA.
      </p>
      <p>
        Data Protection Authority contacts: info@dpa.mw, phone +265 991 80 21 80, 1st Floor, Green
        Heritage House, 2 Khonje Close, City Centre, Lilongwe.
      </p>
      <p>
        If your complaint is about how we sell to you or treat our customers, you may also contact the
        Competition and Fair Trading Commission (CFTC) in Malawi.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Subscriptions and messages">
      <p>
        Our subscriptions use manual payment. You choose and pay each cycle yourself. We do not take
        money on a schedule and we do not keep a card for future payment.
      </p>
      <p>
        We send order and delivery messages because you placed an order. We send offers only if you
        have agreed to them. You can ask us to stop at any time.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Cookies and local storage">
      <p>
        We use essential cookies and local storage to keep your basket, sign in and referral details
        working. You can clear them in your browser, but parts of the store may stop working.
      </p>
    </LakeFreshPolicySection>

    <LakeFreshPolicySection title="Changes to this policy">
      <p>
        We may update this page as our store grows. The version on this page applies when you use
        the store.
      </p>
    </LakeFreshPolicySection>
  </LakeFreshPolicyLayout>
);

export default LakeFreshPrivacy;
