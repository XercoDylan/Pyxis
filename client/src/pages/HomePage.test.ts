import { describe, it, expect } from 'vitest';
import { filterCourses, sortCourses } from './HomePage';
import { Course } from '../types';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: '1',
    courseNumber: '6.042',
    courseName: 'Mathematics for Computer Science',
    createdById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('sortCourses', () => {
  it('sorts courses alphabetically by courseNumber', () => {
    const courses = [
      makeCourse({ id: '1', courseNumber: '18.06' }),
      makeCourse({ id: '2', courseNumber: '6.042' }),
      makeCourse({ id: '3', courseNumber: '14.01' }),
    ];

    const sorted = sortCourses(courses);
    expect(sorted.map((c) => c.courseNumber)).toEqual(['14.01', '18.06', '6.042']);
  });

  it('returns empty array for empty input', () => {
    expect(sortCourses([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const courses = [
      makeCourse({ id: '1', courseNumber: '18.06' }),
      makeCourse({ id: '2', courseNumber: '6.042' }),
    ];
    const original = [...courses];
    sortCourses(courses);
    expect(courses).toEqual(original);
  });
});

describe('filterCourses', () => {
  const courses = [
    makeCourse({ id: '1', courseNumber: '6.042', courseName: 'Mathematics for Computer Science' }),
    makeCourse({ id: '2', courseNumber: '18.06', courseName: 'Linear Algebra' }),
    makeCourse({ id: '3', courseNumber: '6.006', courseName: 'Introduction to Algorithms' }),
    makeCourse({ id: '4', courseNumber: '14.01', courseName: 'Principles of Microeconomics' }),
  ];

  it('returns all courses when search term is empty', () => {
    expect(filterCourses(courses, '')).toEqual(courses);
  });

  it('returns all courses when search term is whitespace only', () => {
    expect(filterCourses(courses, '   ')).toEqual(courses);
  });

  it('filters by course number substring (case-insensitive)', () => {
    const result = filterCourses(courses, '6.0');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.courseNumber)).toContain('6.042');
    expect(result.map((c) => c.courseNumber)).toContain('6.006');
  });

  it('filters by course name substring (case-insensitive)', () => {
    const result = filterCourses(courses, 'algebra');
    expect(result).toHaveLength(1);
    expect(result[0].courseNumber).toBe('18.06');
  });

  it('is case-insensitive for course name', () => {
    const result = filterCourses(courses, 'MATHEMATICS');
    expect(result).toHaveLength(1);
    expect(result[0].courseNumber).toBe('6.042');
  });

  it('returns empty array when nothing matches', () => {
    const result = filterCourses(courses, 'xyznotfound');
    expect(result).toHaveLength(0);
  });

  it('matches partial substrings in course number', () => {
    const result = filterCourses(courses, '14');
    expect(result).toHaveLength(1);
    expect(result[0].courseNumber).toBe('14.01');
  });
});
