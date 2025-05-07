'use client';

import { ReactNode, useMemo, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';

// Simple window size hook implementation
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

interface VirtualizedListProps<T> {
  data: T[];
  height?: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscanCount?: number;
  emptyMessage?: string;
}

/**
 * Virtualized List Component
 * 
 * Efficiently renders long lists using virtualization to only render
 * items that are visible in the viewport.
 */
export function VirtualizedList<T>({
  data,
  height = 400,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
  emptyMessage = 'No items found'
}: VirtualizedListProps<T>) {
  // Get window dimensions to make the list responsive
  const { width } = useWindowSize();

  // Memoize the list to prevent unnecessary re-renders
  const virtualizedList = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }
    
    return (
      <List
        height={height}
        itemCount={data.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={overscanCount}
        className={className}
      >
        {({ index, style }) => (
          <div style={style}>
            {renderItem(data[index], index)}
          </div>
        )}
      </List>
    );
  }, [data, height, itemHeight, renderItem, overscanCount, className]);

  // If data is empty, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return virtualizedList;
} 