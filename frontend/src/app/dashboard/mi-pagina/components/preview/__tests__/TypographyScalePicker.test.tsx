import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypographyScalePicker } from '../TypographyScalePicker';

describe('TypographyScalePicker', () => {
  const defaultProps = {
    value: 'font-jakarta',
    onChange: () => {},
  };

  describe('renders correct font class for each font option', () => {
    const fontCases = [
      { id: 'font-jakarta', name: 'Jakarta' },
      { id: 'font-playfair', name: 'Playfair' },
      { id: 'font-tech', name: 'Tech' },
      { id: 'font-dm-sans', name: 'DM Sans' },
    ] as const;

    fontCases.forEach(font => {
      it(`${font.id} renders with correct font class and name`, () => {
        render(<TypographyScalePicker {...defaultProps} value={font.id} />);

        const buttons = screen.getAllByRole('button');
        const button = buttons.find(b => b.textContent?.includes(font.name));
        expect(button).toBeDefined();

        // Check font class is applied to the "Aa" preview text
        const aaPreview = button?.querySelector('[class*="font-jakarta"], [class*="font-playfair"], [class*="font-tech"], [class*="font-dm-sans"]');
        expect(aaPreview).not.toBeNull();
        expect(aaPreview?.className).toContain(font.id);
      });
    });
  });

  describe('selected state', () => {
    it('marks selected font button as active', () => {
      render(<TypographyScalePicker {...defaultProps} value="font-playfair" />);

      const buttons = screen.getAllByRole('button');
      const playfairBtn = buttons.find(b => b.textContent?.includes('Playfair'));

      // Selected button should have border-[#FF5C3A]
      expect(playfairBtn?.className).toContain('border-[#FF5C3A]');
    });

    it('unselected font does not have accent border (not in selected classes)', () => {
      render(<TypographyScalePicker {...defaultProps} value="font-jakarta" />);

      const buttons = screen.getAllByRole('button');
      const playfairBtn = buttons.find(b => b.textContent?.includes('Playfair'));

      // Unselected should NOT have the exact selected border class
      // (it has hover:border-[#FF5C3A]/30 but not the selected border)
      const hasSelectedBorder = playfairBtn?.className.includes('border-[#FF5C3A] bg-[#FF5C3A]/5');
      expect(hasSelectedBorder).toBe(false);
    });
  });

  describe('onChange behavior', () => {
    it('calls onChange with correct font id when button clicked', () => {
      const onChange = vi.fn();
      render(<TypographyScalePicker {...defaultProps} onChange={onChange} />);

      const buttons = screen.getAllByRole('button');
      const playfairBtn = buttons.find(b => b.textContent?.includes('Playfair'));

      playfairBtn?.click();

      expect(onChange).toHaveBeenCalledWith('font-playfair');
    });

    it('calls onChange with correct font id for DM Sans', () => {
      const onChange = vi.fn();
      render(<TypographyScalePicker {...defaultProps} onChange={onChange} />);

      const buttons = screen.getAllByRole('button');
      const dmSansBtn = buttons.find(b => b.textContent?.includes('DM Sans'));

      dmSansBtn?.click();

      expect(onChange).toHaveBeenCalledWith('font-dm-sans');
    });
  });

  describe('label prop', () => {
    it('renders label when provided', () => {
      render(<TypographyScalePicker {...defaultProps} label="Tipografía" />);

      expect(document.body.textContent).toContain('Tipografía');
    });

    it('does not render label when not provided', () => {
      render(<TypographyScalePicker {...defaultProps} />);

      // Only font names should be visible, no extra label
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('renders all 4 font options', () => {
    it('renders exactly 4 buttons', () => {
      render(<TypographyScalePicker {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('renders Jakarta, Playfair, Tech, DM Sans', () => {
      render(<TypographyScalePicker {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const texts = buttons.map(b => b.textContent);

      expect(texts.some(t => t?.includes('Jakarta'))).toBe(true);
      expect(texts.some(t => t?.includes('Playfair'))).toBe(true);
      expect(texts.some(t => t?.includes('Tech'))).toBe(true);
      expect(texts.some(t => t?.includes('DM Sans'))).toBe(true);
    });

    it('each button contains "Aa" preview text', () => {
      render(<TypographyScalePicker {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn.textContent).toContain('Aa');
      });
    });
  });
});