/**
 * Toast Component
 * 
 * Renders a toast notification with different styles based on type.
 * Following the Single Responsibility Principle, this component only handles displaying a single toast.
 */
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Toast as ToastType, ToastType as ToastTypeEnum } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

/**
 * Get icon based on toast type
 * 
 * @param type - The type of toast
 * @returns The icon component to display
 */
const getToastIcon = (type: ToastTypeEnum) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'info':
    default:
      return <Info className="w-5 h-5" />;
  }
};

/**
 * Get background color based on toast type
 * 
 * @param type - The type of toast
 * @returns CSS classes for the toast
 */
const getToastClasses = (type: ToastTypeEnum) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'warning':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    case 'error':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'info':
    default:
      return 'bg-blue-50 text-blue-600 border-blue-200';
  }
};

/**
 * Toast component
 */
export const Toast = ({ toast, onClose }: ToastProps) => {
  const [isClosing, setIsClosing] = useState(false);
  
  useEffect(() => {
    // Auto-close the toast when the duration is reached
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, toast.duration - 300); // Start closing animation before the actual removal
    
    return () => clearTimeout(timer);
  }, [toast.duration]);
  
  /**
   * Handle manual close of the toast
   */
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };
  
  return (
    <div 
      className={`
        flex items-center w-full max-w-xs p-4 mb-3 rounded-lg shadow border 
        ${getToastClasses(toast.type)} 
        transition-all duration-300 ease-in-out 
        ${isClosing ? 'opacity-0 translate-x-full' : 'opacity-100'}
      `}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 mr-2">
        {getToastIcon(toast.type)}
      </div>
      <div className="text-sm font-normal flex-grow">{toast.message}</div>
      <button 
        type="button" 
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
        onClick={handleClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast; 