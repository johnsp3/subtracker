'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch client-side rendering errors
 * 
 * This prevents the entire app from crashing when a component fails to render
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md my-8">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <div className="text-gray-700 mb-4">
            The application encountered an error and couldn't continue. Try refreshing the page.
          </div>
          <details className="bg-gray-100 p-2 rounded text-sm mb-2">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <p className="mt-2 font-mono text-red-500 text-xs overflow-auto max-h-40">
              {this.state.error?.toString()}
            </p>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 