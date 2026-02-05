import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays user-friendly fallback UI.
 * Prevents entire app from crashing due to component errors.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <InvoiceManagement />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * Log error details
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error reporting service (e.g., Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  /**
   * Reset error state and retry
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Navigate to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                An unexpected error occurred while rendering this component.
                {this.state.error && (
                  <div className="mt-2 font-mono text-xs">
                    {this.state.error.toString()}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="bg-white p-4 rounded-lg border">
                <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={this.handleReset} variant="default" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Support Message */}
            <div className="text-sm text-gray-600 bg-white p-4 rounded-lg border">
              <p className="font-semibold mb-2">Need help?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper (requires React 18+)
 * 
 * @remarks
 * Provides a simpler API for functional components.
 * Uses the class-based ErrorBoundary under the hood.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
