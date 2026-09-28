import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
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
      <div style="min-height:100vh;background:#09090b;color:#f87171;padding:24px;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <h2 style="font-size:20px;font-weight:bold;margin-bottom:8px;color:#ffffff;">ONEVA could not load this screen.</h2>
        <p style="color:#94a3b8;font-size:13px;max-width:380px;margin-bottom:16px;">An unexpected error occurred during application initialization.</p>
        <pre style="background:#18181b;border:1px solid #27272a;padding:12px;border-radius:12px;color:#e2e8f0;font-size:11px;max-width:90%;overflow:auto;margin-bottom:20px;">${err?.stack || err?.message || String(err)}</pre>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <button onclick="window.location.reload()" style="background:#0891b2;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;">Retry</button>
          <button onclick="window.location.reload()" style="background:#27272a;color:#cbd5e1;border:1px solid rgba(255,255,255,0.1);padding:10px 20px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;">Reload ONEVA</button>
          <button onclick="localStorage.removeItem('oneva_admin_view_active');window.location.href=window.location.pathname;" style="background:#27272a;color:#cbd5e1;border:1px solid rgba(255,255,255,0.1);padding:10px 20px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;">Open Home</button>
        </div>
      </div>
    `;
  }
}
