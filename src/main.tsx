import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./App.css";

// Visual debug helper
function showStep(step: string) {
  console.log(`[main.tsx] ${step}`);
  const statusEl = document.getElementById('loader-status');
  if (statusEl) {
    statusEl.textContent = step;
  }
}

showStep('main.tsx starting...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  showStep('Root element found');
  
  // Remove initial loader before React mounts
  const initialLoader = document.getElementById("initial-loader");
  if (initialLoader) {
    initialLoader.remove();
    showStep('Loader removed');
  }
  
  // Add debug indicator that React is working
  const debugIndicator = document.createElement('div');
  debugIndicator.id = 'react-debug';
  debugIndicator.style.cssText = 'position:fixed;top:0;left:0;background:#0f0;color:#000;padding:4px 8px;font-size:12px;z-index:99999;font-family:monospace;';
  debugIndicator.textContent = 'React starting...';
  document.body.appendChild(debugIndicator);
  
  showStep('Creating React root...');
  const root = createRoot(rootElement);
  showStep('React root created');
  
  // Test render with simple div first
  showStep('Testing simple render...');
  root.render(<div style={{padding: 20, background: '#1a1a2e', color: '#fff', fontFamily: 'system-ui'}}>
    <h1>React is working!</h1>
    <p>If you see this, React rendered successfully.</p>
    <p>Loading App component...</p>
  </div>);
  
  showStep('Simple render done - loading App...');
  
  // Replace with actual App after 1 second
  setTimeout(() => {
    showStep('Mounting App...');
    root.render(<App />);
    showStep('App mounted');
  }, 1000);
  
} catch (err) {
  console.error("[main.tsx] Fatal error:", err);
  showStep(`ERROR: ${(err as Error).message}`);
  
  // Show error on screen
  const debugIndicator = document.getElementById('react-debug') || document.createElement('div');
  debugIndicator.id = 'react-debug';
  debugIndicator.style.cssText = 'position:fixed;top:0;left:0;background:#f00;color:#fff;padding:8px;z-index:99999;';
  debugIndicator.textContent = `ERROR: ${(err as Error).message}`;
  if (!document.getElementById('react-debug')) {
    document.body.appendChild(debugIndicator);
  }
}
