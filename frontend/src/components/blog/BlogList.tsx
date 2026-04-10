'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogCard } from './BlogCard';
import { fetchBlogCategories, fetchBlogPosts, BlogCategory, BlogPost, BlogPagination } from '@/services/blog.service';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const POSTS_PER_PAGE = 5;

export const BlogList: React.FC = () => {
  const { isDark, colors } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<BlogPagination | null>(null);

  useEffect(() => {
    async function loadData() {
      const cats = await fetchBlogCategories();
      setCategories(cats);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const result = await fetchBlogPosts(selectedCategory || undefined, currentPage, POSTS_PER_PAGE);
      setPosts(result.posts);
      setPagination(result.pagination);
      setLoading(false);
    }
    loadPosts();
  }, [selectedCategory, currentPage]);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(search.toLowerCase()) || 
    post.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute category counts from all loaded posts
  const categoryCounts = (() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      if (post.category_id) {
        counts[post.category_id] = (counts[post.category_id] || 0) + 1;
      }
    }
    return counts;
  })();

  const visibleCategories = (() => {
    const merged = new Map<string, BlogCategory & { count: number }>();
    
    for (const cat of categories) {
      if (cat?.id) merged.set(cat.id, { ...cat, count: categoryCounts[cat.id] || 0 });
    }

    for (const post of posts) {
      if (post.category_id && post.category?.name && !merged.has(post.category_id)) {
        merged.set(post.category_id, {
          id: post.category_id,
          name: post.category.name,
          slug: post.category.slug || post.category.name.toLowerCase().replace(/\s+/g, '-'),
          count: 1,
        });
      }
    }

    return Array.from(merged.values());
  })();

  const totalCount = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  // Get visible page numbers
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Separate featured post (first) from grid posts
  const [featuredPost, ...gridPosts] = filteredPosts;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="w-full md:flex-1">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF5C3A] mb-3 text-center md:text-left">
            Explora por categoría
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 justify-start scrollbar-hide">
            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
              className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  selectedCategory === null
                    ? 'bg-[#FF5C3A] text-white border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/20'
                    : `${isDark ? 'bg-[#141414] text-zinc-400 border-white/5 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'} hover:text-[#FF5C3A]`
                }`}
            >
              Todos {totalCount > 0 && <span className="ml-1.5 opacity-70">({totalCount})</span>}
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF5C3A] text-white border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/20'
                    : `${isDark ? 'bg-[#141414] text-zinc-400 border-white/5 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'} hover:text-[#FF5C3A]`
                }`}
              >
                {cat.name} <span className="ml-1.5 opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full border rounded-full pl-11 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:border-[#FF5C3A]/50 ${
              isDark 
                ? 'bg-[#141414] border-white/5 text-white placeholder-zinc-600' 
                : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm'
            }`}
          />
        </div>
      </div>

      {/* Grid de posts con Featured + Paginación */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#FF5C3A]" size={40} />
          <p className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'} animate-pulse`}>Cargando artículos premium...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <>
          {/* Featured post + grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-auto">
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2"
              >
                <BlogCard post={featuredPost} variant="featured" />
              </motion.div>
            )}
            
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  layout
                >
                  <BlogCard post={post} variant="default" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="font-medium">Página {currentPage} de {totalPages}</span>
                <span className="opacity-20">·</span>
                <span>{totalCount} artículos</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination?.hasPrevPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white hover:border-white/30' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                          page === currentPage
                            ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20'
                            : isDark 
                              ? 'bg-[#141414] text-zinc-400 border border-white/10 hover:text-white hover:bg-zinc-800' 
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className={`w-10 text-center ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>…</span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination?.hasNextPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white hover:border-white/30' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#999] mb-4">No se encontraron artículos con estos criterios.</p>
          <button 
            onClick={() => {
              setSearch('');
              setSelectedCategory(null);
              setCurrentPage(1);
            }}
            className="text-[#FF5C3A] hover:underline"
          >
            Ver todos los artículos
          </button>
        </div>
      )}
    </div>
  );
};