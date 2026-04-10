'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  Target,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  BarChart3,
  ChevronRight,
  Eye,
  MessageCircle,
  ExternalLink,
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
// CONSTANTS
// ============================================================================

const CTA_INTERESTS = [
  { icon: Zap, label: 'Prueba gratis', href: '/trial-checkout', color: '#FF5C3A' },
  { icon: TrendingUp, label: 'Ver planes', href: '/planes', color: '#22c55e' },
  { icon: Target, label: 'Solicitar demo', href: '/contacto', color: '#3b82f6' },
];

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

function getRandomCTA() {
  return CTA_INTERESTS[0]; // Stable fallback for SSR
}

// ============================================================================
// READING PROGRESS
// ============================================================================

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[#FF5C3A] origin-left z-[100]"
      style={{ scaleX }}
    />
  );
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
    <nav className={cn(className)}>
      {/* Mobile Toggle */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#FF5C3A]/10 to-transparent rounded-xl border border-[#FF5C3A]/20 mb-3"
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#FF5C3A] flex items-center gap-2">
          <BookOpen size={14} />
          Índice del artículo
        </span>
        <ChevronDown 
          size={18} 
          className={cn(
            "text-[#FF5C3A] transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </motion.button>

      {/* Desktop Header */}
      <div className="hidden xl:block mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-gradient-to-r from-[#FF5C3A] to-transparent" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A] flex items-center gap-2">
            <Sparkles size={10} />
            Contenido
          </span>
        </div>
      </div>

      {/* Items */}
      <motion.ul 
        className={cn(
          "space-y-1",
          isOpen ? "block" : "hidden xl:block"
        )}
      >
        {items.map((item, index) => (
          <motion.li 
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "block py-2 text-sm transition-all duration-200 border-l-2 pl-4 relative overflow-hidden group",
                activeId === item.id
                  ? "border-[#FF5C3A] text-white font-semibold"
                  : "border-transparent text-[#999] hover:text-white hover:border-white/30"
              )}
            >
              <span className={cn(
                "absolute left-0 top-0 bottom-0 w-0 bg-[#FF5C3A]/10 transition-all duration-300",
                activeId === item.id && "w-full"
              )} />
              <span className="relative flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all",
                  activeId === item.id 
                    ? "border-[#FF5C3A] bg-[#FF5C3A] text-white" 
                    : "border-white/30 text-white/50 group-hover:border-[#FF5C3A]/50"
                )}>
                  {index + 1}
                </span>
                {item.title}
              </span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
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
      <motion.a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all"
        aria-label="Compartir en Twitter"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Twitter size={15} />
      </motion.a>
      <motion.a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all"
        aria-label="Compartir en LinkedIn"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Linkedin size={15} />
      </motion.a>
      <motion.a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all"
        aria-label="Compartir en Facebook"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Facebook size={15} />
      </motion.a>
      <motion.button
        onClick={handleCopy}
        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#999] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/50 transition-all"
        aria-label="Copiar enlace"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {copied ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[#FF5C3A]"
          >
            <Check size={15} />
          </motion.span>
        ) : (
          <Share2 size={15} />
        )}
      </motion.button>
    </div>
  );
}

// ============================================================================
// INLINE CTA COMPONENT
// ============================================================================

