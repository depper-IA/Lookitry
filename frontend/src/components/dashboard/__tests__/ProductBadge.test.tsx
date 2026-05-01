import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductBadge, CategoryBadge, PromoBadge, StatusBadge } from '../ProductBadge';

describe('ProductBadge', () => {
  describe('CategoryBadge', () => {
    it('renders category badge with correct colors for rines', () => {
      render(<CategoryBadge category="rines" />);
      
      const badge = screen.getByText('rines');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1.5');
    });

    it('renders category badge for tshirt', () => {
      render(<CategoryBadge category="tshirt" />);
      
      const badge = screen.getByText('tshirt');
      expect(badge).toBeInTheDocument();
    });

    it('renders category badge for vestido', () => {
      render(<CategoryBadge category="vestido" />);
      
      const badge = screen.getByText('vestido');
      expect(badge).toBeInTheDocument();
    });

    it('renders default style for unknown category', () => {
      render(<CategoryBadge category="unknown" />);
      
      const badge = screen.getByText('unknown');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('PromoBadge', () => {
    it('renders promo badge for nuevo type', () => {
      render(<PromoBadge type="nuevo" />);
      
      const badge = screen.getByText('Nuevo');
      expect(badge).toBeInTheDocument();
    });

    it('renders promo badge for top type', () => {
      render(<PromoBadge type="top" />);
      
      const badge = screen.getByText('Top');
      expect(badge).toBeInTheDocument();
    });

    it('renders promo badge for oferta type', () => {
      render(<PromoBadge type="oferta" />);
      
      const badge = screen.getByText('Oferta');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('renders status badge for active status', () => {
      render(<StatusBadge status="active" />);
      
      const badge = screen.getByText('Activo');
      expect(badge).toBeInTheDocument();
    });

    it('renders status badge for inactive status', () => {
      render(<StatusBadge status="inactive" />);
      
      const badge = screen.getByText('Inactivo');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('ProductBadge (unified)', () => {
    it('renders category variant correctly', () => {
      render(<ProductBadge variant="category" category="rines" />);
      
      expect(screen.getByText('rines')).toBeInTheDocument();
    });

    it('renders promo variant correctly', () => {
      render(<ProductBadge variant="promo" type="nuevo" />);
      
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
    });

    it('renders status variant correctly', () => {
      render(<ProductBadge variant="status" status="active" />);
      
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('renders status variant for inactive correctly', () => {
      render(<ProductBadge variant="status" status="inactive" />);
      
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });
});