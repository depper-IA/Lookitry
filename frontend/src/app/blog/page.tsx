import React from 'react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { BlogList } from '@/components/blog/BlogList';
import { BlogHero } from '@/components/blog/BlogHero';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Lookitry - Innovación en Fashion Tech y Try-on Virtual',
  description: 'Descubre las últimas tendencias en probadores virtuales, IA aplicada a la moda y estrategias para potenciar tu eCommerce con Lookitry.',
};

export default function BlogPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#FF5C3A]/30">
        <BlogHero />
        <BlogList />
      </main>
      <LandingFooter />
    </div>
  );
}