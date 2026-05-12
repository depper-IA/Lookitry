'use client';

import { BlogPost } from '@/services/blog.service';
import { BarChart3 } from 'lucide-react';

interface BlogMetricsCardProps {
  posts: BlogPost[];
}

export default function BlogMetricsCard({ posts }: BlogMetricsCardProps) {
  const autoPosts = posts.filter(p => !p.content.includes('manual')).length;

  return (
    <div className="lg:col-span-4 rounded-[2.5rem] border p-8 flex flex-col justify-between shadow-lg relative overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="font-jakarta font-black uppercase tracking-tighter text-lg mb-6 flex items-center gap-3 text-[var(--text-primary)]">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Métricas IA
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all group">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40 mb-1 group-hover:text-indigo-500 transition-colors text-[var(--text-primary)] italic">Autónomos</div>
            <div className="text-3xl font-black text-[var(--text-primary)]">{autoPosts}</div>
          </div>
          <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40 mb-1 group-hover:text-[var(--accent)] transition-colors text-[var(--text-primary)] italic">Total Índice</div>
            <div className="text-3xl font-black text-[var(--accent)]">{posts.length}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-5 rounded-3xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 relative z-10">
        <p className="text-[10px] leading-relaxed font-bold italic opacity-50 text-[var(--text-primary)]">
          &quot;El motor Lookitry optimiza cada palabra para máximo engagement y autoridad digital.&quot;
        </p>
      </div>
    </div>
  );
}