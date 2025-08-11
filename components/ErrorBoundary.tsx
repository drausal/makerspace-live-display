'use client';

import { Component, ReactNode, useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('🚨 ErrorBoundary componentDidCatch:', {
      error,
      errorInfo,
      stack: error.stack
    });

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
      console.log('📊 Error logged for production monitoring');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tv-display h-screen flex flex-col items-center justify-center theme-closed bg-red-50">
          <div className="text-center max-w-4xl mx-auto p-8">
            <div className="text-red-600 text-9xl mb-8 animate-bounce">
              💥
            </div>
            <h1 className="text-5xl font-bold text-red-800 mb-6">
              System Error
            </h1>
            <p className="text-3xl text-red-600 mb-8">
              The TV display encountered an unexpected problem
            </p>
            
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-100 border-2 border-red-300 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <summary className="text-xl font-semibold text-red-700 cursor-pointer mb-4">
                  🔍 Technical Details (Development Mode)
                </summary>
                <div className="font-mono text-sm text-red-800 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-2 text-xs bg-red-200 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Recovery instructions */}
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-red-800 mb-4">
                🔧 Recovery Steps
              </h2>
              <div className="text-xl text-red-700 space-y-2">
                <p>1. Wait a few moments for automatic recovery</p>
                <p>2. Refresh the browser (F5 or Ctrl+R)</p>
                <p>3. Check network connectivity</p>
                <p>4. Contact technical support if problem persists</p>
              </div>
            </div>

            {/* Manual retry button */}
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl transition-colors duration-200 shadow-lg"
            >
              🔄 Reload Display
            </button>

            <div className="mt-8 text-lg text-red-500">
              📞 Support: Contact Makerspace technical team
            </div>
          </div>

          {/* Auto-reload timer (in production) */}
          {process.env.NODE_ENV === 'production' && (
            <AutoReloadTimer />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Auto-reload component for production
function AutoReloadTimer() {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
      <div className="text-center">
        <div className="text-lg font-semibold">Auto-reload in:</div>
        <div className="text-3xl font-mono font-bold">{countdown}s</div>
      </div>
    </div>
  );
}