function InlineCTA({ type = 'default' }: { type?: 'default' | 'highlight' | 'minimal' }) {
  const [cta, setCta] = useState(CTA_INTERESTS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCta(CTA_INTERESTS[Math.floor(Math.random() * CTA_INTERESTS.length)]);
  }, []);

  if (!mounted) return null; // Avoid mismatch during hydration

  const Icon = cta.icon;
  
  if (type === 'minimal') {
    return (
      <motion.div
        className="my-8 inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 text-sm"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Icon size={16} className="text-[#FF5C3A]" />
        <span className="text-gray-300">¿Te interesa?</span>
        <Link href={cta.href} className="text-[#FF5C3A] font-semibold hover:underline flex items-center gap-1">
          {cta.label} <ChevronRight size={14} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "my-10 rounded-2xl border p-6 md:p-8",
        type === 'highlight' 
          ? "bg-gradient-to-r from-[#FF5C3A]/10 via-[#FF5C3A]/5 to-transparent border-[#FF5C3A]/30" 
          : "bg-[#141414] border-white/10"
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${cta.color}20` }}
          >
            <Icon size={22} style={{ color: cta.color }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF5C3A] mb-1">Contenido relacionado</p>
            <p className="text-white font-semibold">Descubre cómo {cta.label.toLowerCase()} puede ayudarte</p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
            style={{ backgroundColor: cta.color }}
          >
            {cta.label}
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAT BOX COMPONENT
// ============================================================================

function StatBox({ value, label, icon: Icon }: { value: string; label: string; icon?: React.ElementType }) {
  return (
    <motion.div
      className="bg-gradient-to-br from-[#FF5C3A]/10 to-transparent rounded-xl p-5 border border-[#FF5C3A]/20"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon size={18} className="text-[#FF5C3A]" />}
        <span className="text-3xl font-black text-white">{value}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
}

// ============================================================================
// STEP BOX COMPONENT
// ============================================================================

function StepBox({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <motion.div
      className="relative pl-12 py-4"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#FF5C3A] flex items-center justify-center">
        <span className="text-white font-black text-sm">{number}</span>
      </div>
      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-[#FF5C3A]/50 to-transparent" />
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ============================================================================
// PULL QUOTE COMPONENT
// ============================================================================

function PullQuote({ text, author }: { text: string; author?: string }) {
  return (
    <motion.blockquote
      className="relative my-10 py-6 px-8 border-l-4 border-[#FF5C3A]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="absolute -top-3 left-8 text-6xl text-[#FF5C3A]/30 font-serif">&quot;</div>
      <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic">
        {text}
      </p>
      {author && (
        <footer className="mt-4 text-sm text-[#FF5C3A] font-semibold">— {author}</footer>
      )}
    </motion.blockquote>
  );
}

// ============================================================================
// INFO BOX COMPONENT
// ============================================================================

function InfoBox({ type, title, children }: { type: 'tip' | 'warning' | 'stat' | 'note'; title: string; children: React.ReactNode }) {
  const styles = {
    tip: {
      bg: 'from-[#22c55e]/10 to-transparent',
      border: 'border-[#22c55e]/30',
      icon: Lightbulb,
      iconColor: '#22c55e',
    },
    warning: {
      bg: 'from-[#eab308]/10 to-transparent',
      border: 'border-[#eab308]/30',
      icon: AlertCircle,
      iconColor: '#eab308',
    },
    stat: {
      bg: 'from-[#FF5C3A]/10 to-transparent',
      border: 'border-[#FF5C3A]/30',
      icon: BarChart3,
      iconColor: '#FF5C3A',
    },
    note: {
      bg: 'from-[#3b82f6]/10 to-transparent',
      border: 'border-[#3b82f6]/30',
      icon: Eye,
      iconColor: '#3b82f6',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <motion.div
      className={cn(
        "my-8 rounded-xl border p-5 bg-gradient-to-br",
        style.bg,
        style.border
      )}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${style.iconColor}20` }}
        >
          <Icon size={16} style={{ color: style.iconColor }} />
        </div>
        <h4 className="font-bold text-white">{title}</h4>
      </div>
      <div className="text-gray-300 text-sm leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================================================
// ARTICLE CONTENT
// ============================================================================

