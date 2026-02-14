
import React, { Component, ErrorInfo, ReactNode } from 'react';

// FIX: Exporting interfaces to ensure visibility and proper type recognition in usage contexts like App.tsx.
export interface ErrorBoundaryProps {
  children?: ReactNode;
  featureName?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Component to catch and handle runtime errors in the UI tree.
 * Inherits from Component to provide error boundary lifecycle methods.
 */
// FIX: Using explicit Component from 'react' and providing generic types to ensure 'props' and 'state' are correctly inherited.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Explicitly initializing state within the constructor to ensure it is correctly associated with the React component context.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // Standard React Error Boundary static method to update state from errors
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Lifecycle method for side-effects when an error is caught
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // FIX: Correctly accessing featureName from this.props which is now recognized through inheritance.
    const { featureName } = this.props;
    console.group(`[Renderless Error] ${featureName || 'Component'}`);
    console.error("Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();
  }

  // Handler to clear error state and attempt a re-render
  private handleReset = () => {
    // FIX: Correctly calling this.setState from the inherited React.Component base class.
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    // FIX: Accessing state and props which are now properly recognized by the TypeScript compiler.
    const { hasError, error } = this.state;
    const { featureName, children } = this.props;

    if (hasError) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 border border-red-900/20 m-2 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Feature Unavailable</h2>
          <p className="text-sm text-zinc-500 text-center max-w-md mb-8">
            The <span className="text-zinc-300 font-mono">{featureName || 'requested feature'}</span> encountered a critical error and had to be suspended.
          </p>
          <div className="bg-black/50 border border-zinc-800 rounded-lg p-4 w-full max-w-xl mb-8 overflow-hidden text-left">
            <p className="text-[10px] font-mono text-red-400 truncate">
              {error?.message || 'Unknown Execution Error'}
            </p>
          </div>
          <button 
            onClick={this.handleReset}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-zinc-700 active:scale-95 shadow-lg"
          >
            Reset Component
          </button>
        </div>
      );
    }

    return children;
  }
}
