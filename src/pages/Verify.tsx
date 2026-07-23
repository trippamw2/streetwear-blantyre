import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert, QrCode, Package,
  MapPin, Calendar, Hash, ChevronRight, Heart, Share2,
  AlertTriangle, UserPlus, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProductAuthByToken } from "@/hooks/useProductAuth";

const Verify = () => {
  const { token } = useParams<{ token: string }>();
  const { product, loading, error } = useProductAuthByToken(token);
  const [scanLogged, setScanLogged] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    document.title = "Verify Product — Streetwear Blantyre";
  }, []);

  // Log scan on successful product load
  useEffect(() => {
    if (product && !scanLogged) {
      setScanLogged(true);
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android/i.test(ua);
      supabase.from("scan_logs").insert({
        product_auth_id: product.id,
        qr_token: product.qr_token,
        scan_result: product.authentication_status === "active" ? "authentic" : product.authentication_status,
        device_type: isMobile ? "mobile" : "desktop",
        browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Other",
        os: ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iOS") ? "iOS" : "Other",
      }).then(() => {
        // Update scan count
        supabase.rpc("record_scan" as any, {
          p_product_auth_id: product.id,
          p_qr_token: product.qr_token,
          p_scan_result: product.authentication_status === "active" ? "authentic" : product.authentication_status,
        }).then(() => {});
      });
    }
  }, [product, scanLogged]);

  const handleRegister = async () => {
    if (!product || !ownerName.trim()) return;
    setRegistering(true);
    await supabase.from("product_ownership").insert({
      product_auth_id: product.id,
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim() || null,
    });
    await supabase.from("product_auth").update({
      registered_owner_name: ownerName.trim(),
      registered_owner_phone: ownerPhone.trim() || null,
      registered_at: new Date().toISOString(),
    }).eq("id", product.id);
    setRegistered(true);
    setRegistering(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Verify: ${product?.product_name}`,
        text: `Authentic Streetwear Blantyre product — ${product?.product_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-500">Authenticating product...</p>
        </div>
      </div>
    );
  }

  // ─── Failed State ──────────────────────────────────────────────
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
            Authentication Failed
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            This product cannot be verified by Streetwear Blantyre.
            The Product ID or Serial Number does not exist in our database.
          </p>
          <p className="text-sm text-gray-400 mb-8">
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
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Return to Streetwear Blantyre
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Retired State ─────────────────────────────────────────────
  if (product.authentication_status === "retired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Product Retired
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            This Streetwear Blantyre product has been retired from our active collection.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 font-medium">{product.product_name}</p>
            <p className="text-xs text-gray-400 mt-1">Serial: {product.serial_number}</p>
          </div>
          <a
            href="mailto:support@wearsb.com?subject=Counterfeit%20Report"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Suspected Counterfeit
          </a>
        </motion.div>
      </div>
    );
  }

  // ─── Authentic State ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <div className="bg-gray-900 text-white py-4">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-wide">SB</span>
          <span className="text-xs text-white/50 uppercase tracking-widest">Verification</span>
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
            Authentic Streetwear Blantyre Product
          </h1>
          <p className="text-sm text-gray-500">Verified and authenticated</p>
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
            {product.product_image ? (
              <img
                src={product.product_image}
                alt={product.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1">
              {product.product_name}
            </h2>
            {product.collection && (
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full mb-4">
                {product.collection}
              </span>
            )}

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {product.category && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>{product.category}</span>
                </div>
              )}
              {product.color && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-4 w-4 rounded-full bg-gray-300 border border-gray-200" />
                  <span>{product.color}</span>
                </div>
              )}
              {product.size && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-xs font-medium text-gray-400">SIZE</span>
                  <span>{product.size}</span>
                </div>
              )}
              {product.material && (
                <div className="text-sm text-gray-600">
                  <span className="text-xs font-medium text-gray-400">MATERIAL</span>
                  <span className="ml-1">{product.material}</span>
                </div>
              )}
            </div>

            {/* Passport Info */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Product ID
                </span>
                <span className="font-mono text-gray-700">{product.product_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Serial Number
                </span>
                <span className="font-mono text-gray-700">{product.serial_number}</span>
              </div>
              {product.edition_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Edition</span>
                  <span className="font-mono text-gray-700">
                    #{product.edition_number}{product.quantity_produced ? ` of ${product.quantity_produced}` : ""}
                  </span>
                </div>
              )}
              {product.manufacturing_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Manufactured
                  </span>
                  <span className="text-gray-700">{product.manufacturing_date}</span>
                </div>
              )}
              {product.country_of_manufacture && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Origin
                  </span>
                  <span className="text-gray-700">{product.country_of_manufacture}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Verifications</span>
                <span className="text-gray-700">{product.total_scans}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Story */}
        {product.product_story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-sm p-6 mb-6"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Product Story</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.product_story}</p>
          </motion.div>
        )}

        {/* Care Instructions */}
        {product.care_instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-sm p-6 mb-6"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 mb-3">Care Guide</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.care_instructions}
            </p>
          </motion.div>
        )}

        {/* Register Product */}
        {!registered && !product.registered_owner_name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-sm p-6 mb-6"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Register Your Product</h3>
            <p className="text-sm text-gray-500 mb-4">Claim ownership of this authentic piece.</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
              <button
                onClick={handleRegister}
                disabled={!ownerName.trim() || registering}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {registering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Register Product
              </button>
            </div>
          </motion.div>
        )}

        {/* Already Registered */}
        {(registered || product.registered_owner_name) && (
          <div className="bg-green-50 rounded-3xl p-6 mb-6 text-center">
            <Heart className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">
              Registered to {product.registered_owner_name || ownerName}
            </p>
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 mb-8"
        >
          <Link
            to="/shop"
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-900">Explore More from This Collection</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-900">Share This Verification</span>
            <Share2 className="h-4 w-4 text-gray-400" />
          </button>
          <a
            href="mailto:support@wearsb.com?subject=Counterfeit%20Report"
            className="flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-600">Report Suspected Counterfeit</span>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </a>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-gray-400">
            Powered by Streetwear Blantyre Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verify;
