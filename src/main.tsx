import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { registerOffline } from "./lib/offline-status";
import "./index.css";
import "./App.css";

declare global {
  interface Window {
    __hajimeMarkBooted?: () => void;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(<App />);
window.__hajimeMarkBooted?.();

if (import.meta.env.PROD) void registerOffline();
