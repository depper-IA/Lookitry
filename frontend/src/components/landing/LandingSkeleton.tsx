import { Skeleton } from '@/components/ui/Skeleton';

interface LandingSkeletonProps {
  variant?: 'hero' | 'stats' | 'steps' | 'pricing';
  className?: string;
}

/**
 * Skeleton reutilizable para la landing page principal.
 * Muestra una estructura de carga consistente y premium para evitar Layout Shift (CLS).
 */
export function LandingSkeleton({ variant = 'hero', className = '' }: LandingSkeletonProps) {
  if (variant === 'hero') {
    return (
      <section
        className={`relative flex min-h-screen items-end overflow-hidden bg-black pb-20 sm:pb-28 ${className}`}
        aria-label="Cargando sección principal"
      >
        {/* Dark overlay mimicking hero background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </div>

        {/* Hero content structure */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-16">
          <div className="max-w-2xl flex flex-col gap-6">
            {/* Title skeletons */}
            <div className="flex flex-col gap-3">
              <Skeleton
                width="85%"
                height="2.5rem"
                borderRadius="8px"
                className="bg-white/10"
                style={{ height: 'clamp(2rem, 6vw, 3.5rem)' }}
              />
              <Skeleton
                width="60%"
                height="2.5rem"
                borderRadius="8px"
                className="bg-accent/20"
                style={{ height: 'clamp(2rem, 6vw, 3.5rem)' }}
              />
            </div>

            {/* Subtitle skeletons */}
            <div className="flex flex-col gap-2 mt-2">
              <Skeleton width="90%" height="1.125rem" borderRadius="4px" className="bg-white/5" />
              <Skeleton width="70%" height="1.125rem" borderRadius="4px" className="bg-white/5" />
            </div>

            {/* CTA Buttons skeletons */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Skeleton width={180} height={52} borderRadius="9999px" className="bg-white/15" />
              <Skeleton width={150} height={52} borderRadius="9999px" className="bg-white/5" />
            </div>

            {/* Metadata footer badges */}
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-10">
              <div className="flex items-center gap-2">
                <Skeleton width={14} height={14} borderRadius="50%" className="bg-accent/30" />
                <Skeleton width={90} height={12} borderRadius="4px" className="bg-white/10" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={14} height={14} borderRadius="50%" className="bg-accent/30" />
                <Skeleton width={110} height={12} borderRadius="4px" className="bg-white/10" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={14} height={14} borderRadius="50%" className="bg-accent/30" />
                <Skeleton width={100} height={12} borderRadius="4px" className="bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </section>
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
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white dark:bg-black relative overflow-hidden ${className}`}>
        <div className="max-w-7xl mx-auto px-0 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <Skeleton width={120} height={28} borderRadius="9999px" className="mx-auto mb-6 bg-accent/10" />
            <Skeleton width={380} height={44} borderRadius="8px" className="mx-auto mb-4" />
            <Skeleton width={280} height={20} borderRadius="6px" className="mx-auto" />
          </div>

          {/* Cards Grid matching Basic / Pro / Enterprise styles */}
          <div className="flex flex-wrap justify-center items-stretch gap-6 sm:gap-8 lg:gap-10">
            {/* Basic (Light / Dark Input) */}
            <div className="w-full max-w-sm rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 bg-warm dark:bg-dark-input flex flex-col gap-6">
              <Skeleton width={80} height={16} borderRadius="4px" className="bg-accent/10" />
              <Skeleton width={120} height={36} borderRadius="8px" />
              <Skeleton width={180} height={48} borderRadius="8px" />
              <div className="h-[1px] w-full bg-black/10 dark:bg-white/10 my-2" />
              <div className="flex flex-col gap-4 flex-1">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton width={20} height={20} borderRadius="50%" className="bg-accent/10" />
                    <Skeleton width="80%" height={14} borderRadius="4px" />
                  </div>
                ))}
              </div>
              <Skeleton width="100%" height={56} borderRadius="16px" className="bg-black/5 dark:bg-white/10 mt-auto" />
            </div>

            {/* Pro (ALWAYS Dark Premium with Accent details) */}
            <div className="w-full max-w-sm rounded-3xl p-8 md:p-10 border border-accent/40 bg-neutral-900 flex flex-col gap-6 relative z-10 shadow-[0_30px_80px_rgba(255,92,58,0.12)]">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Skeleton width={140} height={28} borderRadius="9999px" className="bg-accent" />
              </div>
              <Skeleton width={80} height={16} borderRadius="4px" className="bg-accent/30" />
              <Skeleton width={120} height={36} borderRadius="8px" className="bg-white/15" />
              <Skeleton width={180} height={48} borderRadius="8px" className="bg-white/20" />
              <div className="h-[1px] w-full bg-white/10 my-2" />
              <div className="flex flex-col gap-4 flex-1">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton width={20} height={20} borderRadius="50%" className="bg-accent/20" />
                    <Skeleton width="85%" height={14} borderRadius="4px" className="bg-white/10" />
                  </div>
                ))}
              </div>
              <Skeleton width="100%" height={56} borderRadius="16px" className="bg-accent mt-auto" />
            </div>

            {/* Enterprise (Light / Dark Input) */}
            <div className="w-full max-w-sm rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 bg-warm dark:bg-dark-input flex flex-col gap-6">
              <Skeleton width={80} height={16} borderRadius="4px" className="bg-accent/10" />
              <Skeleton width={140} height={36} borderRadius="8px" />
              <Skeleton width={120} height={32} borderRadius="8px" />
              <div className="h-[1px] w-full bg-black/10 dark:bg-white/10 my-2" />
              <div className="flex flex-col gap-4 flex-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton width={20} height={20} borderRadius="50%" className="bg-accent/10" />
                    <Skeleton width="80%" height={14} borderRadius="4px" />
                  </div>
                ))}
              </div>
              <Skeleton width="100%" height={56} borderRadius="16px" className="bg-black/5 dark:bg-white/10 mt-auto" />
            </div>
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
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-4">
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton width="40%" height={14} borderRadius="4px" />
                  <Skeleton width="25%" height={10} borderRadius="4px" />
                </div>
              </div>
              <Skeleton width="100%" height={12} borderRadius="4px" />
              <Skeleton width="100%" height={12} borderRadius="4px" />
              <Skeleton width="60%" height={12} borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingSkeleton;
