import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';
import AdminApp from './admin/AdminApp';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

const Root: React.FC = () => {
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

  if (showAdmin) {
    return <AdminApp />;
  }

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
