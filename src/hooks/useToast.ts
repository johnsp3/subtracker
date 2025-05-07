/**
 * Toast Hook
 * 
 * This custom hook provides a simple toast notification system.
 * Following the Single Responsibility Principle, this hook only handles toast notifications.
 */
import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

/**
 * Custom hook for managing toast notifications
 * 
 * @returns Methods for showing, hiding, and getting toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Hide a specific toast
   * 
   * @param id - The ID of the toast to hide
   */
  const hideToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  /**
   * Show a toast notification
   * 
   * @param message - The message to display
   * @param type - The type of toast
   * @param duration - Duration in milliseconds
   * @returns The ID of the toast
   */
  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    duration: number = 3000
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newToast: Toast = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    // Auto-remove the toast after duration
    setTimeout(() => {
      hideToast(id);
    }, duration);
    
    return id;
  }, [hideToast]);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Shorthand method for showing a success toast
   * 
   * @param message - The message to display
   * @param duration - Duration in milliseconds
   * @returns The ID of the toast
   */
  const showSuccess = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  /**
   * Shorthand method for showing an error toast
   * 
   * @param message - The message to display
   * @param duration - Duration in milliseconds
   * @returns The ID of the toast
   */
  const showError = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    clearToasts,
    showSuccess,
    showError
  };
}; 