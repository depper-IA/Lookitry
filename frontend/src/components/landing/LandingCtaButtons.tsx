'use client';

import { useRouter } from 'next/navigation';

export function ProPlanButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/checkout?plan=PRO&amount=250000&months=1')}
      className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
    >
      Contratar Pro ahora
    </button>
  );
}

export function CtaProButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/checkout?plan=PRO&amount=250000&months=1')}
      className="text-[#aaa] hover:text-white text-[15px] px-8 py-3.5 rounded-xl border border-[#333] hover:border-[#555] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
    >
      Contratar Pro ahora
    </button>
  );
}
