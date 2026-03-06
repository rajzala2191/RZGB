import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ title = 'Error', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-20 h-full">
    <div className="bg-[#0f172a] border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-400 mb-4">{message || 'An error occurred. Please try again.'}</p>
      <button 
        onClick={onRetry || (() => window.location.reload())}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  </div>
);

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center p-24 h-full">
    <img 
      src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" 
      alt="RZ Global Solutions" 
      className="w-20 h-20 mb-6 animate-pulse" 
    />
    <p className="text-slate-400 font-medium text-lg">Loading...</p>
  </div>
);

export default ErrorState;
