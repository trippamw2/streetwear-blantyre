import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldX, Package, Hash, Share2, AlertTriangle, Loader2, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";

interface ProductRecord {
  id: string;
  name: string;
  benefit: string | null;
  price: number;
  category: string;
  brand: string | null;
  image: string | null;
  images: string[] | null;
  barcode: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface AuthRecord {
  id: string;
  product_name: string;
  product_image: string | null;
  serial_number: string;
  qr_token: string;
  authentication_status: string;
  total_scans: number;
  registered_owner_name: string | null;
}

const Scan = () => {
  const { barcode } = useParams<{ barcode: string }>();
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [authRecord, setAuthRecord] = useState<AuthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanLogged, setScanLogged] = useState(false);

  useEffect(() => {
    document.title = "Scan Product | SB";
  }, []);

  useEffect(() => {
    if (!barcode) {
      setLoading(false);
      setError("No barcode provided");
      return;
    }

    const fetchProduct = async () => {
      // Look up product by barcode
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", barcode)
        .eq("is_active", true)
        .single();

      if (productError || !productData) {
        setError("Product not found");
        setLoading(false);
        return;
      }

      setProduct(productData as ProductRecord);

      // Check if this product has an authentication record
      const { data: authData } = await supabase
        .from("product_auth")
        .select("*")
        .eq("product_id", productData.id)
        .eq("authentication_status", "active")
        .limit(1)
        .maybeSingle();

      if (authData) {
        setAuthRecord(authData as unknown as AuthRecord);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [barcode]);

  // Log scan
  useEffect(() => {
    if (product && !scanLogged) {
      setScanLogged(true);
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android/i.test(ua);
      
      // Log the scan
      supabase.from("scan_logs").insert({
        product_auth_id: authRecord?.id || product.id,
        qr_token: barcode || "",
        scan_result: "authentic",
        device_type: isMobile ? "mobile" : "desktop",
        browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Other",
        os: ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iOS") ? "iOS" : "Other",
      }).then(() => {});
    }
  }, [product, scanLogged, authRecord, barcode]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Verify: ${product?.name}`,
        text: `Authentic SB product, ${product?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Scanning product...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            This barcode does not match any SB product in our database.
          </p>
          <p className="text-sm text-gray-600 mb-8">
            This item may be counterfeit or unauthorized.
          </p>
          <a
            href="mailto:support@wearsb.com?subject=Counterfeit%20Report"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Suspected Counterfeit
          </a>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Return to SB
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authentic State
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <div className="bg-gray-100 text-gray-900 py-4">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-wide">STREETWEAR BLANTYRE</span>
          <span className="text-xs text-gray-900/50 uppercase tracking-widest">Product Scan</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Success Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-10 w-10 text-green-600" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-4 mb-2">
            Authentic SB Product
          </h1>
          <p className="text-sm text-gray-600">Verified and authenticated</p>
        </motion.div>

        {/* Product Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden mb-6"
        >
          {/* Product Image */}
          <div className="aspect-square bg-gray-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain object-center bg-gray-100 sm:object-cover sm:object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1">
              {product.name}
            </h2>
            {product.brand && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-900 text-xs font-medium rounded-full mb-4">
                {product.brand}
              </span>
            )}

            {/* Price */}
            <div className="mt-4 mb-4">
              <p className="text-2xl font-bold text-gray-900">{formatMWK(product.price)}</p>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {product.category && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span>{product.category}</span>
                </div>
              )}
              {product.brand && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-xs font-medium text-gray-600">BRAND</span>
                  <span>{product.brand}</span>
                </div>
              )}
            </div>

            {/* Barcode Info */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Barcode
                </span>
                <span className="font-mono text-gray-700">{product.barcode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Product ID
                </span>
                <span className="font-mono text-gray-700">{product.id}</span>
              </div>
              {authRecord && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Serial Number
                    </span>
                    <span className="font-mono text-gray-700">{authRecord.serial_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Authentication Status</span>
                    <span className="text-green-600 font-medium">{authRecord.authentication_status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Verifications</span>
                    <span className="text-gray-700">{authRecord.total_scans}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Product Description */}
        {product.benefit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-sm p-6 mb-6"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 mb-3">About This Product</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.benefit}</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          <Link
            to={`/product/${product.id}`}
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-900">View Full Product Details</span>
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-900">Share This Scan</span>
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
          <a
            href="mailto:support@wearsb.com?subject=Counterfeit%20Report"
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-600">Report Suspected Counterfeit</span>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </a>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-gray-600">
            Powered by SB Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scan;
