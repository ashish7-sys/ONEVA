import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers for native diagnostic safety layer
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[ONEVA Fatal Runtime Error]', event.error || event.message);
    const bridge = (window as any).OnevaNativeBridge;
    if (bridge && typeof bridge.reportStartupError === 'function') {
      bridge.reportStartupError(
        'JavaScript Runtime Error',
        `${event.message || 'Script error'} (${event.filename || 'bundle'}:${event.lineno || 0})`
      );
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[ONEVA Fatal Unhandled Rejection]', event.reason);
    const bridge = (window as any).OnevaNativeBridge;
    if (bridge && typeof bridge.reportStartupError === 'function') {
      bridge.reportStartupError(
        'Unhandled Promise Rejection',
        String(event.reason?.message || event.reason || 'Unknown rejection')
      );
    }
  });
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    // Notify native Android bridge that application has mounted successfully
    setTimeout(() => {
      const bridge = (window as any).OnevaNativeBridge;
      if (bridge && typeof bridge.notifyStartupSuccess === 'function') {
        bridge.notifyStartupSuccess();
      }
    }, 150);
  } else {
    const errorMsg = 'Root DOM element (#root) not found in document';
    console.error('[ONEVA Mount Error]', errorMsg);
    const bridge = (window as any).OnevaNativeBridge;
    if (bridge && typeof bridge.reportStartupError === 'function') {
      bridge.reportStartupError('DOM Initialization', errorMsg);
    }
  }
} catch (err: any) {
  console.error('[ONEVA Fatal Mount Exception]', err);
  const bridge = (window as any).OnevaNativeBridge;
  if (bridge && typeof bridge.reportStartupError === 'function') {
    bridge.reportStartupError('React Root Mount', err?.message || String(err));
  }
  // Render visual in-page fallback if root exists
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height:100vh;background:#09090b;color:#f87171;padding:24px;font-family:monospace;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <h2 style="font-size:20px;font-weight:bold;margin-bottom:12px;color:#ef4444;">ONEVA Startup Recovery</h2>
        <p style="color:#94a3b8;font-size:14px;max-width:400px;margin-bottom:20px;">An unexpected error occurred during application initialization.</p>
        <pre style="background:#18181b;padding:16px;border-radius:12px;color:#e2e8f0;font-size:12px;max-width:90%;overflow:auto;">${err?.stack || err?.message || String(err)}</pre>
        <button onclick="window.location.reload()" style="margin-top:24px;background:#059669;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;">Retry</button>
      </div>
    `;
  }
}
