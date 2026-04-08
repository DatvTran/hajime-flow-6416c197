import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./App.css";

console.log("[main.tsx] Starting React app...");

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  console.log("[main.tsx] Root element found");
  
  const root = createRoot(rootElement);
  console.log("[main.tsx] React root created");
  
  root.render(
    <App />
  );
  console.log("[main.tsx] App rendered");
} catch (err) {
  console.error("[main.tsx] Fatal error:", err);
  const debugLog = document.getElementById("debug-log");
  const debugOverlay = document.getElementById("debug-overlay");
  if (debugLog && debugOverlay) {
    debugLog.textContent += "\n\n[FATAL ERROR] " + (err as Error).message + "\n" + (err as Error).stack;
    debugOverlay.style.display = "block";
  }
}
