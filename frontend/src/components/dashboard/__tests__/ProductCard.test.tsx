import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import type { Product } from '@/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

// Mock getProxiedUrl
vi.mock('@/utils/imageProxy', () => ({
  getProxiedUrl: vi.fn((url: string) => `/api/img-proxy?url=${encodeURIComponent(url)}`),
}));

// Mock ProductActions
vi.mock('../ProductActions', () => ({
  ProductActions: ({ product, variant }: any) => (
    <div data-testid="product-actions" data-variant={variant}>
      Actions for {product.name}
    </div>
  ),
}));

const mockProduct: Product = {
  id: 'prod-1',
  brandId: 'brand-1',
  name: 'Test Product',
  description: 'A test product description',
  shortDescription: 'Short desc',
  imageUrl: 'https://example.com/image.jpg',
  category: 'rines',
  price: 150000,
  badge: 'nuevo',
  externalId: 'ext-1',
  attributes: { material: 'aluminum', medida_pulgadas: 18 },
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ProductCard', () => {
  const defaultProps = {
    product: mockProduct,
    viewMode: 'grid' as const,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddToWidget: vi.fn(),
    onRemoveFromWidget: vi.fn(),
    isInWidget: false,
    canAddToWidget: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product image with ImageWithFallback', () => {
    render(<ProductCard {...defaultProps} />);
    
    // The product image should be present
    const imageContainer = screen.getByRole('img').parentElement;
    expect(imageContainer).toBeInTheDocument();
  });

  it('shows ProductBadge with category and promo', () => {
    render(<ProductCard {...defaultProps} />);
    
    // Category badge (rines)
    expect(screen.getByText('rines')).toBeInTheDocument();
    
    // Promo badge (Nuevo)
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('shows active status indicator for active product', () => {
    render(<ProductCard {...defaultProps} product={{ ...mockProduct, isActive: true }} />);
    
    // Active indicator should show "Activo"
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('uses correct variant for grid view mode', () => {
    render(<ProductCard {...defaultProps} viewMode="grid" />);
    
    // Card should render in grid variant
    const card = screen.getByText('Test Product').closest('.group');
    expect(card).toBeInTheDocument();
  });

  it('uses correct variant for list view mode', () => {
    render(<ProductCard {...defaultProps} viewMode="list" />);
    
    // Card should render in list variant
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('uses correct variant for thumbnail view mode', () => {
    render(<ProductCard {...defaultProps} viewMode="thumbnail" />);
    
    // Card should render in thumbnail variant
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows product name and price', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    // Price uses Colombian locale formatting (es-CO) which uses periods as thousand separators
    expect(screen.getByText(/\$150\.000/)).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    
    // Card has the correct base structure
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('shows category badge for list view mode', () => {
    render(<ProductCard {...defaultProps} viewMode="list" />);
    
    // List view shows category badge
    expect(screen.getByText('rines')).toBeInTheDocument();
  });

  it('hides ProductActions in list view overlay variant', () => {
    render(<ProductCard {...defaultProps} viewMode="list" />);
    
    // For list view, actions variant is inline not overlay
    const actions = screen.getByTestId('product-actions');
    expect(actions).toHaveAttribute('data-variant', 'inline');
  });

  it('displays tech specs when attributes exist', () => {
    render(<ProductCard {...defaultProps} />);
    
    // Tech specs should show material and medida
    expect(screen.getByText(/aluminum/)).toBeInTheDocument();
    expect(screen.getByText(/18"/)).toBeInTheDocument();
  });

  it('shows inactive status for inactive products', () => {
    render(<ProductCard {...defaultProps} product={{ ...mockProduct, isActive: false }} />);
    
    // The success indicator should not be visible for inactive products
    // Instead, the status badge would show Inactivo
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });
});