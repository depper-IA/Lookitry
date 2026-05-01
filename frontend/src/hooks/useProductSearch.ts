import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

// Sort options available for products
export type SortOption = 'name_asc' | 'name_desc' | 'created_desc';

export interface UseProductSearchOptions {
  products: Product[];
  searchQuery?: string;
  categoryFilter?: string;
}

/**
 * Manages search, filter, and sort logic for the products dashboard.
 * @param products - Full product list
 * @param searchQuery - Current search query (external, from page state)
 * @param categoryFilter - Current category filter
 * @returns Filtered and sorted products
 */
export function useProductSearch({
  products,
  searchQuery = '',
  categoryFilter = 'Todas',
}: UseProductSearchOptions) {
  // Sort state: default alphabetically A-Z
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Filtered and sorted products based on category, search, and sort preference
  const filteredProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (categoryFilter !== 'Todas') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Search filter (searches name, description, shortDescription)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        const shortDescMatch = p.shortDescription?.toLowerCase().includes(query);
        return nameMatch || descMatch || shortDescMatch;
      });
    }

    // Apply sorting before returning
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'created_desc':
          // Sort by creation date, newest first; fallback to name if undefined
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateB === dateA) {
            return (a.name || '').localeCompare(b.name || '');
          }
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return sorted;
  }, [products, categoryFilter, searchQuery, sortBy]);

  return {
    filteredProducts,
    paginatedProducts: filteredProducts, // To avoid breaking consumers, return everything as paginatedProducts
    totalProducts: filteredProducts.length,
    sortBy,
    setSortBy,
  };
}