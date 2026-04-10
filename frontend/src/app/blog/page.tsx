import React from 'react';
import { BlogThemeWrapper } from '@/components/blog/BlogThemeWrapper';
import { BlogPageContent } from '@/components/blog/BlogPageContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Lookitry - Innovación en Fashion Tech y Try-on Virtual',
  description: 'Descubre las últimas tendencias en probadores virtuales, IA aplicada a la moda y estrategias para potenciar tu eCommerce con Lookitry.',
};

export default function BlogPage() {
  return (
    <BlogThemeWrapper>
      <BlogPageContent />
    </BlogThemeWrapper>
  );
}