import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: React.Component<Props, State>['setState'];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="max-w-lg w-full glass p-10 rounded-3xl border border-red-500/30 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
              <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            
            <h2 className="text-2xl font-serif mb-2 text-white">Something went wrong</h2>
            <p className="text-white/50 text-sm mb-6">
              An unexpected error occurred. Don't worry, your data is safe.
            </p>
            
            {this.state.error && (
              <div className="bg-black/50 rounded-xl p-4 mb-6 text-left border border-red-500/20">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Error Details</p>
                <p className="text-xs text-red-400 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition"
              >
                <i className="fa-solid fa-rotate-right mr-2"></i>
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 gradient-accent rounded-xl font-bold text-black transition hover:opacity-90"
              >
                <i className="fa-solid fa-refresh mr-2"></i>
                Reload Page
              </button>
            </div>
            
            <p className="text-xs text-white/30 mt-6">
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
