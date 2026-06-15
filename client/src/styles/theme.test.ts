import { describe, it, expect } from 'vitest';
import { theme, colors } from './theme';

describe('Theme tokens', () => {
  it('should export primary color palette', () => {
    expect(theme.colors.primary).toBeDefined();
    expect(theme.colors.primary[900]).toBe('#0D0D0D');
    expect(theme.colors.primary[800]).toBe('#1A1A1A');
  });

  it('should export gold accent palette', () => {
    expect(theme.colors.gold).toBeDefined();
    expect(theme.colors.gold[400]).toBe('#D4B230');
    expect(theme.colors.gold[500]).toBe('#C5A028');
  });

  it('should export font families', () => {
    expect(theme.fontFamily.sans[0]).toBe('Inter');
    expect(theme.fontFamily.mono[0]).toBe('JetBrains Mono');
  });

  it('should export colors as a separate named export', () => {
    expect(colors).toBe(theme.colors);
  });
});
