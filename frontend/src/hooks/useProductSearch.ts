import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

const PRODUCTS_PER_PAGE = 6;

// Sort options available for products
export type SortOption = 'name_asc' | 'name_desc' | 'created_desc';

export interface UseProductSearchOptions {
  products: Product[];
  searchQuery?: string;
  categoryFilter?: string;
}

/**
 * Manages search, filter, pagination, and sort logic for the products dashboard.
 * @param products - Full product list
 * @param searchQuery - Current search query (external, from page state)
 * @param categoryFilter - Current category filter
 * @returns Filtered, sorted, and paginated products along with pagination metadata
 */
export function useProductSearch({
  products,
  searchQuery = '',
  categoryFilter = 'Todas',
}: UseProductSearchOptions) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Sort state: default alphabetically A-Z
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

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

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Navigation callbacks
  const goToPage = useCallback((page: number) => {
    setCurrentPage((p) => Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  return {
    filteredProducts,
    paginatedProducts,
    currentPage,
    totalPages,
    totalProducts: filteredProducts.length,
    productsPerPage: PRODUCTS_PER_PAGE,
    sortBy,
    setSortBy,
    goToPage,
    nextPage,
    prevPage,
  };
}