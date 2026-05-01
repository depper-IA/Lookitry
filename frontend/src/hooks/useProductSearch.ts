import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

const PRODUCTS_PER_PAGE = 6;

export interface UseProductSearchOptions {
  products: Product[];
  searchQuery?: string;
  categoryFilter?: string;
}

/**
 * Manages search, filter, and pagination logic for the products dashboard.
 * @param products - Full product list
 * @param searchQuery - Current search query (external, from page state)
 * @param categoryFilter - Current category filter
 * @returns Filtered and paginated products along with pagination metadata
 */
export function useProductSearch({
  products,
  searchQuery = '',
  categoryFilter = 'Todas',
}: UseProductSearchOptions) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Filtered products based on category and search
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

    return result;
  }, [products, categoryFilter, searchQuery]);

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
    goToPage,
    nextPage,
    prevPage,
  };
}