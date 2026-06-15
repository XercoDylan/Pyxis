import { describe, it, expect } from 'vitest';
import {
  isValidKerberos,
  isValidCourseNumber,
  isValidCourseName,
  isValidCategoryName,
  isValidFileSize,
  isValidBatchSize,
  isValidBulkAddCount,
  truncateString,
  classifyContentType,
  getCategoryZipFilename,
  getCourseZipFilename,
  VALIDATION_CONSTANTS,
} from './index';

describe('isValidKerberos', () => {
  it('accepts valid Kerberos identifiers', () => {
    expect(isValidKerberos('a@mit.edu')).toBe(true);
    expect(isValidKerberos('jdoe@mit.edu')).toBe(true);
    expect(isValidKerberos('abc123_x@mit.edu')).toBe(true);
    expect(isValidKerberos('j1234567@mit.edu')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidKerberos('')).toBe(false);
  });

  it('rejects identifiers not ending with @mit.edu', () => {
    expect(isValidKerberos('jdoe@harvard.edu')).toBe(false);
    expect(isValidKerberos('jdoe@mit.com')).toBe(false);
    expect(isValidKerberos('jdoe')).toBe(false);
  });

  it('rejects identifiers starting with non-lowercase letter', () => {
    expect(isValidKerberos('1doe@mit.edu')).toBe(false);
    expect(isValidKerberos('_doe@mit.edu')).toBe(false);
    expect(isValidKerberos('Jdoe@mit.edu')).toBe(false);
  });

  it('rejects identifiers with username longer than 8 characters', () => {
    expect(isValidKerberos('abcdefghi@mit.edu')).toBe(false);
    expect(isValidKerberos('toolonguser@mit.edu')).toBe(false);
  });

  it('rejects identifiers with invalid characters in username', () => {
    expect(isValidKerberos('j-doe@mit.edu')).toBe(false);
    expect(isValidKerberos('j.doe@mit.edu')).toBe(false);
    expect(isValidKerberos('j doe@mit.edu')).toBe(false);
    expect(isValidKerberos('jDoe@mit.edu')).toBe(false);
  });
});

describe('isValidCourseNumber', () => {
  it('accepts valid course numbers', () => {
    expect(isValidCourseNumber('6.042')).toBe(true);
    expect(isValidCourseNumber('18.06')).toBe(true);
    expect(isValidCourseNumber('A')).toBe(true);
    expect(isValidCourseNumber('x'.repeat(20))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCourseNumber('')).toBe(false);
  });

  it('rejects strings exceeding 20 characters', () => {
    expect(isValidCourseNumber('x'.repeat(21))).toBe(false);
  });
});

describe('isValidCourseName', () => {
  it('accepts valid course names', () => {
    expect(isValidCourseName('Mathematics for Computer Science')).toBe(true);
    expect(isValidCourseName('A')).toBe(true);
    expect(isValidCourseName('x'.repeat(100))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCourseName('')).toBe(false);
  });

  it('rejects strings exceeding 100 characters', () => {
    expect(isValidCourseName('x'.repeat(101))).toBe(false);
  });
});

describe('isValidCategoryName', () => {
  it('accepts valid category names', () => {
    expect(isValidCategoryName('Exams')).toBe(true);
    expect(isValidCategoryName('Problem_Sets')).toBe(true);
    expect(isValidCategoryName('A')).toBe(true);
    expect(isValidCategoryName('x'.repeat(50))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCategoryName('')).toBe(false);
  });

  it('rejects strings exceeding 50 characters', () => {
    expect(isValidCategoryName('x'.repeat(51))).toBe(false);
  });
});

describe('isValidFileSize', () => {
  it('accepts files within the 50 MB limit', () => {
    expect(isValidFileSize(0)).toBe(true);
    expect(isValidFileSize(1024)).toBe(true);
    expect(isValidFileSize(52_428_800)).toBe(true);
  });

  it('rejects files exceeding 50 MB', () => {
    expect(isValidFileSize(52_428_801)).toBe(false);
    expect(isValidFileSize(100_000_000)).toBe(false);
  });

  it('rejects negative file sizes', () => {
    expect(isValidFileSize(-1)).toBe(false);
  });
});

describe('isValidBatchSize', () => {
  it('accepts batches of 1–10 files', () => {
    expect(isValidBatchSize(1)).toBe(true);
    expect(isValidBatchSize(5)).toBe(true);
    expect(isValidBatchSize(10)).toBe(true);
  });

  it('rejects batches of 0 or more than 10 files', () => {
    expect(isValidBatchSize(0)).toBe(false);
    expect(isValidBatchSize(11)).toBe(false);
  });
});

describe('isValidBulkAddCount', () => {
  it('accepts counts of 1–50', () => {
    expect(isValidBulkAddCount(1)).toBe(true);
    expect(isValidBulkAddCount(50)).toBe(true);
  });

  it('rejects counts of 0 or more than 50', () => {
    expect(isValidBulkAddCount(0)).toBe(false);
    expect(isValidBulkAddCount(51)).toBe(false);
  });
});

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
    expect(result).toBe('a very lo\u2026');
  });
});

describe('classifyContentType', () => {
  it('classifies viewable content types correctly', () => {
    expect(classifyContentType('application/pdf')).toBe('viewable');
    expect(classifyContentType('image/png')).toBe('viewable');
    expect(classifyContentType('image/jpeg')).toBe('viewable');
    expect(classifyContentType('image/gif')).toBe('viewable');
    expect(classifyContentType('image/svg+xml')).toBe('viewable');
  });

  it('classifies non-viewable content types as download-only', () => {
    expect(classifyContentType('application/zip')).toBe('download-only');
    expect(classifyContentType('text/plain')).toBe('download-only');
    expect(classifyContentType('application/octet-stream')).toBe('download-only');
    expect(classifyContentType('video/mp4')).toBe('download-only');
    expect(classifyContentType('application/msword')).toBe('download-only');
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

describe('VALIDATION_CONSTANTS', () => {
  it('exports expected constant values', () => {
    expect(VALIDATION_CONSTANTS.MAX_FILE_SIZE).toBe(52_428_800);
    expect(VALIDATION_CONSTANTS.MAX_BATCH_SIZE).toBe(10);
    expect(VALIDATION_CONSTANTS.MAX_BULK_ADD_COUNT).toBe(50);
    expect(VALIDATION_CONSTANTS.MAX_COURSE_NUMBER_LENGTH).toBe(20);
    expect(VALIDATION_CONSTANTS.MAX_COURSE_NAME_LENGTH).toBe(100);
    expect(VALIDATION_CONSTANTS.MAX_CATEGORY_NAME_LENGTH).toBe(50);
    expect(VALIDATION_CONSTANTS.MAX_MEMBER_NAME_DISPLAY_LENGTH).toBe(30);
    expect(VALIDATION_CONSTANTS.MAX_FILENAME_DISPLAY_LENGTH).toBe(80);
  });
});
