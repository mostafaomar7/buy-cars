export type MembershipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUSPENDED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type Platform = 'android' | 'ios' | 'web';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; requestId?: string; details?: unknown };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface AdminRef {
  id: string;
  fullName: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  membershipStatus: MembershipStatus;
  statusReason: string | null;
  nationalId: string;
  phone: string | null;
  nationality: string | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  educationLevel: string | null;
  dateOfBirth: string | null;
  age: number | null;
  photoUrl: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  user: User;
  session: { token: string; tokenType: 'Bearer'; expiresAt: string };
}

export interface AccessRequest {
  id: string;
  status: RequestStatus;
  autoApproved: boolean;
  decisionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: AdminRef | null;
  user: User;
}

export interface Stats {
  members: Record<MembershipStatus, number> & { total: number };
  pendingRequests: number;
  preapprovedOpen: number;
  activeMemberSessions: number;
}

export interface MemberDetails {
  member: User;
  accessRequests: Omit<AccessRequest, 'user'>[];
  activeSessions: number;
}

export type MemberField =
  | 'fullName'
  | 'email'
  | 'nationalId'
  | 'phone'
  | 'dateOfBirth'
  | 'nationality'
  | 'gender'
  | 'maritalStatus'
  | 'educationLevel';

export type MemberUpdate = Partial<Record<MemberField, string | null>>;

export type ChangeableStatus = Exclude<MembershipStatus, 'PENDING'>;

export interface Session {
  id: string;
  deviceName: string | null;
  platform: Platform | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  active: boolean;
}

export interface Preapproved {
  id: string;
  nationalId: string;
  fullName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  note: string | null;
  consumed: boolean;
  consumedAt: string | null;
  consumedByUserId: string | null;
  createdBy: AdminRef | null;
  createdAt: string;
  updatedAt: string;
}

export type PreapprovedInput = Partial<
  Record<'nationalId' | 'fullName' | 'phone' | 'dateOfBirth' | 'note', string | null>
>;

export interface PreapprovedResult {
  entry: Preapproved;
  matchedUserId: string | null;
  autoApproved: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorAdminId: string | null;
  targetUserId: string | null;
  actorAdmin: AdminRef | null;
  targetUser: AdminRef | null;
}
