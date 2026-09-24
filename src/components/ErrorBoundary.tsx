import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { OnevaAppError, recordLocalError } from '../core/error/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    const appError = new OnevaAppError({
      message: error.message || 'React rendering component caught an exception',
      featureName: 'CoreUI',
      severity: 'error',
    });
    recordLocalError(appError);

    return {
      hasError: true,
      errorId: appError.errorId,
      errorMessage: appError.userFacingMessage,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ONEVA ErrorBoundary Caught]:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Interface Recovery</h2>
            <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
              ONEVA encountered an isolated rendering event. Your local device data and state remain completely safe.
            </p>
            {this.state.errorId && (
              <p className="font-mono text-xs text-neutral-500 mb-6">
                Event Reference: {this.state.errorId}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-900 font-medium text-sm hover:bg-neutral-200 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload ONEVA</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
