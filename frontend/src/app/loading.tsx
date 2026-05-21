export default function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark animate-pulse">
      {/* Hero skeleton */}
      <div className="relative h-[85vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#f5f5f5] dark:bg-[#0f0f0f]" />
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto px-6 text-center">
          <div className="h-4 w-32 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-full" />
          <div className="h-12 w-4/5 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-xl" />
          <div className="h-6 w-3/5 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-xl" />
          <div className="flex gap-3 mt-4">
            <div className="h-12 w-36 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-xl" />
            <div className="h-12 w-36 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-xl" />
          </div>
        </div>
      </div>
      {/* Sections skeleton */}
      <div className="space-y-16 py-20 px-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="max-w-5xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-lg" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-48 bg-[#e0e0e0] dark:bg-[#1a1a1a] rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}