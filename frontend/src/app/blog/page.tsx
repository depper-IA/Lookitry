import React from 'react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { BlogList } from '@/components/blog/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Lookitry - Innovación en Fashion Tech y Try-on Virtual',
  description: 'Descubre las últimas tendencias en probadores virtuales, IA aplicada a la moda y estrategias para potenciar tu eCommerce con Lookitry.',
};

export default function BlogPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#FF5C3A]/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-32 pb-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF5C3A]/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF5C3A]/5 blur-[120px] rounded-full" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 font-plus-jakarta tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span> Editorial
            </h1>
            <p className="text-[#999] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Explora el futuro del retail. Insights, guías y casos de éxito sobre la revolución del try-on virtual.
            </p>
          </div>
        </div>

        <BlogList />
      </main>
      <LandingFooter />
    </>
  );
}
