// Feature: ui-ux-redesign, Property 4: cursor-pointer en Button
// Validates: Requirements 1.8, 7.1, 7.8
// Para cualquier variante del Button, el elemento <button> renderizado tiene cursor-pointer en su className

import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '@/components/ui/Button';

describe('Property 4: cursor-pointer en Button', () => {
  it('el elemento <button> tiene cursor-pointer en su className para cualquier variante', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'danger', 'ghost' as const),
        (variant) => {
          const { container } = render(
            <Button variant={variant as 'primary' | 'secondary' | 'danger' | 'ghost'}>
              Test
            </Button>
          );
          const button = container.querySelector('button');
          return button !== null && button.className.includes('cursor-pointer');
        }
      ),
      { numRuns: 100 }
    );
  });
});
