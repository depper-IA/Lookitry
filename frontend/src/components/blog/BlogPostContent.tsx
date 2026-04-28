'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Tag, ChevronLeft, ArrowUpRight, Zap, BarChart3 } from 'lucide-react';
import BlogArticle, { TableOfContents } from './BlogArticle';
import { BlogImageWithFallback } from './BlogImageWithFallback';
import { useTheme } from './BlogThemeWrapper';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { cn } from '@/utils/cn';
import { getBlogFeaturedImage, getBlogTeaser } from '@/services/blog.service';
import { BlogShareRail } from './BlogShareRail';
import LeadMagnetBanner from './LeadMagnetBanner';

interface BlogPostContentProps {
  post: any;
  recentPosts: any[];
  shareUrl: string;
}

export default function BlogPostContent({ post, recentPosts, shareUrl }: BlogPostContentProps) {
  const { isDark } = useTheme();
  const heroImage = getBlogFeaturedImage(post);
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const parseTocItems = (toc?: string | Array<{title: string; id: string}>): Array<{title: string; id: string}> => {
    if (!toc) return [];
    if (Array.isArray(toc)) return toc;
    try {
      return JSON.parse(toc);
    } catch {
      return [];
    }
  };

  // Schema.org structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: heroImage ? [heroImage] : undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'Lookitry Editorial',
      url: 'https://lookitry.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lookitry',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lookitry.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lookitry.com/blog/${post.slug}`
    },
    articleSection: post.category?.name || 'Moda y Tecnología',
    keywords: post.tags?.join(', ') || '',
    wordCount: post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0
  };

  // BreadcrumbList for SEO
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://lookitry.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://lookitry.com/blog'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://lookitry.com/blog/${post.slug}`
      }
    ]
  };

  return (
    <div className="overflow-x-clip">
      {/* BlogPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogShareRail title={post.title} url={shareUrl} />
      <LandingNav />
      <main className={cn(
        "min-h-screen transition-colors duration-300 selection:bg-[#FF5C3A]/30",
        isDark ? "bg-[#0a0a0a]" : "bg-gray-50"
      )}>

        {/* Header del articulo */}
        <article className="mx-auto max-w-[1320px] px-6 pt-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#FF5C3A] hover:text-[#ff7a5f] mb-8 transition-colors text-sm font-semibold group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver al blog
          </Link>

          <div className="grid gap-12 xl:grid-cols-[minmax(0,780px)_280px] xl:justify-center xl:gap-16">
            <div className="min-w-0">
              {post.category && (
                <span className="text-[#FF5C3A] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                  {post.category.name}
                </span>
              )}

              <h1 className={cn(
                "text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] font-plus-jakarta tracking-tight transition-colors",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {post.title}
              </h1>

              <div className={cn(
                "flex flex-wrap items-center gap-6 text-sm mb-12 border-b pb-8 transition-colors",
                isDark ? "text-[#999] border-white/5" : "text-gray-500 border-black/5"
              )}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#FF5C3A]" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[#FF5C3A]" />
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag: string) => (
                        <span 
                          key={tag} 
                          className={cn(
                            "rounded-full border px-3 py-1 text-[#FF5C3A] transition-colors text-xs font-semibold",
                            isDark 
                              ? "border-[#FF5C3A]/20 bg-[#171717]" 
                              : "border-[#FF5C3A]/10 bg-white shadow-sm"
                          )}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {heroImage && (
                <div className={cn(
                  "relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border transition-colors",
                  isDark ? "border-white/5 bg-[#141414]" : "border-black/5 bg-gray-100"
                )}>
                  <BlogImageWithFallback
                    src={heroImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Responsive Table of Contents (Mobile/Tablet) */}
              {post.toc_items && (
                <TableOfContents items={parseTocItems(post.toc_items)} className="xl:hidden mb-8" />
              )}

              {/* Contenido (renderizado con BlogArticle para componentes ricos) */}
              <BlogArticle 
                title={post.title}
                content={post.content}
                tags={post.tags}
                publishedAt={post.published_at || post.created_at}
                readingTime={post.reading_time}
              />

              {/* Lead Magnet Banner */}
              <LeadMagnetBanner />

              <section className={cn(
                "mt-10 rounded-[2rem] border p-8 md:p-10 transition-all duration-300",
                isDark 
                  ? "border-white/10 bg-[#111111] shadow-[0_24px_70px_rgba(0,0,0,0.22)]" 
                  : "border-black/5 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.05)]"
              )}>
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className={cn(
                    "flex h-24 w-24 shrink-0 items-center justify-center rounded-full border p-4 shadow-lg",
                    isDark 
                      ? "border-[#FF5C3A]/25 bg-[radial-gradient(circle_at_top,rgba(255,92,58,0.22),rgba(17,17,17,1))] shadow-[#FF5C3A]/5" 
                      : "border-[#FF5C3A]/15 bg-[radial-gradient(circle_at_top,rgba(255,92,58,0.1),#fff)] shadow-[#FF5C3A]/10"
                  )}>
                    <img src="/logo.png" alt="Lookitry Editorial" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">El autor</div>
                    <h2 className={cn(
                      "font-plus-jakarta text-3xl font-black tracking-tight md:text-5xl",
                      isDark ? "text-white" : "text-gray-900"
                    )}>Lookitry Editorial</h2>
                    <p className={cn(
                      "mt-5 max-w-3xl text-base leading-8 md:text-[1.05rem]",
                      isDark ? "text-[#b7b7b7]" : "text-gray-600"
                    )}>
                      Publicamos análisis, guías y casos aplicados al ecommerce de moda en Latinoamérica. Cada artículo de Lookitry Editorial busca traducir tecnología, conversión y experiencia de compra en decisiones accionables para marcas que quieren vender mejor.
                    </p>
                    <Link
                      href="/sobre-nosotros"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A] transition-colors hover:text-[#ff7a5f]"
                    >
                      Conocer el equipo de Lookitry
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
            
            <aside className="mx-auto w-full max-w-[320px] xl:mx-0 xl:w-[280px]">
              <div className="xl:sticky xl:top-24 flex flex-col gap-10">
                {post.toc_items && (
                  <div className="hidden xl:block">
                    <TableOfContents items={parseTocItems(post.toc_items)} />
                  </div>
                )}

                <section className={cn(
                  "rounded-[1.75rem] border p-6 overflow-hidden relative transition-all duration-300",
                  isDark 
                    ? "border-white/10 bg-[#111111] shadow-2xl shadow-black/20" 
                    : "border-black/5 bg-white shadow-sm"
                )}>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] mb-4">Compartir</div>
                  <h2 className={cn(
                    "font-plus-jakarta text-xl md:text-2xl font-black tracking-tight mb-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    ¿Te sirvió este artículo?
                  </h2>
                  <p className={cn(
                    "text-sm leading-relaxed mb-6",
                    isDark ? "text-[#999]" : "text-gray-600"
                  )}>
                    Compártelo con tu equipo comercial o con otros fundadores que quieran mejorar su ecommerce de moda.
                  </p>
                  <div className={cn(
                    "hidden xl:block pt-4 border-t",
                    isDark ? "border-white/5" : "border-black/5"
                  )}>
                    <span className="text-xs font-semibold text-[#FF5C3A] flex items-center gap-2">
                      <ArrowUpRight size={14} />
                      Usa la barra lateral izquierda
                    </span>
                  </div>
                </section>

                <section className={cn(
                  "rounded-[1.75rem] border p-6 shadow-sm transition-all duration-300",
                  isDark 
                    ? "border-white/10 bg-[#111111]" 
                    : "border-black/5 bg-white"
                )}>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] mb-4">Recursos</div>
                  <div className="space-y-4">
                    <Link href="/blog" className="flex items-center justify-between group">
                      <span className={cn(
                        "text-sm font-semibold group-hover:text-[#FF5C3A] transition-colors",
                        isDark ? "text-white" : "text-gray-900"
                      )}>Todos los artículos</span>
                      <ChevronLeft size={14} className="text-[#FF5C3A] rotate-180" />
                    </Link>
                    <Link href="/trial-checkout" className="flex items-center justify-between group">
                      <span className={cn(
                        "text-sm font-semibold group-hover:text-[#FF5C3A] transition-colors",
                        isDark ? "text-white" : "text-gray-900"
                      )}>Probar LOOKITRY</span>
                      <Zap size={14} className="text-[#FF5C3A]" />
                    </Link>
                    <Link href="/planes" className="flex items-center justify-between group">
                      <span className={cn(
                        "text-sm font-semibold group-hover:text-[#FF5C3A] transition-colors",
                        isDark ? "text-white" : "text-gray-900"
                      )}>Planes y precios</span>
                      <BarChart3 size={14} className={isDark ? "text-[#999]" : "text-gray-400"} />
                    </Link>
                  </div>
                </section>
              </div>
            </aside>
          </div>

          {recentPosts.length > 0 && (
            <section className="mt-20">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Últimos artículos</div>
                  <h2 className={cn(
                    "mt-3 font-plus-jakarta text-3xl font-black tracking-tight md:text-4xl",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Sigue leyendo en Lookitry Editorial
                  </h2>
                </div>
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A] hover:text-[#ff7a5f]">
                  Ver todo el blog
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {recentPosts.map((recentPost: any) => {
                  const recentImage = getBlogFeaturedImage(recentPost);
                  return (
                    <Link
                      key={recentPost.id}
                      href={`/blog/${recentPost.slug}`}
                      className={cn(
                        "group overflow-hidden rounded-[1.75rem] border transition-all hover:-translate-y-1",
                        isDark 
                          ? "border-white/10 bg-[#111111] hover:border-[#FF5C3A]/30 hover:shadow-[0_22px_60px_rgba(0,0,0,0.22)]" 
                          : "border-black/5 bg-white shadow-sm hover:shadow-[0_22px_60px_rgba(0,0,0,0.05)] hover:border-[#FF5C3A]/20"
                      )}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#171717]">
                        {recentImage ? (
                          <BlogImageWithFallback
                            src={recentImage}
                            alt={recentPost.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            iconFallback
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#FF5C3A]/40">
                            LOOKITRY
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C3A]">
                          {(recentPost.category?.name || 'Lookitry Editorial')} • {formatDate(recentPost.published_at || recentPost.created_at)}
                        </div>
                        <h3 className={cn(
                          "mt-4 font-plus-jakarta text-2xl font-black leading-tight transition-colors group-hover:text-[#FF5C3A]",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {recentPost.title}
                        </h3>
                        <p className={cn(
                          "mt-4 line-clamp-3 text-sm leading-7",
                          isDark ? "text-[#a4a4a4]" : "text-gray-600"
                        )}>
                          {getBlogTeaser(recentPost)}
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#FF5C3A]">Por Lookitry Editorial</span>
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A]">
                            Leer artículo
                            <ArrowUpRight size={16} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
