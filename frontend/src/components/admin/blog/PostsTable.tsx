'use client';

import { BlogPost } from '@/services/blog.service';
import { getBlogFeaturedImage } from '@/services/blog.service';
import Link from 'next/link';
import {
  ExternalLink,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Animation Variants ─────────────────────────────────────────────────────────

const tableRowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3 }
  }),
  hover: { backgroundColor: "rgba(255,255,255,0.02)" }
};

const actionBtnVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.9 }
};

const pageBtnVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

interface PostsTableProps {
  posts: BlogPost[];
  sortKey: 'title' | 'category' | 'status' | 'created_at';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  onToggleSort: (key: 'title' | 'category' | 'status' | 'created_at') => void;
  onPageChange: (page: number) => void;
  onRequestDelete: (id: string) => void;
}

export default function PostsTable({
  posts,
  sortKey,
  sortDirection,
  currentPage,
  totalPages,
  onToggleSort,
  onPageChange,
  onRequestDelete,
}: PostsTableProps) {
  const postsPerPage = 6;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPosts = posts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage);

  return (
    <div className="rounded-[2.5rem] border shadow-2xl overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b bg-[var(--bg-base)] border-[var(--border-color)]">
              {(['title', 'category', 'status', 'created_at'] as const).map((key) => (
                <th key={key} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--text-primary)]">
                  <button
                    onClick={() => onToggleSort(key)}
                    className={`inline-flex items-center gap-2 hover:text-[var(--accent)] transition-colors ${sortKey === key ? 'text-[var(--accent)] opacity-100' : ''}`}
                  >
                    {key === 'title' ? 'Artículo' : key === 'category' ? 'Categoría' : key === 'status' ? 'Visibilidad' : 'Fecha'}
                    <span className="text-[8px] font-black">{sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              ))}
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right text-[var(--text-primary)]">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y border-[var(--border-color)]">
            {paginatedPosts.map((post, i) => (
              <motion.tr
                key={post.id}
                custom={i}
                variants={tableRowVariants}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true }}
                className="group hover:bg-black/5 dark:hover:bg-white/[0.02] transition-all"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-black/10 dark:bg-white/5 flex-shrink-0">
                      <img
                        src={getBlogFeaturedImage(post) || '/placeholder-img.jpg'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="block font-black text-sm tracking-tight hover:text-[var(--accent)] transition-colors truncate max-w-[200px] sm:max-w-md text-[var(--text-primary)]"
                      >
                        {post.title}
                      </Link>
                      <span className="text-[10px] font-bold opacity-40 block mt-1 uppercase tracking-tight text-[var(--text-primary)]">/blog/{post.slug}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-primary)]">
                    {post.category?.name || 'IA & Moda'}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                    {post.status === 'published' ? 'Publicado' : 'Borrador'}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[11px] font-bold opacity-60 text-[var(--text-primary)]">
                    {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.a
                      variants={actionBtnVariants}
                      whileHover="hover"
                      whileTap="tap"
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all border border-transparent dark:hover:border-[var(--accent)]/20 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                    <motion.link
                      variants={actionBtnVariants}
                      whileHover="hover"
                      whileTap="tap"
                      href={`/admin/blog/${post.id}`}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all border border-transparent dark:hover:border-indigo-500/20 shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.link>
                    <motion.button
                      variants={actionBtnVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => onRequestDelete(post.id)}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent dark:hover:border-red-500/20 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {posts.length > 0 && (
          <div className="px-8 py-6 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--text-primary)]">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                variants={pageBtnVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <motion.button
                    key={page}
                    variants={pageBtnVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onPageChange(page)}
                    animate={page === safeCurrentPage ? {
                      backgroundColor: "var(--accent)",
                      color: "white",
                      boxShadow: "0 4px 14px 0 rgba(255,92,58,0.39)"
                    } : {}}
                    className="w-9 h-9 rounded-xl text-[10px] font-black transition-all"
                  >
                    {page}
                  </motion.button>
                ))}
              </div>
              <motion.button
                variants={pageBtnVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}