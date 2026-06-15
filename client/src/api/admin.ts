import apiClient from './client';

export interface MemberEntry {
  id: string;
  name: string;
  major: string;
  grade: string;
  token: string;
  isAdmin: boolean;
  joinedAt: string;
  lastLoginAt: string;
}

export interface CreateMemberData {
  name: string;
  major?: string;
  grade?: string;
  isAdmin?: boolean;
}

/**
 * Fetch all members.
 */
export async function getMembers(): Promise<MemberEntry[]> {
  const response = await apiClient.get<{ members: MemberEntry[] }>('/admin/members');
  return response.data.members;
}

/**
 * Create a new member (auto-generates token).
 */
export async function createMember(data: CreateMemberData): Promise<MemberEntry> {
  const response = await apiClient.post<{ member: MemberEntry }>('/admin/members', data);
  return response.data.member;
}

/**
 * Remove a member.
 */
export async function removeMember(id: string): Promise<void> {
  await apiClient.delete(`/admin/members/${id}`);
}
