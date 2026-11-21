import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Sentry from "@/lib/sentry";
import App from "./App.tsx";
import { IS_LF_SITE } from "@/lib/brandSite";
import "./index.css";

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

const LakeFreshLoading = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#EAF6FB',
  }}>
    <img
      src="/brand/lake-fresh/icon.png"
      alt="Lake Fresh Fish Mart"
      style={{ width: 180, maxWidth: '60vw', height: 'auto', objectFit: 'contain' }}
    />
  </div>
);

const LoadingFallback = () => (IS_LF_SITE ? <LakeFreshLoading /> : <LoadingSpinner />);

const AppWrapper = () => {
  return (
    <StrictMode>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh.</p>}>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </Sentry.ErrorBoundary>
    </StrictMode>
  );
};

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<AppWrapper />);

// The offline shell is Lake Fresh only. Streetwear keeps its current behavior.
if (IS_LF_SITE && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is optional; never block the storefront if it fails.
    });
  });
}
