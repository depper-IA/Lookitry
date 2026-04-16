'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Filter } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allCategories = ['Todas', ...categories];
  const hasFilter = selectedCategory !== 'Todas';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
          hasFilter
            ? 'bg-[#FF5C3A]/10 border-[#FF5C3A]/30 text-[#FF5C3A]'
            : 'bg-[var(--btn-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Filter size={14} />
        {hasFilter ? selectedCategory : 'Categoría'}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Active filter badge */}
      {hasFilter && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5C3A] text-white text-[8px] font-black flex items-center justify-center">
          !
        </span>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
          style={{
            background: 'var(--card-bg-elevated)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {allCategories.map((category) => {
              const isSelected = category === selectedCategory;
              return (
                <button
                  key={category}
                  onClick={() => {
                    onSelectCategory(category);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#FF5C3A]/10 text-[#FF5C3A]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--btn-bg)]'
                  }`}
                >
                  <span className="text-xs font-semibold capitalize">{category}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}