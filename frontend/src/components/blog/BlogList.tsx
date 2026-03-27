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

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null 
                ? 'bg-[#FF5C3A] text-white' 
                : 'bg-[#141414] text-[#999] hover:bg-[#1a1a1a] hover:text-white border border-white/5'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-[#FF5C3A] text-white' 
                  : 'bg-[#141414] text-[#999] hover:bg-[#1a1a1a] hover:text-white border border-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
