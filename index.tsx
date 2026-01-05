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
        <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
          <div className="text-center pt-8 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-600">Sign in with your admin account</p>
          </div>
          <AuthPage 
            onSuccess={() => {
              window.location.reload();
            }} 
          />
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have admin access. You are logged in as: {user?.email}</p>
            <button
              onClick={() => window.location.hash = ''}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
