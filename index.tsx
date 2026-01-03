import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application error:', error);
    console.error('Error info:', errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
          <div className="max-w-lg w-full bg-zinc-900/80 p-10 rounded-3xl border border-red-500/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-500"></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30 text-3xl">
              🍌
            </div>
            <h2 className="text-3xl font-serif mb-2 text-white">Something went wrong</h2>
            <p className="text-white/50 text-sm mb-6">
              The application encountered an unexpected error. Please try again.
            </p>
            <div className="bg-black/50 rounded-xl p-4 mb-6 text-left border border-red-500/20 max-h-32 overflow-auto">
              <p className="text-xs text-red-400 font-mono break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 py-4 rounded-xl font-bold text-black shadow-lg hover:scale-[1.02] transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Root: React.FC = () => {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <App onBackToLanding={() => setShowApp(false)} />;
  }

  return <LandingPage onGetStarted={() => setShowApp(true)} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);
