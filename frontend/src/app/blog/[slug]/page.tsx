import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { BlogShareRail } from '@/components/blog/BlogShareRail';
import { fetchBlogPostBySlug, fetchRecentBlogPosts, getBlogFeaturedImage, getBlogShareImage, getBlogTeaser } from '@/services/blog.service';
import { Calendar, Tag, ChevronLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import SanitizedHtml from '@/components/blog/SanitizedHtml';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

function sanitizeBlogHtml(content: string, featuredImage?: string | null) {
  let html = content || '';

  // 1. Manejar imágenes rotas (src vacío o solo espacios)
  // Buscamos etiquetas img que tengan src="" o src=" "
  const emptyImgRegex = /<img[^>]+src=["']\s*["'][^>]*>/gi;
  
  if (featuredImage) {
    // Si tenemos imagen destacada, la usamos como fallback para la PRIMERA imagen rota
    let hasReplaced = false;
    html = html.replace(emptyImgRegex, (match) => {
      if (!hasReplaced) {
        hasReplaced = true;
        // Reemplazar el src vacío por la imagen destacada
        return match.replace(/src=["']\s*["']/i, `src="${featuredImage}"`);
      }
      // Para el resto de imágenes rotas, las eliminamos para no repetir la misma foto
      return '';
    });
  } else {
    // Si no hay imagen destacada, eliminamos todas las imágenes rotas
    html = html.replace(emptyImgRegex, '');
  }

  // 2. Limpiar figuras que quedaron vacías después de quitar la imagen
  html = html.replace(/<figure>\s*<\/figure>/gi, '');
  
  // 3. Caso especial: figura con figcaption pero sin imagen (limpieza extra)
  html = html.replace(/<figure>\s*(?:<img[^>]+src=["']\s*["'][^>]*>)?\s*<figcaption>(.*?)<\/figcaption>\s*<\/figure>/gi, (match, caption) => {
    return `<figure className="bg-white/5 p-4 rounded-xl border border-white/5 my-8 italic text-center text-[#6d625c]">${caption}</figure>`;
  });

  return html;
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
  const articleHtml = sanitizeBlogHtml(post.content, heroImage);
  const shareUrl = `https://lookitry.com/blog/${params.slug}`;

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
    prose-a:text-[#FF5C3A] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
    prose-img:rounded-[1.25rem] prose-img:shadow-lg
    [&_figure]:my-10 [&_figure]:overflow-hidden
    [&_figcaption]:mt-3 [&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-[#6d625c]
    [&_[data-blog-intro='lead']]:mb-10 [&_[data-blog-intro='lead']]:rounded-[1.75rem] [&_[data-blog-intro='lead']]:border [&_[data-blog-intro='lead']]:border-[#FF5C3A]/20 [&_[data-blog-intro='lead']]:bg-[linear-gradient(135deg,rgba(255,92,58,0.12),rgba(255,255,255,0.88))] [&_[data-blog-intro='lead']]:px-6 [&_[data-blog-intro='lead']]:py-6 [&_[data-blog-intro='lead']]:text-[1.08rem] [&_[data-blog-intro='lead']]:font-medium [&_[data-blog-intro='lead']]:leading-8 [&_[data-blog-intro='lead']]:text-[#1b1715]
    [&_[data-blog-block='impact']]:my-8 [&_[data-blog-block='impact']]:rounded-[1.5rem] [&_[data-blog-block='impact']]:border [&_[data-blog-block='impact']]:border-[#101010]/10 [&_[data-blog-block='impact']]:bg-white/80 [&_[data-blog-block='impact']]:px-6 [&_[data-blog-block='impact']]:py-6 [&_[data-blog-block='impact']]:shadow-[0_18px_40px_rgba(0,0,0,0.06)] [&_[data-blog-block='impact']_h3]:mt-0 [&_[data-blog-block='impact']_h3]:mb-3 [&_[data-blog-block='impact']_h3]:text-[#101010] [&_[data-blog-block='impact']_ul]:my-0 [&_[data-blog-block='impact']_li]:marker:text-[#FF5C3A] [&_[data-blog-block='impact']_a]:text-[#FF5C3A] [&_[data-blog-block='impact']_a]:font-semibold
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />
      <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#FF5C3A]/30 pb-20">
      <BlogShareRail title={post.title} url={shareUrl} />

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
              <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/5">
                <img
                  src={heroImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Contenido (HTML renderizado con sanitización XSS) */}
            <section className="rounded-[2rem] border border-white/10 bg-[#f6f0ee] text-[#1f1f1f] shadow-[0_30px_80px_rgba(0,0,0,0.24)] overflow-hidden">
              <SanitizedHtml html={articleHtml} className={articleProseClass} />
            </section>

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

            {/* CTA Section */}
            <div className="mt-10 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#FF5C3A]/20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Quieres potenciar tu marca con LOOKITRY?</h2>
              <p className="text-[#999] mb-8 max-w-xl mx-auto">Activa una experiencia de compra mas clara, moderna y confiable para tus clientes con LOOKITRY.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/trial-checkout"
                  className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-bold py-3 px-8 rounded-full transition-all"
                >
                  Comenzar prueba ahora
                </Link>
                <Link
                  href="/planes"
                  className="border border-[#FF5C3A]/25 bg-[#1a1a1a] text-[#FF5C3A] hover:bg-[#221613] font-bold py-3 px-8 rounded-full transition-all"
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
          <aside className="mx-auto w-full max-w-[320px] xl:mx-0 xl:w-[280px] xl:pt-8">
            <div className="xl:sticky xl:top-24 space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Compartir</div>
                <h2 className="mt-3 font-plus-jakarta text-2xl font-black tracking-tight text-white">Comparte este artículo</h2>
                <p className="mt-3 text-sm leading-7 text-[#999]">
                  Si este contenido te sirvió, compártelo con tu equipo comercial o con otras marcas que quieran mejorar su ecommerce.
                </p>
                <div className="mt-4 hidden xl:block text-sm font-semibold text-[#FF5C3A]">
                  Usa la barra lateral para compartirlo.
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Navegación rápida</div>
                <div className="mt-4 space-y-3">
                  <Link href="/blog" className="block text-sm font-semibold text-[#FF5C3A] hover:text-[#ff7a5f]">
                    Ver todos los artículos
                  </Link>
                  <Link href="/trial-checkout" className="block text-sm font-semibold text-[#FF5C3A] hover:text-[#ff7a5f]">
                    Probar LOOKITRY
                  </Link>
                  <Link href="/planes" className="block text-sm font-semibold text-[#FF5C3A] hover:text-[#ff7a5f]">
                    Revisar planes y precios
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
                        <img
                          src={recentImage}
                          alt={recentPost.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
    </>
  );
}
