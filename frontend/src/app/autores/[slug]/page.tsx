import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Linkedin,
  Instagram,
  Github,
  Mail,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { fetchAuthorBySlug } from '@/services/authors.service';
import { BlogAuthor, AuthorArticle } from '@/services/authors.service';

const APP_BASE_URL = 'https://lookitry.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function IconBehance({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
      <path d="M9 12v8" />
      <path d="M13 12h6" />
      <path d="M13 16h6" />
      <path d="M13 8h6" />
    </svg>
  );
}

function buildPersonSchema(author: BlogAuthor) {
  const avatar = author.avatar_url
    ? author.avatar_url.startsWith('http')
      ? author.avatar_url
      : `${APP_BASE_URL}${author.avatar_url}`
    : undefined;

  const sameAs = author.social_links
    ? Object.values(author.social_links).filter((v): v is string => Boolean(v))
    : undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role,
    url: `${APP_BASE_URL}/autores/${author.slug}`,
    description: author.bio || undefined,
    image: avatar,
  };

  if (author.expertise && author.expertise.length > 0) {
    schema.knowsAbout = author.expertise;
  }

  if (sameAs && sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (author.credentials) {
    schema.alumniOf = author.credentials;
  }

  return schema;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchAuthorBySlug(slug);

  if (!data) {
    return { title: 'Autor no encontrado | Lookitry' };
  }

  const { author } = data;
  return {
    title: `${author.name} — ${author.role} | Lookitry`,
    description: author.bio?.slice(0, 160) || `${author.name}, ${author.role} en Lookitry.`,
    alternates: { canonical: `${APP_BASE_URL}/autores/${author.slug}` },
    openGraph: {
      title: `${author.name} — ${author.role}`,
      description: author.bio?.slice(0, 160) || `${author.name}, ${author.role} en Lookitry.`,
      type: 'profile',
      url: `${APP_BASE_URL}/autores/${author.slug}`,
    },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchAuthorBySlug(slug);

  if (!data) {
    notFound();
  }

  const { author, articles } = data;
  const personSchema = buildPersonSchema(author);
  const socialLinks = author.social_links || {};

  return (
    <div className="overflow-x-clip min-h-screen bg-[#0a0a0a]">
      <LandingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="pt-24 pb-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="text-xs text-[#777] mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF5C3A] transition-colors">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/sobre-nosotros" className="hover:text-[#FF5C3A] transition-colors">Equipo</Link>
            <span className="mx-2">/</span>
            <span className="text-[#999]">{author.name}</span>
          </nav>

          {/* Hero / Profile */}
          <header className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              {author.avatar_url && (
                <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-[#141414] border border-[#2a2a2a] flex-shrink-0">
                  <Image
                    src={author.avatar_url}
                    alt={`Foto de ${author.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF5C3A] mb-2">
                  {author.role}
                </p>
                <h1 className="font-syne font-extrabold text-3xl md:text-5xl text-white tracking-tight mb-4">
                  {author.name}
                </h1>
                {author.credentials && (
                  <p className="text-[#999] text-sm mb-4 font-light">
                    {author.credentials}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/50 text-[#999] hover:text-white px-4 py-2 rounded-xl transition-all text-sm"
                    >
                      <Linkedin size={16} /> LinkedIn
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/50 text-[#999] hover:text-white px-4 py-2 rounded-xl transition-all text-sm"
                    >
                      <Instagram size={16} /> Instagram
                    </a>
                  )}
                  {socialLinks.github && (
                    <a
                      href={socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/50 text-[#999] hover:text-white px-4 py-2 rounded-xl transition-all text-sm"
                    >
                      <Github size={16} /> GitHub
                    </a>
                  )}
                  {socialLinks.behance && (
                    <a
                      href={socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/50 text-[#999] hover:text-white px-4 py-2 rounded-xl transition-all text-sm"
                    >
                      <IconBehance size={16} /> Behance
                    </a>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Bio */}
          {author.bio && (
            <section className="mb-12">
              <h2 className="font-syne font-bold text-xl text-white mb-4">Sobre {author.name}</h2>
              <p className="text-[#bbb] text-base md:text-lg leading-relaxed font-light whitespace-pre-line">
                {author.bio}
              </p>
            </section>
          )}

          {/* Expertise */}
          {author.expertise && author.expertise.length > 0 && (
            <section className="mb-12">
              <h2 className="font-syne font-bold text-xl text-white mb-4">Áreas de expertise</h2>
              <div className="flex flex-wrap gap-2">
                {author.expertise.map((area) => (
                  <span
                    key={area}
                    className="bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/30 px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-bold text-xl text-white">
                Artículos publicados ({articles.length})
              </h2>
              <Link
                href="/blog"
                className="text-[#FF5C3A] text-sm font-medium hover:underline flex items-center gap-1"
              >
                Ver todos los artículos <ArrowUpRight size={14} />
              </Link>
            </div>

            {articles.length === 0 ? (
              <p className="text-[#777]">Este autor aún no tiene artículos publicados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function ArticleCard({ article }: { article: AuthorArticle }) {
  const publishedDate = article.published_at || article.created_at;
  const formattedDate = new Date(publishedDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#FF5C3A]/40 transition-all"
    >
      {article.featured_image && (
        <div className="relative w-full aspect-[16/9] bg-[#0a0a0a]">
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        {article.category && (
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#FF5C3A] mb-2">
            {article.category.name}
          </p>
        )}
        <h3 className="font-syne font-bold text-base text-white leading-snug mb-2 group-hover:text-[#FF5C3A] transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-[#999] font-light mb-3 line-clamp-2">
          {article.meta_description || article.excerpt}
        </p>
        <p className="text-[10px] text-[#777]">{formattedDate}</p>
      </div>
    </Link>
  );
}