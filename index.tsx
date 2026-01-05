import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';
import AdminApp from './admin/AdminApp';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import './styles.css';

const AuthenticatedRoot: React.FC = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      setShowAdmin(window.location.hash === '#admin');
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAdmin) {
    return <AdminApp />;
  }

  if (showApp) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the Banana Ads platform.</p>
            <button
              onClick={login}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowApp(false)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return <App onBackToLanding={() => setShowApp(false)} />;
  }

  return (
    <LandingPage 
      onGetStarted={() => {
        if (isAuthenticated) {
          setShowApp(true);
        } else {
          login();
        }
      }} 
    />
  );
};

const Root: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthenticatedRoot />
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
