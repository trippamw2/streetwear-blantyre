import { useState } from "react";
import { buildWhatsAppLink, defaultMessage } from "@/lib/whatsapp";
import { MessageCircle, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const WhatsAppFab = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 z-50">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-12 sm:bottom-16 right-0 w-64 sm:w-72 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-border p-3 sm:p-4 max-w-[85vw]"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Streetwear Blantyre Support</p>
                <p className="text-xs text-green-600">Replies quickly</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Need help with your order?
            </p>
            <a
              href={buildWhatsAppLink(defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-center rounded-xl font-medium text-sm transition-colors"
            >
              Start Chat
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? "Close chat" : "Chat with us"}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-button hover:scale-110 transition-transform"
      >
        {expanded ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
