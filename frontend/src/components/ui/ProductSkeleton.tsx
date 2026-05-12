import { motion } from 'framer-motion';

interface ProductSkeletonProps {
  variant?: 'grid' | 'thumbnails' | 'list';
  count?: number;
}

const skeletonVariants = {
  grid: {
    container: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    card: 'rounded-2xl overflow-hidden',
    imageAspect: 'aspect-square',
    minHeight: 'min-h-[520px]',
    contentPadding: 'p-5',
  },
  thumbnails: {
    container: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5',
    card: 'rounded-2xl overflow-hidden',
    imageAspect: 'aspect-[4/5]',
    minHeight: 'min-h-[440px]',
    contentPadding: 'p-4',
  },
  list: {
    container: 'rounded-2xl overflow-hidden',
    card: 'flex gap-4 p-4',
    imageAspect: 'w-20 h-20 rounded-lg',
    minHeight: '',
    contentPadding: '',
  },
};

function SkeletonItem({ variant }: { variant: 'grid' | 'thumbnails' | 'list' }) {
  const style = skeletonVariants[variant];

  if (variant === 'list') {
    return (
      <div
        className="flex gap-4 p-4"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="w-20 h-20 rounded-lg animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
          <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
          <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-6 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${style.card} ${style.minHeight}`}
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <div className={`${style.imageAspect} animate-pulse`} style={{ background: 'var(--skeleton-bg)' }} />
      <div className={`${style.contentPadding} space-y-3`}>
        <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 w-20 rounded animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
          <div className="h-2 w-12 rounded-full animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
        </div>
      </div>
    </motion.div>
  );
}

export function ProductSkeleton({ variant = 'grid', count = 6 }: ProductSkeletonProps) {
  // Adjust count based on variant for visual balance
  const actualCount = variant === 'list' ? 3 : variant === 'thumbnails' ? 8 : count;

  return (
    <div className={skeletonVariants[variant].container}>
      {Array.from({ length: actualCount }, (_, i) => (
        <SkeletonItem key={i} variant={variant} />
      ))}
    </div>
  );
}