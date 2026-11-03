import { LiveEvent } from '../core/live-events.service';
import {
  AuditLog,
  Gender,
  MaritalStatus,
  MemberField,
  MembershipStatus,
  Platform,
  StaffRole,
  StaffStatus,
} from '../core/models';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const STATUS_LABELS: Record<MembershipStatus, string> = {
  PENDING: 'قيد المراجعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

/** للعرض فقط؛ صفحة الموظفين تستخدم المسميات القادمة من `/admin/roles`. */
export const ROLE_LABELS: Record<StaffRole, string> = {
  SUPER_ADMIN: 'مدير النظام',
  ADMIN: 'مشرف',
  REVIEWER: 'مراجع',
  VIEWER: 'مشاهد',
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  ACCEPTED: 'نشط',
  SUSPENDED: 'موقوف',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'ذكر',
  FEMALE: 'أنثى',
};

export const MARITAL_LABELS: Record<MaritalStatus, string> = {
  SINGLE: 'أعزب',
  MARRIED: 'متزوج',
  DIVORCED: 'مطلق',
  WIDOWED: 'أرمل',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  android: 'أندرويد',
  ios: 'iOS',
  web: 'ويب',
};

export const FIELD_LABELS: Record<MemberField, string> = {
  fullName: 'الاسم',
  email: 'البريد',
  nationalId: 'رقم الهوية',
  phone: 'الجوال',
  dateOfBirth: 'تاريخ الميلاد',
  nationality: 'الجنسية',
  gender: 'الجنس',
  maritalStatus: 'الحالة الاجتماعية',
  educationLevel: 'المستوى التعليمي',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ACCESS_REQUEST_ACCEPTED: 'قبول طلب',
  ACCESS_REQUEST_REJECTED: 'رفض طلب',
  ACCESS_AUTO_APPROVED: 'قبول تلقائي',
  MEMBER_UPDATED: 'تعديل بيانات',
  MEMBER_STATUS_CHANGED: 'تغيير الحالة',
  MEMBER_PHOTO_UPDATED: 'تغيير الصورة',
  MEMBER_PHOTO_DELETED: 'حذف الصورة',
  MEMBER_FORCE_LOGOUT: 'تسجيل خروج من كل الأجهزة',
  SESSION_REVOKED: 'إلغاء جلسة',
  PREAPPROVAL_CREATED: 'إضافة معتمد مسبقًا',
  PREAPPROVAL_UPDATED: 'تعديل معتمد مسبقًا',
  PREAPPROVAL_DELETED: 'حذف معتمد مسبقًا',
};

export function toOptions<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

function statusLabel(status: unknown): string {
  return STATUS_LABELS[status as MembershipStatus] ?? String(status ?? '—');
}

/** نص عربي مختصر لكل حدث لحظي. */
export function describeEvent({ type, data }: LiveEvent): string {
  switch (type) {
    case 'access_request.created':
      return data['autoApproved']
        ? `تم قبول ${data['fullName']} تلقائيًا (معتمد مسبقًا)`
        : `طلب انضمام جديد من ${data['fullName']}`;
    case 'session.created': {
      const device = data['deviceName'] ?? PLATFORM_LABELS[data['platform'] as Platform] ?? 'جهاز غير معروف';
      return `${data['fullName']} سجّل دخول من ${device}`;
    }
    case 'access_request.decided':
      return data['status'] === 'ACCEPTED' ? 'تم قبول طلب انضمام' : 'تم رفض طلب انضمام';
    case 'member.status_changed':
      return `تغيّرت حالة عضو من ${statusLabel(data['from'])} إلى ${statusLabel(data['to'])}`;
    case 'member.updated':
      return 'تم تعديل بيانات عضو';
    case 'session.revoked':
      return `تم إنهاء ${data['revokedSessions'] ?? 1} جلسة لعضو`;
    case 'staff.created':
      return `تمت إضافة موظف${data['fullName'] ? `: ${data['fullName']}` : ''}`;
    case 'staff.updated':
      return `تم تعديل بيانات موظف${data['fullName'] ? `: ${data['fullName']}` : ''}`;
    case 'staff.status_changed':
      return data['to'] === 'SUSPENDED' || data['status'] === 'SUSPENDED' ? 'تم إيقاف موظف' : 'تم تفعيل موظف';
    default:
      return 'تم الاتصال بالإشعارات اللحظية';
  }
}

/** تفاصيل مختصرة لسجل العمليات من الـ metadata. */
export function describeAudit({ action, metadata }: AuditLog): string {
  const m = metadata ?? {};
  const parts: string[] = [];

  if (action === 'MEMBER_UPDATED' && Array.isArray(m['fields'])) {
    parts.push((m['fields'] as MemberField[]).map((f) => FIELD_LABELS[f] ?? f).join('، '));
  }
  if (m['from'] || m['to']) parts.push(`${statusLabel(m['from'])} ← ${statusLabel(m['to'])}`);
  if (m['nationalId']) parts.push(`هوية ${m['nationalId']}`);
  if (m['reason']) parts.push(`السبب: ${m['reason']}`);
  if (typeof m['revokedSessions'] === 'number' && m['revokedSessions'] > 0) {
    parts.push(`إنهاء ${m['revokedSessions']} جلسة`);
  }
  return parts.join(' · ') || '—';
}
