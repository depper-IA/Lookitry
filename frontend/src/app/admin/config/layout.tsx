'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const configNav = [
  { href: '/admin/config/trial', label: 'Trial' },
  { href: '/admin/config/contact', label: 'Contacto y precios' },
  { href: '/admin/config/launch', label: '🚀 Launch' },
  { href: '/admin/config/health', label: 'Salud del sistema' },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentHref = configNav.find(n => pathname.startsWith(n.href))?.href;
  const currentLabel = configNav.find(n => pathname.startsWith(n.href))?.label || 'Trial';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-6">
      {/* Breadcrumb + título */}
      <div className="flex items-center gap-3">
        <Link href="/admin/config/trial" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>Configuración</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{currentLabel}</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}>
        {configNav.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
            style={{
              background: currentHref === tab.href ? '#FF5C3A' : 'transparent',
              color: currentHref === tab.href ? 'white' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}