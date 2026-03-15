import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${className}`}
      style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }}
    />
  );
}
