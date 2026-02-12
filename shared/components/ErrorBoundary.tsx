import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fixed: Extending React.Component explicitly to ensure TypeScript correctly resolves the base class members (props, setState, etc.).
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Handle errors by logging them to the console and updating the internal error state.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Accessing props from the inherited React.Component base class.
    console.group(`[Renderless Error] ${this.props.featureName || 'Component'}`);
    console.error("Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();
  }

  // Reset the error state to allow the application to attempt a recovery render.
  private handleReset = () => {
    // Calling setState from the inherited React.Component base class.
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 border border-red-900/20 m-2 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Feature Unavailable</h2>
          <p className="text-sm text-zinc-500 text-center max-w-md mb-8">
            {/* Accessing props.featureName from the React.Component base class. */}
            The <span className="text-zinc-300 font-mono">{this.props.featureName || 'requested feature'}</span> encountered a critical error and had to be suspended.
          </p>
          <div className="bg-black/50 border border-zinc-800 rounded-lg p-4 w-full max-w-xl mb-8 overflow-hidden">
            <p className="text-[10px] font-mono text-red-400 truncate">
              {this.state.error?.message || 'Unknown Execution Error'}
            </p>
          </div>
          <button 
            onClick={this.handleReset}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-zinc-700 active:scale-95"
          >
            Reset Component
          </button>
        </div>
      );
    }

    // Accessing props.children from the React.Component base class.
    return this.props.children;
  }
}
