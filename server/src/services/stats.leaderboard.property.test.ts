import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 17: Leaderboard only includes contributors
 *
 * Validates: Requirements 9.1
 *
 * For any set of members with varying upload counts, the leaderboard function
 * should return exactly those members whose total upload count is greater than zero.
 */

interface MemberEntry {
  name: string;
  totalFiles: number;
}

/**
 * Pure function that filters members to only those who have contributed (totalFiles > 0).
 * Mirrors the leaderboard query logic in stats.service.ts which includes only members
 * with at least one uploaded file.
 */
export function filterContributors(members: MemberEntry[]): MemberEntry[] {
  return members.filter((member) => member.totalFiles > 0);
}

// Arbitrary for member objects with a name and totalFiles in [0, 100]
const memberArb: fc.Arbitrary<MemberEntry> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  totalFiles: fc.integer({ min: 0, max: 100 }),
});

describe('Property 17: Leaderboard only includes contributors', () => {
  it('returns exactly those members with totalFiles > 0', () => {
    fc.assert(
      fc.property(
        fc.array(memberArb, { minLength: 0, maxLength: 50 }),
        (members) => {
          const result = filterContributors(members);

          // Every returned member must have totalFiles > 0
          for (const member of result) {
            expect(member.totalFiles).toBeGreaterThan(0);
          }

          // Every member with totalFiles > 0 in the input must be in the result
          const expected = members.filter((m) => m.totalFiles > 0);
          expect(result).toHaveLength(expected.length);
          expect(result).toEqual(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns an empty array when no members have contributions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            totalFiles: fc.constant(0),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (members) => {
          const result = filterContributors(members);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns all members when every member has contributions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            totalFiles: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (members) => {
          const result = filterContributors(members);
          expect(result).toHaveLength(members.length);
          expect(result).toEqual(members);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(memberArb, { minLength: 0, maxLength: 50 }),
        (members) => {
          const original = [...members];
          filterContributors(members);
          expect(members).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });
});
