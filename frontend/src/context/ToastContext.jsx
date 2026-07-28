import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300
              flex items-center gap-3 min-w-[300px] max-w-[400px] p-4 rounded-2xl shadow-xl border
              ${toast.type === 'success' ? 'bg-[#1a1c29] text-white border-[#2d3043]' : ''}
              ${toast.type === 'error' ? 'bg-rose-500 text-white border-rose-600' : ''}
              ${toast.type === 'info' ? 'bg-blue-500 text-white border-blue-600' : ''}
            `}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>
            
            <p className="flex-1 text-[14px] font-medium leading-snug">
              {toast.message}
            </p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
            >
              <X size={16} className="text-white/60 hover:text-white" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
