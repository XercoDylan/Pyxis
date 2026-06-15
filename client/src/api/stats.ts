import apiClient from './client';

export interface LeaderboardEntry {
  memberId: string;
  name: string;
  totalFiles: number;
  distinctCourses: number;
}

export interface MemberFile {
  filename: string;
  category: string;
  uploadedAt: string;
}

export interface CourseContribution {
  courseNumber: string;
  courseName: string;
  files: MemberFile[];
}

export interface MemberDetailData {
  memberId: string;
  name: string;
  courses: CourseContribution[];
}

export interface ProfileData {
  name: string;
  major: string;
  grade: string;
  joinedAt: string;
  totalContributions: number;
  lastContributionDate: string | null;
}

/**
 * Fetch the contribution leaderboard.
 * Returns members sorted by total file uploads (descending).
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get<{ leaderboard: LeaderboardEntry[] }>('/stats/leaderboard');
  return response.data.leaderboard;
}

/**
 * Fetch detailed contribution data for a specific member.
 */
export async function getMemberDetail(memberId: string): Promise<MemberDetailData> {
  const response = await apiClient.get<{ contributions: Array<{ courseNumber: string; courseName: string; files: Array<{ filename: string; categoryName: string; uploadDate: string }> }> }>(`/stats/members/${memberId}`);
  // Map server field names to what the component expects
  const courses: CourseContribution[] = response.data.contributions.map((c) => ({
    courseNumber: c.courseNumber,
    courseName: c.courseName,
    files: c.files.map((f) => ({
      filename: f.filename,
      category: f.categoryName,
      uploadedAt: f.uploadDate,
    })),
  }));
  return { memberId, name: '', courses };
}

/**
 * Fetch the current authenticated member's profile.
 */
export async function getMyProfile(): Promise<ProfileData> {
  const response = await apiClient.get<{ member: ProfileData }>('/members/me');
  return response.data.member;
}
