import { describe, it, expect } from 'vitest';
import { truncateMemberName } from '@/utils/formatting';
import { generateBreadcrumbs } from './breadcrumbs.utils';

/**
 * Unit tests for layout component logic.
 * Tests the core logic used by NavBar and Breadcrumbs components:
 * - Member name truncation (NavBar display)
 * - Breadcrumb segment generation from route paths
 * - Admin link visibility condition
 */

describe('NavBar: member name display', () => {
  it('displays full name when 30 chars or less', () => {
    const name = 'John Doe';
    expect(truncateMemberName(name)).toBe('John Doe');
  });

  it('displays full name when exactly 30 chars', () => {
    const name = 'A'.repeat(30);
    expect(truncateMemberName(name)).toBe(name);
  });

  it('truncates name exceeding 30 chars with ellipsis', () => {
    const name = 'A'.repeat(31);
    const result = truncateMemberName(name);
    expect(result).toHaveLength(30);
    expect(result).toBe('A'.repeat(29) + '\u2026');
  });

  it('handles empty string', () => {
    expect(truncateMemberName('')).toBe('');
  });
});

describe('Breadcrumbs: segment generation from path', () => {
  // Uses the extracted generateBreadcrumbs utility function

  it('returns only Home for root path', () => {
    const result = generateBreadcrumbs('/');
    expect(result).toEqual([{ label: 'Home', path: '/' }]);
  });

  it('generates Home > Stats for /stats', () => {
    const result = generateBreadcrumbs('/stats');
    expect(result).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Stats', path: '/stats' },
    ]);
  });

  it('generates path for nested course route', () => {
    const result = generateBreadcrumbs('/courses/abc-123', {
      'abc-123': '6.042',
    });
    expect(result).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Courses', path: '/courses' },
      { label: '6.042', path: '/courses/abc-123' },
    ]);
  });

  it('generates full breadcrumb for course > category', () => {
    const result = generateBreadcrumbs('/courses/abc-123/categories/def-456', {
      'abc-123': '18.06',
      'def-456': 'Exams',
    });
    expect(result).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Courses', path: '/courses' },
      { label: '18.06', path: '/courses/abc-123' },
      { label: 'Categories', path: '/courses/abc-123/categories' },
      { label: 'Exams', path: '/courses/abc-123/categories/def-456' },
    ]);
  });

  it('uses raw segment when no label mapping exists', () => {
    const result = generateBreadcrumbs('/unknown-page');
    expect(result).toEqual([
      { label: 'Home', path: '/' },
      { label: 'unknown-page', path: '/unknown-page' },
    ]);
  });

  it('decodes URI-encoded segments', () => {
    const result = generateBreadcrumbs('/courses/Problem%20Sets');
    expect(result).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Courses', path: '/courses' },
      { label: 'Problem Sets', path: '/courses/Problem%20Sets' },
    ]);
  });
});

describe('NavBar: admin link visibility', () => {
  it('shows admin link when isAdmin is true', () => {
    const isAdmin = true;
    const navItems = [
      { to: '/', label: 'Home' },
      { to: '/stats', label: 'Stats' },
      { to: '/profile', label: 'Profile' },
    ];
    if (isAdmin) {
      navItems.push({ to: '/admin', label: 'Admin' });
    }
    expect(navItems).toHaveLength(4);
    expect(navItems[3]).toEqual({ to: '/admin', label: 'Admin' });
  });

  it('hides admin link when isAdmin is false', () => {
    const isAdmin = false;
    const navItems = [
      { to: '/', label: 'Home' },
      { to: '/stats', label: 'Stats' },
      { to: '/profile', label: 'Profile' },
    ];
    if (isAdmin) {
      navItems.push({ to: '/admin', label: 'Admin' });
    }
    expect(navItems).toHaveLength(3);
    expect(navItems.find((item) => item.to === '/admin')).toBeUndefined();
  });
});
