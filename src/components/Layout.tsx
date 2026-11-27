import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
    >
      Skip to content
    </a>
    <div className="bg-primary px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground">
      Your Style. Your Everyday. | Delivery across Malawi
    </div>
    <Navbar />
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <Outlet />
    </main>
    <Footer />
    <WhatsAppFab />
  </div>
);
