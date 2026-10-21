import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  AccessRequest,
  AuditLog,
  ChangeableStatus,
  MemberDetails,
  MemberUpdate,
  MembershipStatus,
  Page,
  Preapproved,
  PreapprovedInput,
  PreapprovedResult,
  RequestStatus,
  Session,
  Stats,
  User,
} from './models';

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** كل Endpoints الإدارة (`/api/v1/admin/*`) في مكان واحد. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly api = inject(ApiService);

  stats() {
    return this.api.get<Stats>('/admin/stats');
  }

  // ---- طلبات الانضمام ----

  listRequests(query: ListQuery & { status?: RequestStatus | '' }) {
    return this.api.get<Page<AccessRequest>>('/admin/access-requests', { ...query });
  }

  getRequest(id: string) {
    return this.api.get<AccessRequest>(`/admin/access-requests/${id}`);
  }

  approveRequest(id: string, reason?: string) {
    return this.api.post<AccessRequest>(`/admin/access-requests/${id}/approve`, withReason(reason));
  }

  rejectRequest(id: string, reason?: string) {
    return this.api.post<AccessRequest>(`/admin/access-requests/${id}/reject`, withReason(reason));
  }

  // ---- الأعضاء ----

  listMembers(query: ListQuery & { status?: MembershipStatus | '' }) {
    return this.api.get<Page<User>>('/admin/members', { ...query });
  }

  getMember(id: string) {
    return this.api.get<MemberDetails>(`/admin/members/${id}`);
  }

  updateMember(id: string, changes: MemberUpdate) {
    return this.api.patch<unknown>(`/admin/members/${id}`, changes);
  }

  changeMemberStatus(id: string, status: ChangeableStatus, reason?: string) {
    return this.api.patch<{ member: User; revokedSessions: number }>(
      `/admin/members/${id}/status`,
      { status, ...withReason(reason) },
    );
  }

  uploadMemberPhoto(id: string, file: File) {
    const body = new FormData();
    body.append('photo', file);
    return this.api.put<User>(`/admin/members/${id}/photo`, body);
  }

  deleteMemberPhoto(id: string) {
    return this.api.delete<User>(`/admin/members/${id}/photo`);
  }

  // ---- الجلسات ----

  memberSessions(id: string, includeInactive: boolean) {
    return this.api.get<Session[]>(`/admin/members/${id}/sessions`, { includeInactive });
  }

  logoutMember(id: string) {
    return this.api.post<{ userId: string; revokedSessions: number }>(`/admin/members/${id}/logout`);
  }

  revokeSession(sessionId: string) {
    return this.api.post<unknown>(`/admin/sessions/${sessionId}/revoke`);
  }

  // ---- المعتمدون مسبقًا ----

  listPreapproved(query: ListQuery & { consumed: boolean }) {
    return this.api.get<Page<Preapproved>>('/admin/preapproved', { ...query });
  }

  createPreapproved(input: PreapprovedInput) {
    return this.api.post<PreapprovedResult>('/admin/preapproved', input);
  }

  updatePreapproved(id: string, changes: PreapprovedInput) {
    return this.api.patch<unknown>(`/admin/preapproved/${id}`, changes);
  }

  deletePreapproved(id: string) {
    return this.api.delete<unknown>(`/admin/preapproved/${id}`);
  }

  // ---- سجل العمليات ----

  auditLogs(query: ListQuery & { action?: string; targetUserId?: string }) {
    return this.api.get<Page<AuditLog>>('/admin/audit-logs', { ...query });
  }
}

function withReason(reason?: string): { reason?: string } {
  return reason ? { reason } : {};
}
