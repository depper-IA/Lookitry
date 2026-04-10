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
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TocItem {
  title: string;
  id: string;
}

export type { TocItem };

interface BlogArticleProps {
  title: string;
  content: string;
  featuredImage?: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
  readingTime?: string;
  tocItems?: TocItem[];
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
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
// TABLE OF CONTENTS
// ============================================================================

export function TableOfContents({ items, className }: { items: TocItem[]; className?: string }) {
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

  if (!items || items.length === 0) return null;

  return (
    <nav className={cn("xl:sticky xl:top-24", className)}>
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
// SHARE BUTTONS
// ============================================================================

function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [url]);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  return (
    <div className="flex items-center gap-3">
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1DA1F2] transition-colors"
        aria-label="Compartir en Twitter"
      >
        <Twitter size={14} />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#0A66C2] transition-colors"
        aria-label="Compartir en LinkedIn"
      >
        <Linkedin size={14} />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1877F2] transition-colors"
        aria-label="Compartir en Facebook"
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
// ARTICLE CONTENT
// ============================================================================

function ArticleContent({ html }: { html: string }) {
  // Strip backend-generated header and inline TOC to avoid UI duplication
  const cleanHtml = html
    .replace(/<header class="blog-header">[\s\S]*?<\/header>/i, '')
    .replace(/<nav class="blog-toc"[^>]*>[\s\S]*?<\/nav>/i, '');

  return (
    <div 
      className="blog-content prose prose-invert prose-lg max-w-none
        prose-headings:text-white prose-headings:font-bold
        prose-p:text-gray-300 prose-p:leading-relaxed
        prose-a:text-[#FF5C3A] prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-[#FF5C3A] prose-blockquote:text-gray-400
        prose-strong:text-white
        prose-img:rounded-xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10
        prose-hr:border-white/10
        prose-li:text-gray-300"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

// ============================================================================
// ARTICLE FOOTER
// ============================================================================

function ArticleFooter({ 
  tags, 
  publishedAt, 
  readingTime 
}: { 
  tags?: string[]; 
  publishedAt?: string; 
  readingTime?: string;
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="rounded-full border border-[#FF5C3A]/20 bg-[#171717] px-4 py-1.5 text-[#FF5C3A] text-xs font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-[#999] text-sm ml-auto">
        {publishedAt && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#FF5C3A]" />
            <span>{formatDate(publishedAt)}</span>
          </div>
        )}
        {readingTime && (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#FF5C3A]" />
            <span>{readingTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BlogArticle({
  title,
  content,
  featuredImage,
  excerpt,
  author,
  publishedAt,
  category,
  tags,
  readingTime,
  tocItems = [],
}: BlogArticleProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* Custom styles for blog article elements */}
      <style jsx global>{`
        /* Callout blocks */
        [data-blog-callout] {
          border-radius: 12px;
          padding: 16px 20px;
          margin: 24px 0;
          font-weight: 500;
        }
        [data-blog-callout="stat"] {
          background: rgba(255, 92, 58, 0.1);
          border: 1px solid rgba(255, 92, 58, 0.3);
          color: #FF5C3A;
        }
        [data-blog-callout="tip"] {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        [data-blog-callout="warning"] {
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #eab308;
        }

        /* FAQ Accordion */
        [data-blog-faq="accordion"] {
          margin: 32px 0;
        }
        [data-blog-faq="accordion"] details {
          background: #1a1a1a;
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
        }
        [data-blog-faq="accordion"] summary {
          padding: 16px 20px;
          cursor: pointer;
          font-weight: 600;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          list-style: none;
        }
        [data-blog-faq="accordion"] summary::-webkit-details-marker { display: none; }
        [data-blog-faq="accordion"] summary::after {
          content: '+';
          font-size: 20px;
          font-weight: 300;
          color: #999;
          transition: transform 0.2s;
        }
        [data-blog-faq="accordion"] details[open] summary::after {
          content: '−';
        }
        [data-blog-faq="accordion"] div {
          padding: 0 20px 16px 20px;
          color: #999;
          line-height: 1.6;
        }

        /* CTA Final */
        [data-blog-cta] {
          background: linear-gradient(135deg, rgba(255, 92, 58, 0.15) 0%, rgba(255, 92, 58, 0.05) 100%);
          border: 1px solid rgba(255, 92, 58, 0.4);
          border-radius: 16px;
          padding: 32px;
          margin: 40px 0;
          text-align: center;
        }
        [data-blog-cta] h3 {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px 0;
        }
        [data-blog-cta] p {
          color: #999;
          margin: 0 0 24px 0;
        }
        [data-blog-cta] a {
          display: inline-block;
          background: #FF5C3A;
          color: white;
          font-weight: 700;
          padding: 14px 32px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s;
        }
        [data-blog-cta] a:hover {
          background: #e04a2c;
        }

        /* Body images */
        .blog-body-image {
          margin: 32px 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .blog-body-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Hero image */
        .blog-hero {
          width: 100%;
          aspect-ratio: 21/9;
          overflow: hidden;
          border-radius: 16px;
          margin-bottom: 32px;
        }
        .blog-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Table of Contents (sidebar) */
        .blog-toc {
          position: sticky;
          top: 100px;
          padding: 20px;
          background: #141414;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .blog-toc h4 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #666;
          margin: 0 0 16px 0;
        }
        .blog-toc ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .blog-toc li {
          margin-bottom: 8px;
        }
        .blog-toc a {
          color: #999;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .blog-toc a:hover {
          color: #FF5C3A;
        }
      `}</style>

      <div className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-8 md:p-12 mb-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <ArticleContent html={content} />
        <ArticleFooter 
          tags={tags} 
          publishedAt={publishedAt}
          readingTime={readingTime}
        />
      </div>
    </>
  );
}
