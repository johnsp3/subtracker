'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface RefreshButtonProps {
  className?: string;
  text?: string;
}

/**
 * Refresh Button component
 * 
 * A simple button to reload the page when clicked
 * Shows a loading state while reloading
 */
const RefreshButton = ({ className = '', text = 'Refresh' }: RefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };
  
  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70 ${className}`}
    >
      <RefreshCw 
        className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {isRefreshing ? 'Refreshing...' : text}
    </button>
  );
};

export default RefreshButton; 