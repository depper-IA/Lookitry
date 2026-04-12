import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  className = '',
  animation = 'wave',
  style,
}) => {
  return (
    <div
      className={`skeleton ${animation !== 'none' ? `skeleton-${animation}` : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
};

interface SkeletonCardProps {
  avatar?: boolean;
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  avatar = true,
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}) => {
  return (
    <div className={`skeleton-card ${className}`} style={{ padding: '1rem' }}>
      {avatar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Skeleton width={40} height={40} borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton height="0.75rem" width="40%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="0.5rem" width="25%" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.75rem"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          style={{ marginBottom: '0.5rem' }}
        />
      ))}
    </div>
  );
};

export default Skeleton;