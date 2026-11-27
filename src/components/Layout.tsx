import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-[#fbfbfc] text-foreground selection:bg-primary selection:text-white">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      Skip to content
    </a>
    <div className="relative overflow-hidden bg-[#0a0a0a] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-[11px]">
      <span className="relative z-10">Your Style. Your Everyday. &nbsp;·&nbsp; Delivery across Malawi</span>
    </div>
    <Navbar />
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <Outlet />
    </main>
    <Footer />
    <WhatsAppFab />
  </div>
);
