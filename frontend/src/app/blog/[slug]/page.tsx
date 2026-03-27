import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { fetchBlogPostBySlug } from '@/services/blog.service';
import { Calendar, Tag, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await fetchBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post no encontrado | Lookitry',
    };
  }

  return {
    title: `${post.title} | Lookitry Blog`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
      publishedTime: post.published_at || post.created_at,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetchBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#FF5C3A]/30 pb-20">
      <LandingNav />
      
      {/* Header del artículo */}
      <article className="max-w-4xl mx-auto px-6 pt-20">
        <Link 
          href="/blog" 
          className="flex items-center gap-2 text-[#999] hover:text-[#FF5C3A] mb-8 transition-colors text-sm group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al blog
        </Link>

        {post.category && (
          <span className="text-[#FF5C3A] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
            {post.category.name}
          </span>
        )}

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] font-plus-jakarta tracking-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-[#999] text-sm mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#FF5C3A]" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-[#FF5C3A]" />
              <div className="flex gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="hover:text-white transition-colors">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {post.featured_image && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/5">
            <img 
              src={post.featured_image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Contenido (HTML renderizado) */}
        <div 
          className="prose prose-invert prose-orange max-w-none 
          text-[#ccc] text-lg leading-relaxed 
          prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-headings:font-plus-jakarta
          prose-p:mb-8 prose-li:mb-2
          prose-strong:text-white prose-strong:font-bold
          prose-a:text-[#FF5C3A] prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:border prose-img:border-white/5
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA Section */}
        <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#FF5C3A]/20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Quieres potenciar tu marca con try-on virtual?</h2>
          <p className="text-[#999] mb-8 max-w-xl mx-auto">Únete a cientos de marcas que ya están transformando la experiencia de compra de sus clientes con Lookitry.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Probar gratis ahora
            </Link>
            <Link 
              href="/planes" 
              className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full border border-white/10 transition-all"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </article>

      <div className="mt-20">
        <LandingFooter />
      </div>
    </main>
  );
}
