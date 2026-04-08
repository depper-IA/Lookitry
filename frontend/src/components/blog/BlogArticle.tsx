'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Tag, 
  ChevronLeft, 
  ArrowUpRight, 
  Clock,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  Check,
  ChevronDown,
  BookOpen,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface BlogArticleProps {
  post: {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    meta_description?: string;
    featured_image?: string;
    category?: {
      name: string;
      slug: string;
    };
    category_slug?: string;
    tags?: string[];
    published_at?: string;
    created_at?: string;
    updated_at?: string;
    reading_time?: number;
  };
  relatedPosts?: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    featured_image?: string;
    category?: { name: string };
    published_at?: string;
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TOC COMPONENT
// ============================================================================

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      setIsOpen(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="xl:sticky xl:top-24">
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden w-full flex items-center justify-between p-4 bg-[#111111] rounded-xl border border-white/10 mb-3"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#FF5C3A]">
          Índice del artículo
        </span>
        <ChevronDown 
          size={18} 
          className={cn(
            "text-[#999] transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Desktop Header */}
      <div className="hidden xl:block mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-[#FF5C3A]" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]">
            Contenido
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className={cn(
        "space-y-1",
        isOpen ? "block" : "hidden xl:block"
      )}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "block py-2 text-sm transition-all duration-200 border-l-2 pl-4",
                item.level === 2 && "ml-0",
                item.level === 3 && "ml-4 text-[#999]",
                activeId === item.id
                  ? "border-[#FF5C3A] text-white font-medium"
                  : "border-transparent text-[#999] hover:text-white hover:border-white/30"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============================================================================
// FAQ ACCORDION
// ============================================================================

function FaqAccordion({ html }: { html: string }) {
  // Parse FAQ from rendered HTML
  const faqMatch = html.match(/<div data-blog-faq="accordion">([\s\S]*?)<\/div>\s*<div data-blog-cta=/);
  
  if (!faqMatch) return null;

  return (
    <div className="mt-12 rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
      <div className="p-6 md:p-8 border-b border-white/10">
        <h3 className="font-plus-jakarta text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen size={24} className="text-[#FF5C3A]" />
          Preguntas Frecuentes
        </h3>
      </div>
      <div className="p-6 md:p-8 space-y-4">
        {/* FAQ items will be rendered via details/summary CSS */}
      </div>
    </div>
  );
}

// ============================================================================
// SHARE RAIL (Desktop sidebar)
// ============================================================================

function ShareRail({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [url]);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  return (
    <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#999] writing-mode-vertical mb-2">
        Compartir
      </span>
      
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 transition-all duration-200 hover:scale-110"
        aria-label="Compartir en Twitter"
      >
        <Twitter size={16} />
      </a>
      
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-all duration-200 hover:scale-110"
        aria-label="Compartir en LinkedIn"
      >
        <Linkedin size={16} />
      </a>
      
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1877F2] hover:border-[#1877F2]/30 transition-all duration-200 hover:scale-110"
        aria-label="Compartir en Facebook"
      >
        <Facebook size={16} />
      </a>
      
      <button
        onClick={handleCopy}
        className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all duration-200 hover:scale-110"
        aria-label="Copiar enlace"
      >
        {copied ? <Check size={16} className="text-[#FF5C3A]" /> : <Link2 size={16} />}
      </button>
    </div>
  );
}

// ============================================================================
// SHARE BUTTONS (Mobile)
// ============================================================================

function ShareButtonsMobile({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [url]);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  return (
    <div className="xl:hidden flex items-center gap-3">
      <span className="text-xs font-semibold text-[#999]">Compartir:</span>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1DA1F2] transition-colors"
        aria-label="Twitter"
      >
        <Twitter size={14} />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#0A66C2] transition-colors"
        aria-label="LinkedIn"
      >
        <Linkedin size={14} />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1877F2] transition-colors"
        aria-label="Facebook"
      >
        <Facebook size={14} />
      </a>
      <button
        onClick={handleCopy}
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#FF5C3A] transition-colors"
        aria-label="Copiar enlace"
      >
        {copied ? <Check size={14} className="text-[#FF5C3A]" /> : <Share2 size={14} />}
      </button>
    </div>
  );
}

// ============================================================================
// ARTICLE CONTENT (Processed HTML with styles)
// ============================================================================

function ArticleContent({ html, className }: { html: string; className?: string }) {
  const processedHtml = React.useMemo(() => {
    // Add IDs to H2s for TOC
    let processed = html.replace(
      /<h2([^>]*)data-toc-title="([^"]*)"([^>]*)>/gi,
      (match, before, title, after) => {
        const id = slugify(title);
        return `<h2${before}data-toc-title="${title}"${after} id="${id}">`;
      }
    );

    // Process FAQ accordion
    processed = processed.replace(
      /<div data-blog-faq="accordion">([\s\S]*?)<\/div>\s*<div data-blog-cta=/gi,
      (match, content) => {
        // Transform details/summary
        let faqContent = content.replace(
          /<details>/gi,
          '<details class="border-b border-white/5 last:border-0">'
        );
        faqContent = faqContent.replace(
          /<summary>(.*?)<\/summary>/gi,
          '<summary class="flex items-center justify-between py-4 cursor-pointer text-white font-medium hover:text-[#FF5C3A] transition-colors list-none [&::-webkit-details-marker]:hidden">$1<span class="text-[#999] group-open:rotate-180 transition-transform"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span></summary>'
        );
        return `<div data-blog-faq="accordion">${faqContent}</div><div data-blog-cta=`;
      }
    );

    return processed;
  }, [html]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BlogArticle({ post, relatedPosts = [] }: BlogArticleProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const shareUrl = `https://lookitry.com/blog/${post.slug}`;

  // Extract TOC items from content
  useEffect(() => {
    const tocMatches = post.content.matchAll(/<h2[^>]*data-toc-title="([^"]*)"/gi);
    const items: TocItem[] = [];
    for (const match of tocMatches) {
      const title = match[1];
      items.push({
        id: slugify(title),
        title,
        level: 2,
      });
    }
    setTocItems(items);
  }, [post.content]);

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.featured_image ? [post.featured_image] : [],
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
      '@id': shareUrl,
    },
  };

  // Article prose styles
  const articleProseClass = cn(
    // Base
    "prose max-w-none",
    // Headings
    "prose-headings:font-plus-jakarta prose-headings:tracking-tight",
    "prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-4",
    "prose-h3:text-xl prose-h3:font-bold prose-h3:text-[#FF5C3A]",
    // Paragraphs
    "prose-p:text-[#c8c4c0] prose-p:leading-8 prose-p:mb-6",
    // Links
    "prose-a:text-[#FF5C3A] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
    // Lists
    "prose-li:text-[#c8c4c0] prose-li:mb-2",
    "prose-ul:my-6 prose-ul:space-y-2",
    "prose-ol:my-6 prose-ol:space-y-3",
    // Images
    "prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10",
    // Figure & Figcaption
    "[&_figure]:my-10 [&_figure]:overflow-hidden",
    "[&_figcaption]:mt-4 [&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-[#999] [&_figcaption]:italic [&_figcaption]:text-center",
    // Blockquote
    "prose-blockquote:border-l-4 prose-blockquote:border-[#FF5C3A] prose-blockquote:pl-6 prose-blockquote:my-8",
    "prose-blockquote:not(:where([class~='prose'] *)) p:font-medium prose-blockquote:not(:where([class~='prose'] *)) p:text-white prose-blockquote:not(:where([class~='prose'] *)) p:text-lg",
    "prose-cite:block prose-cite:not(:where([class~='prose'] *)) prose-cite:text-[#999] prose-cite:not(:where([class~='prose'] *)) prose-cite:text-sm prose-cite:mt-3",
    // Lead paragraph
    "[&_[data-blog-intro='lead']]:mb-10 [&_[data-blog-intro='lead']]:text-xl [&_[data-blog-intro='lead']]:md:text-2xl [&_[data-blog-intro='lead']]:font-medium [&_[data-blog-intro='lead']]:text-white [&_[data-blog-intro='lead']]:leading-relaxed [&_[data-blog-intro='lead']]:border-l-4 [&_[data-blog-intro='lead']]:border-[#FF5C3A] [&_[data-blog-intro='lead']]:pl-6",
    // Impact blocks
    "[&_[data-blog-block='impact']]:my-10 [&_[data-blog-block='impact']]:rounded-2xl [&_[data-blog-block='impact']]:border [&_[data-blog-block='impact']]:bg-[#141414] [&_[data-blog-block='impact']]:p-8",
    "[&_[data-blog-block='impact'][data-type='stat']]:border-[#FF5C3A]/30 [&_[data-blog-block='impact'][data-type='stat']_h3]:text-[#FF5C3A]",
    "[&_[data-blog-block='impact'][data-type='tip']]:border-[#22c55e]/30 [&_[data-blog-block='impact'][data-type='tip']_h3]:text-[#22c55e]",
    "[&_[data-blog-block='impact'][data-type='warning']]:border-[#f59e0b]/30 [&_[data-blog-block='impact'][data-type='warning']_h3]:text-[#f59e0b]",
    "[&_[data-blog-block='impact']_h3]:flex [&_[data-blog-block='impact']_h3]:items-center [&_[data-blog-block='impact']_h3]:gap-3 [&_[data-blog-block='impact']_h3]:mb-4 [&_[data-blog-block='impact']_h3]:text-lg",
    "[&_[data-blog-block='impact']_p]:m-0 [&_[data-blog-block='impact']_p]:text-[#c8c4c0] [&_[data-blog-block='impact']_p]:leading-relaxed",
    // FAQ Accordion
    "[&_[data-blog-faq='accordion']]_details:border-b [&_[data-blog-faq='accordion']]_details:border-white/10 [&_[data-blog-faq='accordion']]_details:last:border-0",
    "[&_[data-blog-faq='accordion']]_summary:flex [&_[data-blog-faq='accordion']]_summary:items-center [&_[data-blog-faq='accordion']]_summary:justify-between [&_[data-blog-faq='accordion']]_summary:py-5 [&_[data-blog-faq='accordion']]_summary:cursor-pointer [&_[data-blog-faq='accordion']]_summary:text-white [&_[data-blog-faq='accordion']]_summary:hover:text-[#FF5C3A] [&_[data-blog-faq='accordion']]_summary:font-medium [&_[data-blog-faq='accordion']]_summary:transition-colors",
    "[&_[data-blog-faq='accordion']]_p:py-5 [&_[data-blog-faq='accordion']]_p:text-[#999] [&_[data-blog-faq='accordion']]_p:leading-relaxed [&_[data-blog-faq='accordion']]_p:m-0",
    // CTA Final
    "[&_[data-blog-cta='final']]:mt-16 [&_[data-blog-cta='final']]:rounded-3xl [&_[data-blog-cta='final']]:bg-gradient-to-br [&_[data-blog-cta='final']]:from-[#1a1a1a] [&_[data-blog-cta='final']]:to-[#0a0a0a] [&_[data-blog-cta='final']]:border [&_[data-blog-cta='final']]:border-[#FF5C3A]/20 [&_[data-blog-cta='final']]:p-10 [&_[data-blog-cta='final']]:text-center",
    "[&_[data-blog-cta='final']_h3]:font-plus-jakarta [&_[data-blog-cta='final']_h3]:text-2xl [&_[data-blog-cta='final']_h3]:md:text-3xl [&_[data-blog-cta='final']_h3]:font-bold [&_[data-blog-cta='final']_h3]:text-white [&_[data-blog-cta='final']_h3]:mb-4",
    "[&_[data-blog-cta='final']_p]:text-[#999] [&_[data-blog-cta='final']_p]:max-w-xl [&_[data-blog-cta='final']_p]:mx-auto [&_[data-blog-cta='final']_p]:mb-8",
    "[&_[data-blog-cta='final']_a]:inline-flex [&_[data-blog-cta='final']_a]:items-center [&_[data-blog-cta='final']_a]:justify-center [&_[data-blog-cta='final']_a]:rounded-full [&_[data-blog-cta='final']_a]:bg-[#FF5C3A] [&_[data-blog-cta='final']_a]:px-8 [&_[data-blog-cta='final']_a]:py-4 [&_[data-blog-cta='final']_a]:font-bold [&_[data-blog-cta='final']_a]:text-white [&_[data-blog-cta='final']_a]:hover:bg-[#e64d2e] [&_[data-blog-cta='final']_a]:transition-all [&_[data-blog-cta='final']_a]:hover:scale-105",
    // Strong
    "prose-strong:text-white prose-strong:font-semibold",
  );

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Share Rail (Desktop) */}
      <ShareRail title={post.title} url={shareUrl} />

      {/* Main Article */}
      <article className="mx-auto max-w-[1320px] px-6 pt-20">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#FF5C3A] hover:text-[#ff7a5f] mb-8 transition-colors text-sm font-semibold group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          {post.category && (
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              <span className="text-[#FF5C3A]">{post.category.name}</span>
            </span>
          )}

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] font-plus-jakarta tracking-tight">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-6 text-[#999] text-sm mb-8 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#FF5C3A]" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            
            {post.reading_time && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#FF5C3A]" />
                <span>{post.reading_time} min de lectura</span>
              </div>
            )}
            
            <ShareButtonsMobile title={post.title} url={shareUrl} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  className="rounded-full border border-[#FF5C3A]/20 bg-[#171717] px-4 py-1.5 text-[#FF5C3A] text-xs font-semibold transition-colors hover:border-[#FF5C3A]/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Hero Image */}
          {post.featured_image && (
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}
        </header>

        {/* Content Grid */}
        <div className="grid gap-12 xl:grid-cols-[1fr_280px] xl:gap-16">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Article Body */}
            <section className="rounded-[2rem] border border-white/10 bg-[#f6f0ee] text-[#1f1f1f] shadow-[0_30px_80px_rgba(0,0,0,0.24)] overflow-hidden">
              <ArticleContent 
                html={post.content} 
                className={articleProseClass}
              />
            </section>

            {/* Author Section */}
            <section className="mt-10 rounded-[2rem] border border-white/10 bg-[#111111] p-8 md:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#FF5C3A]/25 bg-[radial-gradient(circle_at_top,rgba(255,92,58,0.22),rgba(17,17,17,1))] p-4">
                  <span className="text-2xl font-black text-[#FF5C3A]">LE</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">
                    El autor
                  </div>
                  <h2 className="font-plus-jakarta text-2xl font-black tracking-tight text-white md:text-3xl">
                    Lookitry Editorial
                  </h2>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-[#b7b7b7]">
                    Publicamos análisis, guías y casos aplicados al ecommerce de moda en Latinoamérica. Cada artículo busca traducir tecnología, conversión y experiencia de compra en decisiones accionables.
                  </p>
                  <Link
                    href="/sobre-nosotros"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A] transition-colors hover:text-[#ff7a5f]"
                  >
                    Conocer el equipo
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </section>

            {/* CTA Section (Alternative) */}
            <div className="mt-10 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#FF5C3A]/20 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp size={24} className="text-[#FF5C3A]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#FF5C3A]">
                  Potencia tu marca
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                ¿Quieres transformar tu tienda con LOOKITRY?
              </h2>
              <p className="text-[#999] mb-8 max-w-xl mx-auto">
                Activa una experiencia de compra más clara, moderna y confiable para tus clientes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/trial-checkout"
                  className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
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

          {/* Sidebar (TOC) */}
          <aside className="mx-auto w-full max-w-[320px] xl:mx-0 xl:w-[280px] xl:pt-8">
            <TableOfContents items={tocItems} />
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-[#FF5C3A]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]">
                    Sigue leyendo
                  </span>
                </div>
                <h2 className="mt-3 font-plus-jakarta text-3xl font-black tracking-tight text-white md:text-4xl">
                  Artículos Relacionados
                </h2>
              </div>
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A] hover:text-[#ff7a5f] transition-colors"
              >
                Ver todo el blog
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111111] transition-all hover:-translate-y-1 hover:border-[#FF5C3A]/30 hover:shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#171717]">
                    {relatedPost.featured_image ? (
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
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
                      {relatedPost.category?.name || 'Lookitry Editorial'} • {formatDate(relatedPost.published_at || '')}
                    </div>
                    <h3 className="mt-4 font-plus-jakarta text-xl font-black leading-tight text-white transition-colors group-hover:text-[#FF5C3A]">
                      {relatedPost.title}
                    </h3>
                    {relatedPost.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#a4a4a4]">
                        {relatedPost.excerpt}
                      </p>
                    )}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#FF5C3A]">Por Lookitry</span>
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5C3A]">
                        Leer
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
