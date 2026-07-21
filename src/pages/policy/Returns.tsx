import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Package, Check, Clock } from "lucide-react";

const Returns = () => {
  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <SEO {...defaultSEO.returns} />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-6">Returns & Refunds</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-muted-foreground">We want you to love your Streetwear Blantyre products. If you're not satisfied, we're here to help.</p>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-teal-600" /> Our Return Policy
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>7-day return window from delivery date</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Products must be unused, in original packaging</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>All accessories and tags must be intact</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Proof of purchase required</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">Items Not Eligible for Return</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Used or opened products</li>
            <li>• Software and digital content</li>
            <li>• Products damaged by misuse</li>
            <li>• Sale items (unless defective)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" /> How to Initiate a Return
          </h2>
          <ol className="space-y-2 text-gray-600 list-decimal list-inside">
            <li>Contact us via WhatsApp with your order number</li>
            <li>Describe the issue with your product</li>
            <li>We'll arrange pickup or provide return instructions</li>
            <li>Refund processed within 5-7 business days</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" /> Refund Process
          </h2>
          <p className="text-gray-600">Once we receive and inspect your return, we'll process your refund within 5-7 business days. Refunds will be credited to your original payment method or mobile money account.</p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t">
        <Button asChild>
          <Link to="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
};

export default Returns;