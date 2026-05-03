import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants: Record<string, string> = {
    primary:   'bg-accent text-white hover:bg-accent/90',
    secondary: 'border hover:opacity-80',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'hover:opacity-70',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-base min-h-[44px]',
  };

  const secondaryStyle = variant === 'secondary'
    ? { borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }
    : {};

  const ghostStyle = variant === 'ghost'
    ? { color: 'var(--text-secondary)' }
    : {};

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ ...secondaryStyle, ...ghostStyle }}
      {...props}
    >
      {children}
    </button>
  );
}
