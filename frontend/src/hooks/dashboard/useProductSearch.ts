'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Product } from '@/types';

const DEBOUNCE_DELAY = 300;
const PRODUCTS_PER_PAGE = 6;

export type SortOption = 'name_asc' | 'name_desc' | 'created_desc';

/**
 * Manages product search/filter/pagination/sort state for the products dashboard.
 * @param products - Full product list to filter and paginate
 * @returns Search, filter, pagination, and sort state with handlers
 */
export function useProductSearch(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced search term update
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when products change (e.g., after create/delete)
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  // Filter + sort products based on search and sort preference
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
      result = result.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const descMatch = product.description?.toLowerCase().includes(query);
        const shortDescMatch = product.shortDescription?.toLowerCase().includes(query);
        const categoryMatch = product.category?.toLowerCase().includes(query);
        return nameMatch || descMatch || shortDescMatch || categoryMatch;
      });
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return (a.name || '').localeCompare(b.name || '');
        case 'name_desc': return (b.name || '').localeCompare(a.name || '');
        case 'created_desc':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        default: return 0;
      }
    });
    return sorted;
  }, [products, debouncedQuery, sortBy]);

  // Paginated products
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Navigation
  const goToPage = useCallback((page: number) => {
    setCurrentPage((p) => Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return {
    searchQuery,
    debouncedQuery,
    filteredProducts,
    paginatedProducts,
    currentPage,
    totalPages,
    sortBy,
    setSortBy,
    handleSearchChange,
    clearSearch,
    hasActiveSearch: debouncedQuery.trim().length > 0,
    goToPage,
  };
}

/**
 * Manages category filter state with "Todas" option.
 * @param categories - Available categories from products
 * @returns Category filter state and handlers
 */
export function useCategoryFilter(categories: string[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const clearFilter = useCallback(() => {
    setSelectedCategory('Todas');
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    clearFilter,
    isFiltered: selectedCategory !== 'Todas',
  };
}