import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 19: Leaderboard composite sort
 *
 * Validates: Requirements 9.3
 *
 * For any list of contributing members, the sort function should produce output
 * where for every adjacent pair (a, b): either a.totalFiles > b.totalFiles, or
 * (a.totalFiles == b.totalFiles AND a.name <= b.name).
 */

interface LeaderboardEntry {
  name: string;
  totalFiles: number;
}

/**
 * Pure sort function that sorts leaderboard entries by totalFiles descending,
 * then by name ascending for ties.
 * Mirrors the sort logic in stats.service.ts getLeaderboard().
 */
export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.totalFiles !== a.totalFiles) {
      return b.totalFiles - a.totalFiles;
    }
    return a.name.localeCompare(b.name);
  });
}

// Arbitrary for leaderboard entries
const leaderboardEntryArb: fc.Arbitrary<LeaderboardEntry> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  totalFiles: fc.nat({ max: 500 }),
});

describe('Property 19: Leaderboard composite sort', () => {
  it('adjacent pairs: either a.totalFiles > b.totalFiles, or equal with a.name <= b.name', () => {
    fc.assert(
      fc.property(
        fc.array(leaderboardEntryArb, { minLength: 0, maxLength: 50 }),
        (entries) => {
          const sorted = sortLeaderboard(entries);

          // Verify the composite sort invariant for all adjacent pairs
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];

            if (a.totalFiles !== b.totalFiles) {
              // Primary sort: totalFiles descending
              expect(a.totalFiles).toBeGreaterThan(b.totalFiles);
            } else {
              // Secondary sort: name ascending
              expect(a.name.localeCompare(b.name)).toBeLessThanOrEqual(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
