import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { fetchBlogPostBySlug, getBlogFeaturedImage, getBlogShareImage } from '@/services/blog.service';
import { Calendar, Tag, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await fetchBlogPostBySlug(params.slug);
  const socialImage = getBlogShareImage(post);
  
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
      images: socialImage ? [socialImage] : [],
      type: 'article',
      publishedTime: post.published_at || post.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: socialImage ? [socialImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetchBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const heroImage = getBlogFeaturedImage(post);
  const socialImage = getBlogShareImage(post);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const articleProseClass = `
    prose max-w-none px-6 py-8 md:px-10 md:py-12
    text-[17px] leading-8 text-[#2b2623]
    prose-headings:font-plus-jakarta prose-headings:tracking-tight
    prose-h1:text-[#101010] prose-h2:text-[#FF5C3A] prose-h3:text-[#101010] prose-h4:text-[#101010]
    prose-p:text-[#2f2a27] prose-p:leading-8
    prose-li:text-[#2f2a27]
    prose-strong:text-[#101010]
    prose-a:text-[#d94d2b] prose-a:no-underline hover:prose-a:underline
    prose-img:rounded-[1.25rem] prose-img:shadow-lg
    [&_figure]:my-10 [&_figure]:overflow-hidden
    [&_figcaption]:mt-3 [&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-[#6d625c]
    [&_[data-blog-intro='lead']]:mb-10 [&_[data-blog-intro='lead']]:rounded-[1.75rem] [&_[data-blog-intro='lead']]:border [&_[data-blog-intro='lead']]:border-[#FF5C3A]/20 [&_[data-blog-intro='lead']]:bg-[linear-gradient(135deg,rgba(255,92,58,0.12),rgba(255,255,255,0.88))] [&_[data-blog-intro='lead']]:px-6 [&_[data-blog-intro='lead']]:py-6 [&_[data-blog-intro='lead']]:text-[1.08rem] [&_[data-blog-intro='lead']]:font-medium [&_[data-blog-intro='lead']]:leading-8 [&_[data-blog-intro='lead']]:text-[#1b1715]
    [&_[data-blog-block='impact']]:my-8 [&_[data-blog-block='impact']]:rounded-[1.5rem] [&_[data-blog-block='impact']]:border [&_[data-blog-block='impact']]:border-[#101010]/10 [&_[data-blog-block='impact']]:bg-white/80 [&_[data-blog-block='impact']]:px-6 [&_[data-blog-block='impact']]:py-6 [&_[data-blog-block='impact']]:shadow-[0_18px_40px_rgba(0,0,0,0.06)] [&_[data-blog-block='impact']_h3]:mt-0 [&_[data-blog-block='impact']_h3]:mb-3 [&_[data-blog-block='impact']_h3]:text-[#101010] [&_[data-blog-block='impact']_ul]:my-0 [&_[data-blog-block='impact']_li]:marker:text-[#FF5C3A]
    [&_[data-blog-cta='final']]:mt-10 [&_[data-blog-cta='final']]:rounded-[1.75rem] [&_[data-blog-cta='final']]:bg-[#101010] [&_[data-blog-cta='final']]:px-6 [&_[data-blog-cta='final']]:py-6 [&_[data-blog-cta='final']]:text-white [&_[data-blog-cta='final']_p]:m-0 [&_[data-blog-cta='final']_a]:inline-flex [&_[data-blog-cta='final']_a]:items-center [&_[data-blog-cta='final']_a]:justify-center [&_[data-blog-cta='final']_a]:rounded-full [&_[data-blog-cta='final']_a]:bg-[#FF5C3A] [&_[data-blog-cta='final']_a]:px-5 [&_[data-blog-cta='final']_a]:py-3 [&_[data-blog-cta='final']_a]:font-bold [&_[data-blog-cta='final']_a]:text-white
    [&_div[style*='background:_#FFF5F2']]:!bg-white [&_div[style*='background:_#FFF5F2']]:!border-[#FF5C3A]
    [&_h4]:!text-[#FF5C3A]
  `.replace(/\s+/g, ' ').trim();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: socialImage ? [socialImage] : heroImage ? [heroImage] : [],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'Lookitry Editorial',
      url: 'https://lookitry.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lookitry',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lookitry.com/logo.png', // Ajustar si hay una URL de logo oficial
      },
    },
    description: post.meta_description || post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lookitry.com/blog/${params.slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#FF5C3A]/30 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

        {heroImage && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/5">
            <img 
              src={heroImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Contenido (HTML renderizado) */}
        <section className="rounded-[2rem] border border-white/10 bg-[#f6f0ee] text-[#1f1f1f] shadow-[0_30px_80px_rgba(0,0,0,0.24)] overflow-hidden">
          <div 
            className={articleProseClass}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </section>

        {/* CTA Section */}
        <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#FF5C3A]/20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Quieres potenciar tu marca con try-on virtual?</h2>
          <p className="text-[#999] mb-8 max-w-xl mx-auto">Únete a cientos de marcas que ya están transformando la experiencia de compra de sus clientes con Lookitry.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/trial-checkout" 
              className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Comenzar prueba ahora
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
