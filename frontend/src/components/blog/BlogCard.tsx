'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { getBlogFeaturedImage, getBlogTeaser } from '@/services/blog.service';
import { useTheme } from '@/contexts/ThemeContext';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    meta_description?: string;
    content?: string;
    featured_image?: string;
    published_at: string;
    created_at?: string;
    category?: { name: string };
  };
  variant?: 'default' | 'featured';
}

function BlogImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [hasError, setHasError] = useState(false);
  const { isDark } = useTheme();

  if (hasError) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]' : 'bg-gradient-to-br from-gray-100 to-gray-200'} ${className}`}>
        <span className={`text-4xl font-bold ${isDark ? 'text-white/10' : 'text-black/10'}`}>Lookitry</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, variant = 'default' }) => {
  const { isDark, colors } = useTheme();
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const postDate = post.published_at || post.created_at || new Date().toISOString();
  const previewImage = getBlogFeaturedImage(post);
  const teaser = getBlogTeaser(post);

  if (variant === 'featured') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={`group relative col-span-2 row-span-2 flex flex-col overflow-hidden rounded-2xl border ${isDark ? 'border-[#FF5C3A]/30' : 'border-[#FF5C3A]/20'} ${colors.card} transition-all duration-500 hover:border-[#FF5C3A]/60 hover:shadow-2xl hover:shadow-[#FF5C3A]/20 lg:col-span-2`}
      >
        <div className="relative aspect-[16/10] overflow-hidden lg:aspect-[21/9]">
          {previewImage ? (
            <BlogImage
              src={previewImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
              <span className={`text-6xl font-bold ${isDark ? 'text-white/10' : 'text-black/10'}`}>Lookitry</span>
            </div>
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/80' : 'from-black/60'} via-black/20 to-transparent`} />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-[#FF5C3A] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#FF5C3A]/30">
              Artículo destacado
            </span>
          </div>
          {post.category && (
            <div className="absolute right-4 top-4">
              <span className={`rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider border border-white/10 text-white`}>
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        <div className="relative flex flex-grow flex-col p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-3 text-sm" style={{ color: colors.textSecondary }}>
            <Calendar size={16} />
            <span>{formatDate(postDate)}</span>
          </div>

          <h2 className={`mb-4 font-plus-jakarta text-3xl font-black leading-tight transition-colors group-hover:text-[#FF5C3A] lg:text-4xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {post.title}
          </h2>

          <p className={`mb-8 flex-grow text-base leading-relaxed lg:text-lg ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {teaser}
          </p>

          <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#FF5C3A] transition-all group-hover:gap-3">
            Leer artículo completo
            <ChevronRight size={18} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-100'} ${colors.card} transition-all duration-300 hover:border-[#FF5C3A]/50 hover:shadow-2xl hover:shadow-[#FF5C3A]/10`}
    >
      <div className="relative aspect-video overflow-hidden">
        {previewImage ? (
          <BlogImage
            src={previewImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
            <span className={`text-4xl font-bold ${isDark ? 'text-white/10' : 'text-black/10'}`}>Lookitry</span>
          </div>
        )}
        {post.category && (
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-[#FF5C3A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#FF5C3A]/20">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col p-6">
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
          <Calendar size={14} />
          <span>{formatDate(postDate)}</span>
        </div>

        <h3 className={`mb-3 line-clamp-2 font-plus-jakarta text-xl font-bold leading-tight transition-colors group-hover:text-[#FF5C3A] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          {post.title}
        </h3>

        <p className={`mb-6 flex-grow line-clamp-3 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {teaser}
        </p>

        <div className="mt-auto flex items-center gap-1 text-sm font-bold text-[#FF5C3A] transition-all group-hover:gap-2">
          Leer artículo
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  );
};
