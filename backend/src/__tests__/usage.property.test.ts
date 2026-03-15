// Feature: virtual-tryon-saas, Property 1: Límite de productos por plan
import * as fc from 'fast-check';
import { supabase } from '../config/supabase';
import { PLANS } from '../config/plans';
import { ProductsService } from '../services/products.service';
import { randomUUID } from 'crypto';

/**
 * Property 1: Límite de productos por plan
 * 
 * Para cualquier marca con plan BASIC, el número de productos activos debe ser 
 * menor o igual a 5; para plan PRO, menor o igual a 15.
 * 
 * Validates: Requirements 2.1, 2.2, 3.2
 */

describe('Property-Based Tests: Plan Limits', () => {
  const productsService = new ProductsService();

  // Helper function to create a test brand
  const createTestBrand = async (plan: 'BASIC' | 'PRO') => {
    const brandId = randomUUID();
    const email = `test-${brandId}@example.com`;
    const slug = `test-brand-${brandId.substring(0, 8)}`;

    const { data, error } = await supabase
      .from('brands')
      .insert({
        id: brandId,
        email,
        password: 'hashed_password',
        name: `Test Brand ${brandId}`,
        slug,
        plan,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Helper function to create products for a brand using the service
  const createProductsViaService = async (brandId: string, count: number) => {
    const products = [];
    for (let i = 0; i < count; i++) {
      try {
        const product = await productsService.createProduct(brandId, {
          name: `Product ${i + 1}`,
          description: `Test product ${i + 1}`,
          image_url: `https://example.com/product-${i + 1}.jpg`,
          category: 'tshirt',
        });
        products.push(product);
      } catch (error) {
        // If we hit the limit, stop trying to create more
        break;
      }
    }
    return products;
  };

  // Helper function to cleanup test data
  const cleanupBrand = async (brandId: string) => {
    // Delete products first (due to foreign key)
    await supabase.from('products').delete().eq('brand_id', brandId);
    // Delete brand
    await supabase.from('brands').delete().eq('id', brandId);
  };

  describe('Property 1: Product limit enforcement by plan', () => {
    it('should enforce BASIC plan product limit (max 5 products)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }), // Test with 0-10 product attempts
          async (productCount) => {
            const brand = await createTestBrand('BASIC');
            const planLimit = PLANS.BASIC.maxProducts;

            try {
              // Try to create products using the service (which enforces limits)
              const createdProducts = await createProductsViaService(brand.id, productCount);

              // Count active products
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('brand_id', brand.id)
                .eq('is_active', true);

              // Property: Active products should NEVER exceed plan limit
              expect(count).toBeLessThanOrEqual(planLimit);
              
              // The service should have created at most planLimit products
              expect(createdProducts.length).toBeLessThanOrEqual(planLimit);

              // If we requested more than the limit, verify we only got the limit
              if (productCount > planLimit) {
                expect(count).toBe(planLimit);
              }
            } finally {
              await cleanupBrand(brand.id);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified
      );
    }, 60000); // 60 second timeout for property test

    it('should enforce PRO plan product limit (max 15 products)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 20 }), // Test with 0-20 product attempts
          async (productCount) => {
            const brand = await createTestBrand('PRO');
            const planLimit = PLANS.PRO.maxProducts;

            try {
              // Try to create products using the service (which enforces limits)
              const createdProducts = await createProductsViaService(brand.id, productCount);

              // Count active products
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('brand_id', brand.id)
                .eq('is_active', true);

              // Property: Active products should NEVER exceed plan limit
              expect(count).toBeLessThanOrEqual(planLimit);
              
              // The service should have created at most planLimit products
              expect(createdProducts.length).toBeLessThanOrEqual(planLimit);

              // If we requested more than the limit, verify we only got the limit
              if (productCount > planLimit) {
                expect(count).toBe(planLimit);
              }
            } finally {
              await cleanupBrand(brand.id);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified
      );
    }, 60000); // 60 second timeout for property test

    it('should maintain product limit invariant across different plan types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('BASIC', 'PRO'), // Test both plan types
          fc.integer({ min: 0, max: 20 }), // Test with various product counts
          async (planType: 'BASIC' | 'PRO', productCount) => {
            const brand = await createTestBrand(planType);
            const planLimit = PLANS[planType].maxProducts;

            try {
              // Try to create products using the service (which enforces limits)
              const createdProducts = await createProductsViaService(brand.id, productCount);

              // Count active products
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('brand_id', brand.id)
                .eq('is_active', true);

              // Universal property: For ANY plan type, active products <= plan limit
              expect(count).toBeLessThanOrEqual(planLimit);
              
              // The service should have created at most planLimit products
              expect(createdProducts.length).toBeLessThanOrEqual(planLimit);

              // Verify the correct limit is being applied for the plan type
              if (planType === 'BASIC') {
                expect(planLimit).toBe(5);
              } else {
                expect(planLimit).toBe(15);
              }

              // If we requested more than the limit, verify we only got the limit
              if (productCount > planLimit) {
                expect(count).toBe(planLimit);
              }
            } finally {
              await cleanupBrand(brand.id);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified
      );
    }, 60000); // 60 second timeout for property test
  });
});
