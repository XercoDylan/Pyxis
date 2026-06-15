import { describe, it, expect } from 'vitest';
import {
  truncateString,
  truncateMemberName,
  truncateFilename,
  classifyContentType,
  isViewableContentType,
  getCategoryZipFilename,
  getCourseZipFilename,
} from './formatting';

describe('truncateString', () => {
  it('returns original string when length <= maxLength', () => {
    expect(truncateString('hello', 5)).toBe('hello');
    expect(truncateString('hi', 10)).toBe('hi');
    expect(truncateString('', 5)).toBe('');
  });

  it('truncates and adds ellipsis when length > maxLength', () => {
    expect(truncateString('hello world', 5)).toBe('hell\u2026');
    expect(truncateString('abcdef', 3)).toBe('ab\u2026');
  });

  it('resulting string has exactly maxLength characters when truncated', () => {
    const result = truncateString('a very long string indeed', 10);
    expect(result.length).toBe(10);
  });
});

describe('truncateMemberName', () => {
  it('does not truncate names of 30 characters or fewer', () => {
    expect(truncateMemberName('John Doe')).toBe('John Doe');
    expect(truncateMemberName('x'.repeat(30))).toBe('x'.repeat(30));
  });

  it('truncates names longer than 30 characters', () => {
    const longName = 'x'.repeat(31);
    const result = truncateMemberName(longName);
    expect(result.length).toBe(30);
    expect(result.endsWith('\u2026')).toBe(true);
  });
});

describe('truncateFilename', () => {
  it('does not truncate filenames of 80 characters or fewer', () => {
    expect(truncateFilename('document.pdf')).toBe('document.pdf');
    expect(truncateFilename('x'.repeat(80))).toBe('x'.repeat(80));
  });

  it('truncates filenames longer than 80 characters', () => {
    const longFilename = 'x'.repeat(81);
    const result = truncateFilename(longFilename);
    expect(result.length).toBe(80);
    expect(result.endsWith('\u2026')).toBe(true);
  });
});

describe('classifyContentType', () => {
  it('classifies viewable formats correctly', () => {
    expect(classifyContentType('application/pdf')).toBe('viewable');
    expect(classifyContentType('image/png')).toBe('viewable');
    expect(classifyContentType('image/jpeg')).toBe('viewable');
    expect(classifyContentType('image/gif')).toBe('viewable');
    expect(classifyContentType('image/svg+xml')).toBe('viewable');
  });

  it('classifies non-viewable formats as download-only', () => {
    expect(classifyContentType('application/zip')).toBe('download-only');
    expect(classifyContentType('text/plain')).toBe('download-only');
    expect(classifyContentType('application/octet-stream')).toBe('download-only');
  });
});

describe('isViewableContentType', () => {
  it('returns true for viewable types', () => {
    expect(isViewableContentType('application/pdf')).toBe(true);
    expect(isViewableContentType('image/png')).toBe(true);
  });

  it('returns false for non-viewable types', () => {
    expect(isViewableContentType('application/zip')).toBe(false);
    expect(isViewableContentType('text/html')).toBe(false);
  });
});

describe('getCategoryZipFilename', () => {
  it('generates correct category ZIP filename', () => {
    expect(getCategoryZipFilename('6.042', 'Exams')).toBe('6.042_Exams.zip');
    expect(getCategoryZipFilename('18.06', 'Problem_Sets')).toBe('18.06_Problem_Sets.zip');
  });
});

describe('getCourseZipFilename', () => {
  it('generates correct course ZIP filename', () => {
    expect(getCourseZipFilename('6.042')).toBe('6.042_all.zip');
    expect(getCourseZipFilename('18.06')).toBe('18.06_all.zip');
  });
});
