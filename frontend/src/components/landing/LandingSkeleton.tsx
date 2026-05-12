import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

interface LandingSkeletonProps {
  variant?: 'hero' | 'stats' | 'steps' | 'pricing';
  className?: string;
}

/**
 * Skeleton reutilizable para la landing page principal.
 * Muestra una estructura de carga consistente para las secciones above-the-fold.
 */
export function LandingSkeleton({ variant = 'hero', className = '' }: LandingSkeletonProps) {
  if (variant === 'hero') {
    return (
      <div className={`min-h-screen bg-white dark:bg-black ${className}`}>
        {/* Nav skeleton */}
        <div className="sticky top-0 z-[70] w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 border-b border-black/5 dark:border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton width={32} height={32} borderRadius="8px" />
              <Skeleton width={100} height={24} borderRadius="6px" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton width={60} height={20} borderRadius="20px" />
              <Skeleton width={120} height={40} borderRadius="20px" />
            </div>
          </div>
        </div>

        {/* Hero skeleton */}
        <div className="relative flex min-h-screen items-start overflow-hidden px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-24 md:px-12">
          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 w-full">
            {/* Left: Text content */}
            <div className="text-center lg:text-left">
              <Skeleton width={120} height={24} borderRadius="20px" className="mb-6 mx-auto lg:mx-0" />
              <div className="space-y-4 mb-8">
                <Skeleton width="80%" height={48} borderRadius="8px" className="mx-auto lg:mx-0" />
                <Skeleton width="60%" height={48} borderRadius="8px" className="mx-auto lg:mx-0" />
                <Skeleton width="70%" height={48} borderRadius="8px" className="mx-auto lg:mx-0" />
              </div>
              <Skeleton width="90%" height={20} borderRadius="6px" className="mb-8 mx-auto lg:mx-0" />
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:justify-start">
                <Skeleton width={180} height={52} borderRadius="16px" />
                <Skeleton width={160} height={52} borderRadius="16px" />
              </div>
            </div>

            {/* Right: Widget mockup */}
            <div className="flex w-full items-center justify-center lg:justify-end">
              <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-dark-surface p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:max-w-[500px] sm:rounded-[2rem] sm:p-4 lg:max-w-[620px]">
                {/* Widget header */}
                <div className="mb-3 flex items-center justify-center gap-2 rounded-full bg-text-muted/10 px-4 py-2 sm:mb-6">
                  <Skeleton width={20} height={20} borderRadius="50%" />
                  <Skeleton width={140} height={16} borderRadius="6px" />
                </div>
                {/* Browser chrome */}
                <div className="mb-4 flex items-center gap-2 sm:mb-6">
                  <div className="flex gap-1 sm:gap-1.5">
                    <Skeleton width={8} height={8} borderRadius="50%" />
                    <Skeleton width={8} height={8} borderRadius="50%" />
                    <Skeleton width={8} height={8} borderRadius="50%" />
                  </div>
                  <Skeleton width="60%" height={24} borderRadius="6px" />
                </div>
                {/* Selfie area */}
                <Skeleton width="100%" height={120} borderRadius="12px" className="mb-4" />
                {/* Product list */}
                <div className="space-y-2 mb-4">
                  <Skeleton width="100%" height={60} borderRadius="12px" />
                  <Skeleton width="100%" height={60} borderRadius="12px" />
                </div>
                {/* CTA button */}
                <Skeleton width="100%" height={44} borderRadius="12px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white dark:bg-black ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 sm:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface"
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
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-dark ${className}`}>
        <div className="max-w-5xl mx-auto">
          <Skeleton width={240} height={40} borderRadius="8px" className="mx-auto mb-4" />
          <Skeleton width={300} height={20} borderRadius="6px" className="mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-6 sm:p-8"
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

  // Fallback: cards grid
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
