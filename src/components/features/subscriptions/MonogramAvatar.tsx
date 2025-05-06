'use client';

import { generateMonogram, generateBackgroundColor } from '@/utils/avatar';

interface MonogramAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MonogramAvatar = ({ name, size = 'md', className = '' }: MonogramAvatarProps) => {
  const monogram = generateMonogram(name);
  const backgroundColor = generateBackgroundColor(name);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl'
  };
  
  return (
    <div 
      className={`rounded-lg flex items-center justify-center font-bold text-gray-800 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor }}
    >
      {monogram}
    </div>
  );
};

export default MonogramAvatar; 