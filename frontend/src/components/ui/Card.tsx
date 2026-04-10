import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}

export function Card({ children, className = '', style, interactive = false }: CardProps) {
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-[#FF5C3A]/40 hover:shadow-md transition-all duration-200 motion-safe:hover:scale-[1.01]'
    : '';
  return (
    <div
      className={`rounded-xl border overflow-hidden ${interactiveClasses} ${className}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', ...style }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={`px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}
