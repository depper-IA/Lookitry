'use client';

import React, { useState, useEffect } from 'react';
import { BlogCard } from './BlogCard';
import { fetchBlogCategories, fetchBlogPosts, BlogCategory, BlogPost } from '@/services/blog.service';
import { Search, Loader2 } from 'lucide-react';

export const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      const data = await fetchBlogPosts(selectedCategory || undefined);
      setPosts(data);
      setLoading(false);
    }
    loadPosts();
  }, [selectedCategory]);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(search.toLowerCase()) || 
    post.excerpt?.toLowerCase().includes(search.toLowerCase())
  );
  const visibleCategories = (() => {
    const merged = new Map<string, BlogCategory>();

    for (const cat of categories) {
      if (cat?.id) merged.set(cat.id, cat);
    }

    for (const post of posts) {
      if (post.category_id && post.category?.name && !merged.has(post.category_id)) {
        merged.set(post.category_id, {
          id: post.category_id,
          name: post.category.name,
          slug: post.category.slug || post.category.name.toLowerCase().replace(/\s+/g, '-'),
        });
      }
    }

    return Array.from(merged.values());
  })();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="w-full md:flex-1">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF5C3A] mb-3 text-center md:text-left">
            Explora por categoría
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 justify-start">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${
                selectedCategory === null
                  ? 'bg-[#FF5C3A] text-white border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/20'
                  : 'bg-[#141414] text-[#b8b8b8] hover:bg-[#1a1a1a] hover:text-white border-white/10'
              }`}
            >
              Todos
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF5C3A] text-white border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/20'
                    : 'bg-[#141414] text-[#b8b8b8] hover:bg-[#1a1a1a] hover:text-white border-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-white/5 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5C3A]/50 transition-all"
          />
        </div>
      </div>

      {/* Grid de posts */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#FF5C3A]" size={40} />
          <p className="text-[#999] animate-pulse">Cargando artículos premium...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#999] mb-4">No se encontraron artículos con estos criterios.</p>
          <button 
            onClick={() => {
              setSearch('');
              setSelectedCategory(null);
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
