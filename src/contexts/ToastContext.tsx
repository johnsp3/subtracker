'use client';

/**
 * Toast Context
 * 
 * Provides global toast notification functionality throughout the application.
 * Following the Single Responsibility Principle, this context only handles toast notifications.
 * Includes safeguards for server-side rendering.
 */
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useToast, ToastType, Toast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

// Define the type for the toast context
type ToastContextType = ReturnType<typeof useToast>;

// Empty handler function for server-side rendering
const noop = (() => '') as any;

// Default context values for server-side rendering
const defaultContextValue: ToastContextType = {
  toasts: [],
  showToast: noop,
  hideToast: noop,
  clearToasts: noop,
  showSuccess: noop,
  showError: noop
};

// Create context with default values for SSR
const ToastContext = createContext<ToastContextType>(defaultContextValue);

/**
 * Props for the ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider component
 * 
 * Wraps the application with toast notification functionality
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  // Use our custom hook to manage toasts
  const toast = useToast();
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => toast, [toast]);
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toast.toasts} 
        onClose={toast.hideToast} 
      />
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use toast context
 * 
 * @returns The toast context
 */
export const useToastContext = () => {
  return useContext(ToastContext);
}; 