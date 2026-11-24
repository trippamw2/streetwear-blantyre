import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <div className="bg-primary px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground">
      Your Style. Your Everyday. | Delivery across Malawi
    </div>
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <WhatsAppFab />
  </div>
);
