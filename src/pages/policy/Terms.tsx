import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <SEO {...defaultSEO.terms} />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-6">Terms & Conditions</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: April 2026</p>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">1. Acceptance of Terms</h2>
          <p className="text-gray-600">By accessing and using the Streetwear Blantyre website, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">2. Product Information</h2>
          <p className="text-gray-600">We strive to ensure all product information is accurate and up-to-date. However, we cannot guarantee that all information is completely accurate at all times. Product images are for illustration purposes only.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">3. Ordering & Payment</h2>
          <p className="text-gray-600">Orders are subject to availability and confirmation. We accept payment via PayChangu, Airtel Money, and TNM Mpamba. All prices are in MWK (Malawian Kwacha).</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">4. Delivery</h2>
          <p className="text-gray-600">We deliver across Malawi. Standard delivery takes 3-5 business days. Express delivery takes 1-2 business days. Delivery times may vary based on location.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">5. Warranty</h2>
          <p className="text-gray-600">All electronics come with at least 6 months manufacturer warranty. Warranty terms vary by product. Please check product pages for specific warranty details.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">6. Returns & Refunds</h2>
          <p className="text-gray-600">We offer a 7-day return policy for defective products. Products must be in original packaging with all accessories. Refunds are processed within 5-7 business days.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">7. Contact Us</h2>
          <p className="text-gray-600">For questions about these terms, please contact us via WhatsApp or email.</p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t">
        <Button asChild variant="outline">
          <Link to="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
};

export default Terms;