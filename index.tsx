import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';
import AdminApp from './admin/AdminApp';
import AuthPage from './components/Auth/AuthPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import './styles.css';

const AuthenticatedRoot: React.FC = () => {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showAdmin, setShowAdmin] = useState(() => 
    window.location.hash === '#admin' || window.location.pathname === '/admin'
  );
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      const isAdminRoute = window.location.hash === '#admin' || window.location.pathname === '/admin';
      setShowAdmin(isAdminRoute);
    };
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
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
    if (!isAuthenticated) {
      return (
        <AuthPage 
          onSuccess={() => {
            window.location.reload();
          }} 
        />
      );
    }
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/60 mb-6">You don't have admin access.<br/>Logged in as: {user?.email}</p>
            <button
              onClick={() => window.location.hash = ''}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-yellow-500/25"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return <AdminApp />;
  }

  if (showAuth) {
    return (
      <AuthPage 
        onSuccess={() => {
          setShowAuth(false);
          setShowApp(true);
        }} 
      />
    );
  }

  if (showApp) {
    if (!isAuthenticated) {
      return (
        <AuthPage 
          onSuccess={() => {
            setShowApp(true);
          }} 
        />
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
          setShowAuth(true);
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
