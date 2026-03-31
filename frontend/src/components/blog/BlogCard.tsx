'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { getBlogFeaturedImage, getBlogTeaser } from '@/services/blog.service';

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
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
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

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#141414] transition-all duration-300 hover:border-[#FF5C3A]/50 hover:shadow-2xl hover:shadow-[#FF5C3A]/10"
    >
      <div className="relative aspect-video overflow-hidden">
        {previewImage ? (
          <img
            src={previewImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
            <span className="text-4xl font-bold text-white/10">Lookitry</span>
          </div>
        )}
        {post.category && (
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-[#FF5C3A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-[#999]">
          <Calendar size={14} />
          <span>{formatDate(postDate)}</span>
        </div>

        <h3 className="mb-3 line-clamp-2 font-plus-jakarta text-xl font-bold leading-tight text-white transition-colors group-hover:text-[#FF5C3A]">
          {post.title}
        </h3>

        <p className="mb-6 flex-grow line-clamp-3 text-sm leading-relaxed text-[#b5b5b5]">
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
