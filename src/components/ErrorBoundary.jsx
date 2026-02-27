import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6">
              The application encountered an unexpected error.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
              <code className="text-red-400 text-xs font-mono">
                {this.state.error && this.state.error.toString()}
              </code>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;