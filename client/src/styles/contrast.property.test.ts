import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { theme } from './theme';

/**
 * Feature: pyxis-course-materials, Property 20: Color contrast accessibility
 *
 * Validates: Requirements 10.5
 *
 * For any text/background color pair defined in the application's theme
 * configuration, the WCAG contrast ratio should be at least 4.5:1.
 */

/**
 * Convert a hex color string to RGB components.
 * Supports both shorthand (#RGB) and full (#RRGGBB) format.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }

  return { r, g, b };
}

/**
 * Calculate relative luminance per WCAG 2.1 formula.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors.
 * Returns a ratio of L1:L2 where L1 is the lighter color.
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function contrastRatio(
  color1: string,
  color2: string
): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Theme color pairs used in the Chocolate City black/gold theme.
 * Each pair represents a text color on a background color that must
 * meet WCAG AA (4.5:1) contrast requirements.
 */
export interface ColorPair {
  name: string;
  textColor: string;
  backgroundColor: string;
}

export const themeColorPairs: ColorPair[] = [
  {
    name: 'Gold text on dark background',
    textColor: theme.colors.gold[400],    // #D4B230 — lighter gold for better contrast
    backgroundColor: theme.colors.primary[800], // #1A1A1A
  },
  {
    name: 'White text on dark background',
    textColor: theme.colors.neutral[100], // #F5F5F5
    backgroundColor: theme.colors.primary[800], // #1A1A1A
  },
  {
    name: 'Light neutral text on dark background',
    textColor: theme.colors.neutral[200], // #E5E5E5
    backgroundColor: theme.colors.primary[800], // #1A1A1A
  },
  {
    name: 'Dark text on gold background',
    textColor: theme.colors.primary[900], // #0D0D0D
    backgroundColor: theme.colors.gold[400],    // #D4B230
  },
  {
    name: 'Error text on dark background',
    textColor: theme.colors.error,         // #EF4444
    backgroundColor: theme.colors.primary[800], // #1A1A1A
  },
  {
    name: 'Neutral/secondary text on dark background',
    textColor: theme.colors.neutral[300], // #D4D4D4
    backgroundColor: theme.colors.primary[800], // #1A1A1A
  },
];

describe('Property 20: Color contrast accessibility', () => {
  it('all theme color pairs meet WCAG 4.5:1 contrast ratio', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...themeColorPairs),
        (pair: ColorPair) => {
          const ratio = contrastRatio(pair.textColor, pair.backgroundColor);
          expect(
            ratio,
            `Color pair "${pair.name}" has contrast ratio ${ratio.toFixed(2)}:1 (text: ${pair.textColor}, bg: ${pair.backgroundColor}). WCAG AA requires ≥ 4.5:1`
          ).toBeGreaterThanOrEqual(4.5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hexToRgb correctly parses full hex colors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          const result = hexToRgb(hex);
          expect(result).toEqual({ r, g, b });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contrast ratio is always >= 1', () => {
    const hexColorArb = fc
      .integer({ min: 0, max: 0xffffff })
      .map((n) => `#${n.toString(16).padStart(6, '0')}`);

    fc.assert(
      fc.property(hexColorArb, hexColorArb, (color1, color2) => {
        const ratio = contrastRatio(color1, color2);
        expect(ratio).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('contrast ratio is symmetric', () => {
    const hexColorArb = fc
      .integer({ min: 0, max: 0xffffff })
      .map((n) => `#${n.toString(16).padStart(6, '0')}`);

    fc.assert(
      fc.property(hexColorArb, hexColorArb, (color1, color2) => {
        const ratio1 = contrastRatio(color1, color2);
        const ratio2 = contrastRatio(color2, color1);
        expect(ratio1).toBeCloseTo(ratio2, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('same color always has contrast ratio of 1', () => {
    const hexColorArb = fc
      .integer({ min: 0, max: 0xffffff })
      .map((n) => `#${n.toString(16).padStart(6, '0')}`);

    fc.assert(
      fc.property(hexColorArb, (color) => {
        const ratio = contrastRatio(color, color);
        expect(ratio).toBeCloseTo(1, 10);
      }),
      { numRuns: 100 }
    );
  });
});
