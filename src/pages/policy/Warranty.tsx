import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Check, Clock, MessageCircle, FileText } from "lucide-react";

const Warranty = () => {
  const warrantyInfo = [
    { brand: "SB Original", period: "30 days", coverage: "Quality guarantee on all items" },
    { brand: "SB Street", period: "30 days", coverage: "Quality guarantee on all items" },
  ];

  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <SEO {...defaultSEO.warranty} />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-6">Warranty Information</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-muted-foreground">All Streetwear Blantyre products come with a quality guarantee for your peace of mind.</p>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" /> What's Covered
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Manufacturing defects</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Hardware malfunctions</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Battery issues (for applicable products)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Charging port issues</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" /> Warranty by Brand
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {warrantyInfo.map((item) => (
              <div key={item.brand} className="p-4 border border-gray-200 rounded-xl">
                <p className="font-semibold">{item.brand}</p>
                <p className="text-sm text-gray-600">{item.period} warranty</p>
                <p className="text-xs text-muted-foreground">{item.coverage}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" /> How to Claim Warranty
          </h2>
          <ol className="space-y-2 text-gray-600 list-decimal list-inside">
            <li>Contact us via WhatsApp with your order number</li>
            <li>Describe the issue you're experiencing</li>
            <li>We'll arrange inspection or replacement</li>
            <li>Repairs typically take 7-14 business days</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl">What's NOT Covered</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Physical damage or drops</li>
            <li>• Water or liquid damage</li>
            <li>• Unauthorized repairs or modifications</li>
            <li>• Normal wear and tear</li>
            <li>• Accessories (cables, chargers)</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 p-6 bg-teal-50 rounded-2xl">
        <p className="font-medium mb-2">Need warranty support?</p>
        <p className="text-sm text-muted-foreground mb-4">Contact us on WhatsApp for immediate assistance</p>
        <Button asChild>
          <Link to="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
};

export default Warranty;