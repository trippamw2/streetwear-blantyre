import { Link } from "react-router-dom";
import { SEO, defaultSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Mail } from "lucide-react";

const Privacy = () => {
  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <SEO {...defaultSEO.privacy} />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-6">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: April 2026</p>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" /> Information We Collect
          </h2>
          <p className="text-gray-600">We collect information you provide directly to us, including name, phone number, location, and payment information when placing orders.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Eye className="h-5 w-5 text-teal-600" /> How We Use Your Information
          </h2>
          <p className="text-gray-600">We use your information to process orders, deliver products, communicate with you about orders, and improve our services.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Lock className="h-5 w-5 text-teal-600" /> Data Security
          </h2>
          <p className="text-gray-600">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or disclosure.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-600" /> Contact Us
          </h2>
          <p className="text-gray-600">For questions about this privacy policy, please contact us via WhatsApp or email.</p>
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

export default Privacy;