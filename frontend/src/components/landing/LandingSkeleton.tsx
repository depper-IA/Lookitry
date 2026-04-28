import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

interface LandingSkeletonProps {
  variant?: 'default' | 'stats' | 'steps' | 'pricing';
  className?: string;
}

/**
 * Skeleton reutilizable para la landing page principal.
 * Muestra una estructura de carga consistente mientras
 * los componentes below-the-fold se cargan dinámicamente.
 */
export function LandingSkeleton({ variant = 'default', className = '' }: LandingSkeletonProps) {
  if (variant === 'stats') {
    return (
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white dark:bg-black ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 sm:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-[#e8e4df] dark:border-white/10 bg-white dark:bg-[#141414]"
                style={{ minWidth: '180px' }}
              >
                <Skeleton width={48} height={48} borderRadius="12px" className="shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton width={80} height={32} borderRadius="8px" />
                  <Skeleton width={100} height={12} borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'steps') {
    return (
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white dark:bg-black ${className}`}>
        <div className="max-w-5xl mx-auto">
          <Skeleton width={200} height={32} borderRadius="8px" className="mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <Skeleton width={64} height={64} borderRadius="50%" />
                <Skeleton width="80%" height={20} borderRadius="6px" />
                <Skeleton width="100%" height={48} borderRadius="8px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'pricing') {
    return (
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-[#fafafa] dark:from-black dark:to-[#0a0a0a] ${className}`}>
        <div className="max-w-5xl mx-auto">
          <Skeleton width={240} height={40} borderRadius="8px" className="mx-auto mb-4" />
          <Skeleton width={300} height={20} borderRadius="6px" className="mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] border border-[#e8e4df] dark:border-white/10 bg-white dark:bg-[#141414] p-6 sm:p-8"
              >
                <Skeleton width={80} height={24} borderRadius="6px" className="mb-4" />
                <Skeleton width={120} height={48} borderRadius="8px" className="mb-6" />
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} width="100%" height={16} borderRadius="4px" />
                  ))}
                </div>
                <Skeleton width="100%" height={48} borderRadius="12px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: cards grid (usado en PremiumLanding)
  return (
    <div className={`py-20 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 bg-white dark:bg-black ${className}`}>
      <div className="max-w-7xl mx-auto">
        <Skeleton width={192} height={32} borderRadius="8px" className="mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} avatar lines={3} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingSkeleton;
