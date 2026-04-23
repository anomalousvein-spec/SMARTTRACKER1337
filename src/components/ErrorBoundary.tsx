import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="max-w-md w-full bg-theme-bg-secondary rounded-[3rem] p-10 border border-red-500/10 shadow-2xl shadow-red-500/5 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500 opacity-50" />

            <div className="relative inline-flex">
               <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
               <div className="relative w-20 h-20 bg-red-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-red-500/20">
                 <AlertTriangle size={40} />
               </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-theme-text-primary uppercase tracking-tighter italic">Engine Failure</h1>
              <p className="text-sm text-theme-text-tertiary dark:text-theme-text-tertiary font-medium leading-relaxed px-4">
                The workout engine encountered a critical error. Your data is safe in IndexedDB, but the UI needs a restart.
              </p>
            </div>

            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
               <code className="text-[10px] font-black text-red-500 break-all uppercase tracking-widest leading-loose">
                 {this.state.error?.message || 'Unknown technical failure'}
               </code>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-theme-accent text-white px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                <RotateCcw size={14} />
                Reboot App
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-theme-bg-tertiary border border-white/5 text-theme-text-primary px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-theme-bg-secondary transition-all shadow-sm"
              >
                <Home size={14} />
                Dashboard
              </button>
            </div>

            <p className="text-[9px] font-black text-theme-text-tertiary uppercase tracking-widest pt-4 opacity-50">
              Session Integrity Protected
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
