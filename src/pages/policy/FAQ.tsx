import { useState } from "react";
import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Truck, Shield, RotateCcw, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ = () => {
  const faqs = [
    {
      category: "Orders & Shipping",
      items: [
        { q: "How do I place an order?", a: "Browse our products, add items to cart, and proceed to checkout. You'll receive a confirmation via WhatsApp." },
        { q: "How long does delivery take?", a: "Standard delivery: 3-5 business days. Express delivery: 1-2 business days. Delivery times may vary by location in Malawi." },
        { q: "Do you deliver everywhere in Malawi?", a: "Yes! We deliver to all districts in Malawi including Lilongwe, Blantyre, Mzuzu, Zomba, and rural areas." },
      ]
    },
    {
      category: "Payments",
      items: [
        { q: "What payment methods do you accept?", a: "We accept Airtel Money, TNM Mpamba, and bank transfers via PayChangu." },
        { q: "Is my payment secure?", a: "Yes! All payments are processed through PayChangu, a secure payment platform licensed in Malawi." },
      ]
    },
    {
      category: "Returns & Warranty",
      items: [
        { q: "What is your return policy?", a: "We offer a 7-day return policy for defective products. Products must be in original packaging with all accessories." },
        { q: "Do products have warranty?", a: "Yes! All items come with a 30-day quality guarantee. We replace defective products." },
        { q: "How do I claim warranty?", a: "Contact us via WhatsApp with your order number and product details. We'll guide you through the process." },
      ]
    },
    {
      category: "Products",
      items: [
        { q: "Are your products genuine?", a: "Yes! All Streetwear Blantyre items are designed and curated by our team. Premium quality fabrics and construction." },
        { q: "Do you sell wholesale?", a: "Yes! Contact us via WhatsApp for wholesale inquiries." },
      ]
    },
  ];

  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <SEO {...defaultSEO.faq} />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Find answers to common questions about Streetwear Blantyre</p>
      </div>

      <div className="space-y-8">
        {faqs.map((category) => (
          <div key={category.category}>
            <h2 className="font-semibold text-xl mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.items.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-gray-50 rounded-2xl text-center">
        <p className="font-medium mb-2">Still have questions?</p>
        <p className="text-muted-foreground text-sm mb-4">We're here to help!</p>
        <Button asChild>
          <Link to="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium pr-4">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQ;