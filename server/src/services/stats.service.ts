/**
 * Statistics service.
 *
 * Provides leaderboard queries, member contribution breakdowns,
 * and member profile information.
 */

import { prisma } from '../config/database.js';

/**
 * Leaderboard entry returned by getLeaderboard.
 */
export interface LeaderboardEntry {
  memberId: string;
  name: string;
  totalFiles: number;
  distinctCourses: number;
}

/**
 * A single file contribution within a course group.
 */
export interface ContributionFile {
  filename: string;
  categoryName: string;
  uploadDate: string; // YYYY-MM-DD
}

/**
 * A course group containing all files contributed by a member.
 */
export interface CourseContribution {
  courseNumber: string;
  courseName: string;
  files: ContributionFile[];
}

/**
 * Member profile with contribution stats.
 */
export interface MemberProfile {
  id: string;
  name: string;
  major: string;
  grade: string;
  joinedAt: string;
  totalContributions: number;
  lastContributionDate: string | null;
}

/**
 * Returns the contribution leaderboard.
 *
 * Includes only members with at least 1 uploaded file.
 * For each member: name, total file count, distinct course count.
 * Sorted by totalFiles DESC, then name ASC for ties.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  // Get all members who have uploaded at least one file, with their files
  const members = await prisma.member.findMany({
    where: {
      uploadedFiles: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      uploadedFiles: {
        select: {
          category: {
            select: {
              yearFolder: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Compute totalFiles and distinctCourses per member
  const entries: LeaderboardEntry[] = members.map((member) => {
    const totalFiles = member.uploadedFiles.length;
    const distinctCourseIds = new Set(
      member.uploadedFiles.map((f) => f.category.yearFolder.courseId)
    );
    return {
      memberId: member.id,
      name: member.name,
      totalFiles,
      distinctCourses: distinctCourseIds.size,
    };
  });

  // Sort by totalFiles DESC, then name ASC
  entries.sort((a, b) => {
    if (b.totalFiles !== a.totalFiles) {
      return b.totalFiles - a.totalFiles;
    }
    return a.name.localeCompare(b.name);
  });

  return entries;
}

/**
 * Returns all files uploaded by a member, grouped by course.
 *
 * Each file includes: filename, category name, upload date (YYYY-MM-DD).
 * Grouped by course number.
 */
export async function getMemberContributions(
  memberId: string
): Promise<CourseContribution[]> {
  const files = await prisma.file.findMany({
    where: { uploadedById: memberId },
    select: {
      filename: true,
      uploadedAt: true,
      category: {
        select: {
          name: true,
          yearFolder: {
            select: {
              course: {
                select: {
                  courseNumber: true,
                  courseName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  // Group files by course number
  const courseMap = new Map<string, CourseContribution>();

  for (const file of files) {
    const { courseNumber, courseName } = file.category.yearFolder.course;

    if (!courseMap.has(courseNumber)) {
      courseMap.set(courseNumber, {
        courseNumber,
        courseName,
        files: [],
      });
    }

    courseMap.get(courseNumber)!.files.push({
      filename: file.filename,
      categoryName: file.category.name,
      uploadDate: file.uploadedAt.toISOString().split('T')[0],
    });
  }

  return Array.from(courseMap.values());
}

/**
 * Returns the member's profile with contribution stats.
 */
export async function getMemberProfile(
  memberId: string
): Promise<MemberProfile | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      major: true,
      grade: true,
      joinedAt: true,
      uploadedFiles: {
        select: { uploadedAt: true },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!member) {
    return null;
  }

  const totalContributions = member.uploadedFiles.length;
  const lastContributionDate =
    totalContributions > 0
      ? member.uploadedFiles[0].uploadedAt.toISOString().split('T')[0]
      : null;

  return {
    id: member.id,
    name: member.name,
    major: member.major,
    grade: member.grade,
    joinedAt: member.joinedAt.toISOString(),
    totalContributions,
    lastContributionDate,
  };
}
