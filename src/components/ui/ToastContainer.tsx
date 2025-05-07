/**
 * Toast Container Component
 * 
 * Renders a container for displaying multiple toast notifications.
 * Following the Single Responsibility Principle, this component only handles the layout of toasts.
 */
import { useToast, Toast as ToastType } from '@/hooks/useToast';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

/**
 * ToastContainer component
 */
const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer; 