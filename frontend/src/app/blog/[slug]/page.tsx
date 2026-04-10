import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { BlogShareRail } from '@/components/blog/BlogShareRail';
import { fetchBlogPostBySlug, fetchRecentBlogPosts, getBlogFeaturedImage, getBlogShareImage, getBlogTeaser } from '@/services/blog.service';
import { Calendar, Tag, ChevronLeft, ArrowUpRight, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import BlogArticle, { TableOfContents } from '@/components/blog/BlogArticle';
import { BlogImageWithFallback } from '@/components/blog/BlogImageWithFallback';
import { BlogThemeWrapper, BlogHeader } from '@/components/blog/BlogThemeWrapper';

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
    alternates: {
      canonical: `https://lookitry.com/blog/${params.slug}`,
    },
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

  const recentPosts = await fetchRecentBlogPosts(3, post.slug);
  const heroImage = getBlogFeaturedImage(post);
  const socialImage = getBlogShareImage(post);
  const shareUrl = `https://lookitry.com/blog/${params.slug}`;

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
        url: 'https://lookitry.com/logo.png',
      },
    },
    description: post.meta_description || post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lookitry.com/blog/${params.slug}`,
    },
  };

  return (
    <BlogThemeWrapper>
      <div className="overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LandingNav />
        <BlogHeader />
        <main className="min-h-screen bg-[#0a0a0a] dark:bg-[#0a0a0a] light:bg-[#fafafa] selection:bg-[#FF5C3A]/30">

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
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="rounded-full border border-[#FF5C3A]/20 bg-[#171717] px-3 py-1 text-[#FF5C3A] transition-colors">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {heroImage && (
              <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/5 bg-[#141414]">
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

            <section className="mt-10 rounded-[2rem] border border-white/10 bg-[#111111] p-8 md:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#FF5C3A]/25 bg-[radial-gradient(circle_at_top,rgba(255,92,58,0.22),rgba(17,17,17,1))] p-4">
                  <img src="/logo.png" alt="Lookitry Editorial" className="h-full w-full rounded-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">El autor</div>
                  <h2 className="font-plus-jakarta text-3xl font-black tracking-tight text-white md:text-5xl">Lookitry Editorial</h2>
                  <p className="mt-5 max-w-3xl text-base leading-8 text-[#b7b7b7] md:text-[1.05rem]">
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

              <section className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-6 shadow-sm overflow-hidden relative">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] mb-4">Compartir</div>
                <h2 className="font-plus-jakarta text-xl md:text-2xl font-black tracking-tight text-white mb-4">
                  ¿Te sirvió este artículo?
                </h2>
                <p className="text-sm leading-relaxed text-[#999] mb-6">
                  Compártelo con tu equipo comercial o con otros fundadores que quieran mejorar su ecommerce de moda.
                </p>
                <div className="hidden xl:block pt-4 border-t border-white/5">
                  <span className="text-xs font-semibold text-[#FF5C3A] flex items-center gap-2">
                    <ArrowUpRight size={14} />
                    Usa la barra lateral izquierda
                  </span>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] mb-4">Recursos</div>
                <div className="space-y-4">
                  <Link href="/blog" className="flex items-center justify-between group">
                    <span className="text-sm font-semibold text-white group-hover:text-[#FF5C3A] transition-colors">Todos los artículos</span>
                    <ChevronLeft size={14} className="text-[#FF5C3A] rotate-180" />
                  </Link>
                  <Link href="/trial-checkout" className="flex items-center justify-between group">
                    <span className="text-sm font-semibold text-white group-hover:text-[#FF5C3A] transition-colors">Probar LOOKITRY</span>
                    <Zap size={14} className="text-[#FF5C3A]" />
                  </Link>
                  <Link href="/planes" className="flex items-center justify-between group">
                    <span className="text-sm font-semibold text-white group-hover:text-[#FF5C3A] transition-colors">Planes y precios</span>
                    <BarChart3 size={14} className="text-[#999]" />
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
                <h2 className="mt-3 font-plus-jakarta text-3xl font-black tracking-tight text-white md:text-4xl">
                  Sigue leyendo en Lookitry Editorial
                </h2>
              </div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A] hover:text-[#ff7a5f]">
                Ver todo el blog
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {recentPosts.map((recentPost) => {
                const recentImage = getBlogFeaturedImage(recentPost);
                return (
                  <Link
                    key={recentPost.id}
                    href={`/blog/${recentPost.slug}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111111] transition-all hover:-translate-y-1 hover:border-[#FF5C3A]/30 hover:shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
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
                      <h3 className="mt-4 font-plus-jakarta text-2xl font-black leading-tight text-[#FF5C3A] transition-colors group-hover:text-[#ff7a5f]">
                        {recentPost.title}
                      </h3>
                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#a4a4a4]">
                        {getBlogTeaser(recentPost, 'Descubre una idea accionable para vender mejor, reducir fricción y darle más claridad a tu ecommerce de moda con LOOKITRY.')}
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
    </BlogThemeWrapper>
  );
}
