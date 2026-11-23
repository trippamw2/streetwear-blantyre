import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PolicyLayout } from "./PolicyLayout";

const faqGroups = [
  {
    category: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse the shop, choose your size and add the piece to your bag. Then head to checkout, enter your delivery details and pay with the options shown. You will get a confirmation once your order is placed.",
      },
      {
        q: "Can I order without an account?",
        a: "Yes. You can check out as a guest. Creating an account lets you track orders and save your favourite pieces for later.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Message us on WhatsApp as soon as possible. If the order has not been dispatched, we can usually change or cancel it. Once it is on the way, you may need to use our returns process.",
      },
      {
        q: "Do you restock sold out sizes?",
        a: "Sometimes. It depends on the supplier. Message us with the item and size you want and we will let you know when it is likely to return.",
      },
    ],
  },
  {
    category: "Sizing & Fit",
    items: [
      {
        q: "How do I know which size to choose?",
        a: "Each product page lists the available sizes. If you are between sizes, message us on WhatsApp and we will help you choose based on how you like your fit.",
      },
      {
        q: "What if the size is wrong?",
        a: "We offer size exchanges within 14 days of delivery, provided the item is unworn with tags attached and the size you need is in stock. See our Returns page for details.",
      },
      {
        q: "Are the jerseys true to size?",
        a: "Football jerseys often run slightly fitted. If you prefer a relaxed fit, consider going one size up. Ask us if you are unsure.",
      },
    ],
  },
  {
    category: "Delivery",
    items: [
      {
        q: "Where do you deliver?",
        a: "We deliver across Malawi. Blantyre orders can often be delivered same day or within 1 to 3 days. Other areas usually take 3 to 5 working days.",
      },
      {
        q: "How much is delivery?",
        a: "Delivery is calculated at checkout based on your location and order value. Orders over MK 50,000 qualify for free delivery.",
      },
      {
        q: "Can I collect from the store?",
        a: "Yes. Store pickup in Blantyre is available. Choose the pickup option at checkout and we will message you when your order is ready.",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept mobile money and bank transfer through our secure payment partner. The available options are shown at checkout.",
      },
      {
        q: "Is it safe to pay online?",
        a: "Payments are handled by our payment provider. We do not store your full card or mobile money details on our site.",
      },
      {
        q: "Do you offer cash on delivery?",
        a: "Cash on delivery is not currently offered. Payment is completed before dispatch.",
      },
    ],
  },
  {
    category: "Returns & Quality",
    items: [
      {
        q: "What is your return policy?",
        a: "Unworn items with tags attached can be returned or exchanged within 14 days of delivery. Faulty items are covered separately by our 30 day quality cover.",
      },
      {
        q: "What if my item arrives faulty?",
        a: "Message us with your order number and a photo of the fault. If it is a manufacturing fault, we will repair, replace or refund it under our quality cover.",
      },
      {
        q: "Are your items genuine?",
        a: "Yes. We source from trusted brands and suppliers. We are a retailer and do not manufacture the branded items we sell.",
      },
    ],
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<string | null>("0-0");

  return (
    <PolicyLayout
      seo="faq"
      eyebrow="Good to Know"
      title="Frequently Asked Questions"
      intro="Quick answers about ordering, sizing, delivery, payments and returns at Wear What Speaks."
    >
      <div className="space-y-8">
        <section id="size-guide" className="scroll-mt-24 space-y-3">
          <h2 className="font-display text-lg font-bold text-gray-900 sm:text-xl">Size Guide</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Use your usual streetwear size for a relaxed fit. If you prefer a closer fit, size down. Compare a favourite item laid flat across the chest for the best match.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Size</th>
                  <th className="px-4 py-3 text-left font-semibold">Chest (cm)</th>
                  <th className="px-4 py-3 text-left font-semibold">Length (cm)</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-t border-gray-200"><td className="px-4 py-3">S</td><td className="px-4 py-3">96 to 101</td><td className="px-4 py-3">68</td></tr>
                <tr className="border-t border-gray-200"><td className="px-4 py-3">M</td><td className="px-4 py-3">101 to 106</td><td className="px-4 py-3">71</td></tr>
                <tr className="border-t border-gray-200"><td className="px-4 py-3">L</td><td className="px-4 py-3">106 to 112</td><td className="px-4 py-3">74</td></tr>
                <tr className="border-t border-gray-200"><td className="px-4 py-3">XL</td><td className="px-4 py-3">112 to 117</td><td className="px-4 py-3">76</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        {faqGroups.map((group, groupIndex) => (
          <section key={group.category} className="space-y-3">
            <h2 className="font-display text-lg font-bold text-gray-900 sm:text-xl">
              {group.category}
            </h2>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {group.items.map((item, itemIndex) => {
                const key = `${groupIndex}-${itemIndex}`;
                const isOpen = open === key;
                return (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-gray-900 sm:text-base">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PolicyLayout>
  );
};

export default FAQ;
