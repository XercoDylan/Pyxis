import { describe, it, expect } from 'vitest';
import {
  isValidKerberos,
  isValidCourseNumber,
  isValidCourseName,
  isValidCategoryName,
  isValidFileSize,
  isValidBatchSize,
} from './validation';

describe('isValidKerberos', () => {
  it('accepts valid Kerberos identifiers', () => {
    expect(isValidKerberos('a@mit.edu')).toBe(true);
    expect(isValidKerberos('jdoe@mit.edu')).toBe(true);
    expect(isValidKerberos('abc123_x@mit.edu')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidKerberos('')).toBe(false);
    expect(isValidKerberos('1doe@mit.edu')).toBe(false);
    expect(isValidKerberos('jdoe@harvard.edu')).toBe(false);
    expect(isValidKerberos('toolonguser@mit.edu')).toBe(false);
    expect(isValidKerberos('Jdoe@mit.edu')).toBe(false);
  });
});

describe('isValidCourseNumber', () => {
  it('accepts valid course numbers', () => {
    expect(isValidCourseNumber('6.042')).toBe(true);
    expect(isValidCourseNumber('x'.repeat(20))).toBe(true);
  });

  it('rejects invalid course numbers', () => {
    expect(isValidCourseNumber('')).toBe(false);
    expect(isValidCourseNumber('x'.repeat(21))).toBe(false);
  });
});

describe('isValidCourseName', () => {
  it('accepts valid course names', () => {
    expect(isValidCourseName('Linear Algebra')).toBe(true);
    expect(isValidCourseName('x'.repeat(100))).toBe(true);
  });

  it('rejects invalid course names', () => {
    expect(isValidCourseName('')).toBe(false);
    expect(isValidCourseName('x'.repeat(101))).toBe(false);
  });
});

describe('isValidCategoryName', () => {
  it('accepts valid category names', () => {
    expect(isValidCategoryName('Exams')).toBe(true);
    expect(isValidCategoryName('x'.repeat(50))).toBe(true);
  });

  it('rejects invalid category names', () => {
    expect(isValidCategoryName('')).toBe(false);
    expect(isValidCategoryName('x'.repeat(51))).toBe(false);
  });
});

describe('isValidFileSize', () => {
  it('accepts valid file sizes', () => {
    expect(isValidFileSize(0)).toBe(true);
    expect(isValidFileSize(52_428_800)).toBe(true);
  });

  it('rejects invalid file sizes', () => {
    expect(isValidFileSize(-1)).toBe(false);
    expect(isValidFileSize(52_428_801)).toBe(false);
  });
});

describe('isValidBatchSize', () => {
  it('accepts valid batch sizes', () => {
    expect(isValidBatchSize(1)).toBe(true);
    expect(isValidBatchSize(10)).toBe(true);
  });

  it('rejects invalid batch sizes', () => {
    expect(isValidBatchSize(0)).toBe(false);
    expect(isValidBatchSize(11)).toBe(false);
  });
});
