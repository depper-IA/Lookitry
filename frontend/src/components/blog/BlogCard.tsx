'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { getBlogFeaturedImage } from '@/services/blog.service';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
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

  return (
    <Link 
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-[#141414] border border-white/5 rounded-2xl overflow-hidden hover:border-[#FF5C3A]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF5C3A]/10"
    >
      <div className="relative aspect-video overflow-hidden">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
            <span className="text-white/10 font-bold text-4xl">Lookitry</span>
          </div>
        )}
        {post.category && (
          <div className="absolute top-4 left-4">
            <span className="bg-[#FF5C3A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-[#999] text-xs mb-3">
          <Calendar size={14} />
          <span>{formatDate(postDate)}</span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF5C3A] transition-colors line-clamp-2 leading-tight font-plus-jakarta">
          {post.title}
        </h3>
        
        <p className="text-[#999] text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
          {post.excerpt || 'Haz clic para leer más sobre este artículo y descubrir cómo potenciar tu negocio.'}
        </p>

        <div className="flex items-center text-[#FF5C3A] text-sm font-bold gap-1 mt-auto group-hover:gap-2 transition-all">
          Leer artículo
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  );
};
