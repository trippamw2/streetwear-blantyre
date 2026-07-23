import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Package, MapPin, Calendar, Hash, Heart, Share2,
  Clock, User, ChevronRight, Loader2, Shirt,
} from "lucide-react";
import { useProductAuthByToken } from "@/hooks/useProductAuth";

const Passport = () => {
  const { token } = useParams<{ token: string }>();
  const { product, loading, error } = useProductAuthByToken(token);

  useEffect(() => {
    document.title = "Digital Product Passport — Streetwear Blantyre";
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `SB Passport: ${product?.product_name}`,
        text: `Digital Product Passport — ${product?.product_name} (${product?.serial_number})`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/50 mx-auto mb-4" />
          <p className="text-white/40">Loading passport...</p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-white mb-2">Passport Not Found</h1>
          <p className="text-white/40 text-sm">This product does not have a valid digital passport.</p>
          <Link to="/" className="mt-6 inline-block text-sm text-white/60 hover:text-white transition-colors">
            Return to Streetwear Blantyre
          </Link>
        </div>
      </div>
    );
  }

  // ─── Passport ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-900 overflow-hidden">
          {product.product_image ? (
            <img
              src={product.product_image}
              alt={product.product_name}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-24 w-24 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        </div>

        {/* Passport Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-6"
        >
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-[0.2em] mb-3">
            <Shield className="h-3.5 w-3.5" />
            <span>Digital Product Passport</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{product.product_name}</h1>
          {product.collection && (
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium rounded-full">
              {product.collection}
            </span>
          )}
        </motion.div>
      </div>

      <div className="px-6 py-8 space-y-6 max-w-lg mx-auto">
        {/* Passport Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/40 uppercase tracking-widest">Passport Details</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              product.authentication_status === "active" ? "bg-green-500/20 text-green-400" :
              product.authentication_status === "retired" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-white/10 text-white/50"
            }`}>
              {product.authentication_status}
            </span>
          </div>

          <div className="space-y-3">
            <PassportField icon={<Hash className="h-3.5 w-3.5" />} label="Product ID" value={product.product_id} mono />
            <PassportField icon={<Hash className="h-3.5 w-3.5" />} label="Serial Number" value={product.serial_number} mono />
            {product.edition_number && (
              <PassportField
                icon={<Package className="h-3.5 w-3.5" />}
                label="Edition"
                value={`#${product.edition_number}${product.quantity_produced ? ` of ${product.quantity_produced}` : ""}`}
                mono
              />
            )}
          </div>
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xs text-white/40 uppercase tracking-widest mb-4">Product Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {product.category && <DetailCard icon={<Package className="h-4 w-4" />} label="Category" value={product.category} />}
            {product.color && <DetailCard icon={<div className="h-4 w-4 rounded-full bg-white/20" />} label="Color" value={product.color} />}
            {product.size && <DetailCard icon={<Shirt className="h-4 w-4" />} label="Size" value={product.size} />}
            {product.material && <DetailCard icon={<Heart className="h-4 w-4" />} label="Material" value={product.material} />}
            {product.print_technique && <DetailCard icon={<Shirt className="h-4 w-4" />} label="Print" value={product.print_technique} />}
            {product.fabric_weight && <DetailCard icon={<Shirt className="h-4 w-4" />} label="Weight" value={product.fabric_weight} />}
          </div>
        </motion.div>

        {/* Manufacturing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xs text-white/40 uppercase tracking-widest mb-4">Manufacturing</h3>
          <div className="space-y-3">
            {product.country_of_manufacture && (
              <PassportField icon={<MapPin className="h-3.5 w-3.5" />} label="Origin" value={product.country_of_manufacture} />
            )}
            {product.manufacturing_date && (
              <PassportField icon={<Calendar className="h-3.5 w-3.5" />} label="Manufactured" value={product.manufacturing_date} />
            )}
          </div>
        </motion.div>

        {/* Product Story */}
        {product.product_story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
          >
            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Product Story</h3>
            <p className="text-sm text-white/70 leading-relaxed">{product.product_story}</p>
          </motion.div>
        )}

        {/* Care Guide */}
        {product.care_instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
          >
            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Care Guide</h3>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{product.care_instructions}</p>
          </motion.div>
        )}

        {/* Ownership */}
        {product.registered_owner_name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
          >
            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Registered Owner</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-white/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{product.registered_owner_name}</p>
                {product.registered_at && (
                  <p className="text-xs text-white/40">
                    Registered {new Date(product.registered_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Authentication Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Authentication</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{product.total_scans}</p>
              <p className="text-xs text-white/40">Verifications</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {product.first_scan_date ? new Date(product.first_scan_date).toLocaleDateString() : "—"}
              </p>
              <p className="text-xs text-white/40">First Scan</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {product.last_scan_date ? new Date(product.last_scan_date).toLocaleDateString() : "—"}
              </p>
              <p className="text-xs text-white/40">Last Scan</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 pb-8"
        >
          <button
            onClick={handleShare}
            className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-white/80">Share This Passport</span>
            <Share2 className="h-4 w-4 text-white/40" />
          </button>
          <Link
            to="/shop"
            className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-white/80">Explore Collection</span>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </Link>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-white/20">
            Streetwear Blantyre — Digital Product Passport
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────

const PassportField = ({ icon, label, value, mono }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-white/40 flex items-center gap-1.5">{icon} {label}</span>
    <span className={`text-sm text-white/80 ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
);

const DetailCard = ({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-white/5 rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-white/40 mb-1">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
    <p className="text-sm text-white/80 font-medium">{value}</p>
  </div>
);

export default Passport;
