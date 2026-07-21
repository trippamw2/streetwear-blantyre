import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Sentry from "@/lib/sentry";
import App from "./App.tsx";
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

const AppWrapper = () => {
  return (
    <StrictMode>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh.</p>}>
        <Suspense fallback={<LoadingSpinner />}>
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
