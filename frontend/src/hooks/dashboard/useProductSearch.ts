'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Product } from '@/types';

const DEBOUNCE_DELAY = 300;

/**
 * Manages product search/filter state with debounced search term.
 * @param products - Full product list to filter from
 * @returns Search state and handlers
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

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery.trim()) return products;

    const query = debouncedQuery.toLowerCase().trim();
    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(query);
      const descMatch = product.description?.toLowerCase().includes(query);
      const shortDescMatch = product.shortDescription?.toLowerCase().includes(query);
      const categoryMatch = product.category?.toLowerCase().includes(query);
      return nameMatch || descMatch || shortDescMatch || categoryMatch;
    });
  }, [products, debouncedQuery]);

  return {
    searchQuery,
    debouncedQuery,
    filteredProducts,
    handleSearchChange,
    clearSearch,
    hasActiveSearch: debouncedQuery.trim().length > 0,
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