function ArticleContent({ html }: { html: string }) {
  // Strip backend-generated header (with hero image, title, excerpt) and inline TOC to avoid UI duplication
  // We strip the entire article shell structure since the frontend page renders these elements separately
  let cleanHtml = html
    // Remove the article wrapper
    .replace(/<article class="blog-article">/i, '')
    // Remove header with hero image, title, excerpt, meta
    .replace(/<header class="blog-header">[\s\S]*?<\/header>\s*/i, '')
    // Remove standalone TOC nav (in case it appears outside header)
    .replace(/<nav class="blog-toc"[^>]*>[\s\S]*?<\/nav>\s*/i, '')
    // Remove blog-layout wrapper div if present
    .replace(/<div class="blog-layout">/i, '')
    // Remove closing blog-layout div
    .replace(/<\/div>\s*(<div class="blog-content">)/i, '$1');

  return (
    <div 
      className="blog-content relative
        prose prose-invert prose-lg max-w-none
        prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:capitalize
        prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:capitalize
        prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-3 prose-h4:capitalize
        prose-p:text-gray-300 prose-p:text-justify prose-p:leading-loose prose-p:mb-6
        prose-a:text-[#FF5C3A] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:bg-[#FF5C3A]/10 hover:prose-a:px-1 hover:prose-a:rounded transition-all
        prose-blockquote:border-l-[#FF5C3A] prose-blockquote:bg-[#FF5C3A]/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-gray-300
        prose-strong:text-white prose-strong:font-bold
        prose-em:text-gray-200
        prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10
        prose-hr:border-white/10 prose-hr:my-12
        prose-li:text-gray-300 prose-li:leading-relaxed prose-li:mb-2
        prose-ul:my-6 prose-ul:space-y-2
        prose-ol:my-6 prose-ol:space-y-3
        marker:text-[#FF5C3A] marker:font-bold
        first-of-type:prose-p:text-justify
        [&>p:first-of-type::first-letter]:float-left [&>p:first-of-type::first-letter]:text-6xl [&>p:first-of-type::first-letter]:font-black [&>p:first-of-type::first-letter]:text-[#FF5C3A] [&>p:first-of-type::first-letter]:mr-3 [&>p:first-of-type::first-letter]:leading-none [&>p:first-of-type::first-letter]:mt-1"
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
    <motion.div 
      className="mt-12 pt-8 border-t border-white/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-wrap items-center gap-4">
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.span 
                key={tag} 
                className="rounded-full border border-[#FF5C3A]/20 bg-[#171717] px-4 py-1.5 text-[#FF5C3A] text-xs font-semibold"
                whileHover={{ scale: 1.05 }}
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-6 text-[#999] text-sm ml-auto">
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
    </motion.div>
  );
}

// ============================================================================
// NEWSLETTER CTA
// ============================================================================

function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <motion.div
      className="my-12 rounded-2xl border border-[#FF5C3A]/20 bg-gradient-to-br from-[#FF5C3A]/10 via-[#141414] to-[#141414] p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/20 flex items-center justify-center">
          <MessageCircle size={20} className="text-[#FF5C3A]" />
        </div>
        <div>
          <h4 className="text-white font-bold">Suscríbete al newsletter</h4>
          <p className="text-gray-400 text-sm">Recibe análisis y guías cada semana</p>
        </div>
      </div>
      
      {submitted ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 text-[#22c55e]"
        >
          <ThumbsUp size={20} />
          <span className="font-semibold">¡Gracias por suscribirte! Revisa tu email para confirmar.</span>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="flex-1 px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF5C3A]/50 transition-colors"
            required
          />
          <motion.button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#FF5C3A] text-white font-bold whitespace-nowrap"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Suscribirme
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================

function FinalCTA() {
  return (
    <motion.div
      className="mt-16 rounded-3xl overflow-hidden border border-[#FF5C3A]/30 bg-gradient-to-br from-[#141414] via-[#0a0a0a] to-[#141414] p-10 text-center relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#FF5C3A]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#FF5C3A]/5 rounded-full blur-[80px]" />
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-sm font-bold mb-6">
          <Sparkles size={14} />
          Empieza hoy
        </div>
        
        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Transforma tu ecommerce con LOOKITRY
        </h3>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Únete a cientos de marcas de moda que ya están usando Try-On virtual para aumentar sus conversiones y reducir devoluciones.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/trial-checkout"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF5C3A] text-white font-bold text-lg shadow-lg shadow-[#FF5C3A]/25"
            >
              <Zap size={20} />
              Prueba gratis 7 días
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/planes"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-bold text-lg hover:border-white/40 transition-colors"
            >
              Ver planes
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Check size={14} className="text-[#22c55e]" /> Sin tarjeta de crédito
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-[#22c55e]" /> Configuración en 5 min
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-[#22c55e]" /> Soporte en español
          </span>
        </div>
      </div>
    </motion.div>
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
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  return (
    <>
      <ReadingProgress />
      
      {/* Custom styles for blog article elements */}
      <style jsx global>{`
        /* Enhanced typography */
        .blog-content {
          font-feature-settings: 'kern' 1, 'liga' 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
        
        /* Capitalize first letter styling */
        .blog-content > p:first-of-type::first-letter {
          float: left;
          font-size: 4rem;
          line-height: 1;
          font-weight: 900;
          color: #FF5C3A;
          margin-right: 0.75rem;
          margin-top: 0.125rem;
          text-shadow: 0 0 40px rgba(255, 92, 58, 0.3);
        }

        /* Enhanced links */
        .blog-content a {
          color: #FF5C3A;
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .blog-content a:hover {
          border-bottom-color: #FF5C3A;
          background: rgba(255, 92, 58, 0.1);
          padding: 0 2px;
          border-radius: 2px;
        }

        /* Enhanced lists */
        .blog-content ul {
          list-style: none;
          padding-left: 0;
        }
        .blog-content ul li {
          position: relative;
          padding-left: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .blog-content ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 8px;
          height: 8px;
          background: #FF5C3A;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 92, 58, 0.5);
        }

        .blog-content ol {
          counter-reset: list-counter;
          padding-left: 0;
          list-style: none;
        }
        .blog-content ol li {
          position: relative;
          padding-left: 2.5rem;
          margin-bottom: 0.75rem;
          counter-increment: list-counter;
        }
        .blog-content ol li::before {
          content: counter(list-counter);
          position: absolute;
          left: 0;
          top: 0;
          width: 1.75rem;
          height: 1.75rem;
          background: linear-gradient(135deg, #FF5C3A, #ff7a5f);
          border-radius: 50%;
          color: white;
          font-size: 0.75rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255, 92, 58, 0.3);
        }

        /* Enhanced blockquotes */
        .blog-content blockquote {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 92, 58, 0.08), rgba(255, 92, 58, 0.02));
          border-left: 4px solid #FF5C3A;
          border-radius: 0 12px 12px 0;
          padding: 1.5rem 2rem;
          margin: 2rem 0;
          font-style: normal;
        }
        .blog-content blockquote::before {
          content: '"';
          position: absolute;
          top: -0.5rem;
          left: 1rem;
          font-size: 5rem;
          color: #FF5C3A;
          opacity: 0.2;
          font-family: Georgia, serif;
          line-height: 1;
        }

        /* Enhanced headings */
        .blog-content h2 {
          position: relative;
          padding-bottom: 1rem;
          margin-top: 3rem;
        }
        .blog-content h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #FF5C3A, transparent);
          border-radius: 2px;
        }
        .blog-content h3 {
          position: relative;
        }
        .blog-content h3:not([data-blog-cta] h3):not(.blog-cta-inline h3):not(.blog-interlink-box h3)::before {
          content: '#';
          position: absolute;
          left: -1.5rem;
          color: #FF5C3A;
          opacity: 0.5;
          font-size: 1.25rem;
        }

        /* Enhanced images */
        .blog-content img {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          margin: 2rem 0;
        }

        /* Enhanced horizontal rules */
        .blog-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          margin: 3rem 0;
        }

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
          transition: border-color 0.3s;
        }
        [data-blog-faq="accordion"] details:hover {
          border-color: rgba(255, 92, 58, 0.3);
        }
        [data-blog-faq="accordion"] details[open] {
          border-color: rgba(255, 92, 58, 0.4);
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
          transition: color 0.2s;
        }
        [data-blog-faq="accordion"] summary:hover {
          color: #FF5C3A;
        }
        [data-blog-faq="accordion"] summary::-webkit-details-marker { display: none; }
        [data-blog-faq="accordion"] summary::after {
          content: '+';
          font-size: 20px;
          font-weight: 300;
          color: #FF5C3A;
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


        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .blog-content > p:first-of-type::first-letter {
            font-size: 3rem;
          }
          .blog-content ul li {
            padding-left: 1.5rem;
          }
          .blog-content ol li {
            padding-left: 2rem;
          }
        }
      `}</style>

      <div className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-8 md:p-12 mb-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <ArticleContent html={content} />
        
        {/* Inline CTA after main content */}
        <InlineCTA type="minimal" />
        
        <ArticleFooter 
          tags={tags} 
          publishedAt={publishedAt}
          readingTime={readingTime}
        />
      </div>
      
      {/* Newsletter CTA */}
      <NewsletterCTA />
      
      {/* Final CTA */}
      <FinalCTA />
    </>
  );
}
