import React, { useState, useCallback, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast: Toast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: 'fa-solid fa-check-circle',
          iconColor: 'text-green-400',
          textColor: 'text-green-300'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: 'fa-solid fa-exclamation-circle',
          iconColor: 'text-red-400',
          textColor: 'text-red-300'
        };
      case 'info':
      default:
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: 'fa-solid fa-info-circle',
          iconColor: 'text-yellow-400',
          textColor: 'text-yellow-300'
        };
    }
  };

  const styles = getStyles();

  return (
    <div 
      className={`${styles.bg} ${styles.border} border backdrop-blur-xl rounded-xl p-4 shadow-2xl animate-fade-in flex items-start gap-3 min-w-[300px]`}
      role="alert"
    >
      <i className={`${styles.icon} ${styles.iconColor} text-lg mt-0.5`}></i>
      <p className={`${styles.textColor} text-sm flex-1`}>{toast.message}</p>
      <button 
        onClick={() => onRemove(toast.id)}
        className="text-white/40 hover:text-white/70 transition"
        aria-label="Dismiss notification"
      >
        <i className="fa-solid fa-times text-sm"></i>
      </button>
    </div>
  );
};

export default ToastProvider;
