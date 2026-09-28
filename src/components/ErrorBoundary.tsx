import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home } from 'lucide-react';
import { OnevaAppError, recordLocalError } from '../core/error/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  errorId?: string;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    const appError = new OnevaAppError({
      message: error?.message || 'React rendering component caught an exception',
      featureName: 'CoreUI',
      severity: 'error',
    });
    recordLocalError(appError);

    // Notify native Android bridge if available
    try {
      if (typeof window !== 'undefined') {
        const bridge = (window as any).OnevaNativeBridge;
        if (bridge && typeof bridge.reportStartupError === 'function') {
          bridge.reportStartupError('React ErrorBoundary', error?.stack || error?.message || String(error));
        }
      }
    } catch {
      // Ignore bridge errors during boundary render
    }

    return {
      hasError: true,
      error,
      errorId: appError.errorId,
      errorMessage: error?.message || appError.userFacingMessage,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ONEVA Fatal Error Caught by ErrorBoundary]:', error, errorInfo);
  }

  private handleRetry = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.warn('onReset error:', e);
      }
    }
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleOpenHome = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        localStorage.removeItem('oneva_admin_view_active');
      } catch {
        // Ignore
      }
      window.location.href = window.location.pathname;
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          id="oneva-error-recovery-screen"
          className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 select-none"
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              ONEVA could not load this screen.
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mb-4 leading-relaxed">
              An unexpected rendering interruption occurred. Your device, customizations, and settings remain safe.
            </p>

            {this.state.errorMessage && (
              <div className="text-left bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 mb-6 max-h-32 overflow-y-auto">
                <span className="text-[10px] font-mono text-neutral-500 block mb-1 uppercase tracking-wider">
                  Diagnostic Message
                </span>
                <p className="text-xs font-mono text-rose-300 break-words">
                  {this.state.errorMessage}
                </p>
              </div>
            )}

            {/* Action Buttons: Retry, Reload ONEVA, Open Home */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload ONEVA</span>
              </button>

              <button
                type="button"
                onClick={this.handleOpenHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Open Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
