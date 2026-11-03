import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from './models';

/** خطأ من الواجهة نفسها (ليس من الخادم) بنفس أسلوب `error.code`. */
export class AppError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const MESSAGES: Record<string, string> = {
  NOT_ADMIN: 'هذا الحساب ليس حساب موظف، ولا يمكنه الدخول إلى لوحة التحكم',
  ADMIN_REQUIRED: 'لا تملك صلاحية الدخول إلى لوحة التحكم',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  AUTHENTICATION_REQUIRED: 'انتهت الجلسة، سجّل الدخول من جديد',
  INVALID_SESSION: 'انتهت الجلسة، سجّل الدخول من جديد',
  SESSION_EXPIRED: 'انتهت الجلسة، سجّل الدخول من جديد',
  SESSION_REVOKED: 'تم إنهاء الجلسة، سجّل الدخول من جديد',
  REQUEST_NOT_FOUND: 'الطلب غير موجود',
  MEMBER_NOT_FOUND: 'العضو غير موجود',
  SESSION_NOT_FOUND: 'الجلسة غير موجودة',
  PREAPPROVAL_NOT_FOUND: 'السجل غير موجود',
  PHOTO_NOT_FOUND: 'لا توجد صورة',
  REQUEST_ALREADY_REVIEWED: 'تمت مراجعة هذا الطلب مسبقًا، وتم تحديث البيانات',
  STATUS_UNCHANGED: 'الحالة المختارة هي نفس الحالة الحالية',
  SESSION_ALREADY_REVOKED: 'هذه الجلسة ملغاة بالفعل',
  EMAIL_ALREADY_REGISTERED: 'البريد الإلكتروني مسجل لعضو آخر',
  NATIONAL_ID_ALREADY_REGISTERED: 'رقم الهوية مسجل لعضو آخر',
  PREAPPROVAL_ALREADY_EXISTS: 'رقم الهوية موجود بالفعل في قائمة المعتمدين مسبقًا',
  PREAPPROVAL_CONSUMED: 'لا يمكن تعديل أو حذف سجل تم استخدامه',
  MEMBER_ALREADY_REGISTERED: 'هذا الشخص مسجل بالفعل وتمت مراجعة طلبه',
  FILE_TOO_LARGE: 'حجم الصورة أكبر من 5MB',
  INVALID_IMAGE: 'الصورة غير صالحة (JPEG أو PNG أو WebP فقط)',
  PHOTO_REQUIRED: 'اختر صورة أولًا',
  RATE_LIMITED: 'محاولات كثيرة، حاول بعد قليل',
  PERMISSION_DENIED: 'لا تملك صلاحية لهذا الإجراء',
  PASSWORD_CHANGE_REQUIRED: 'يجب تغيير كلمة المرور أولًا',
  ROLE_NOT_ASSIGNABLE: 'لا يمكنك منح هذا الدور',
  STAFF_NOT_MANAGEABLE: 'لا يمكنك تعديل هذا الحساب',
  CANNOT_MODIFY_SELF: 'لا يمكنك تعديل حسابك من هنا',
  STAFF_NOT_FOUND: 'الموظف غير موجود',
};

/** سبب إنهاء الجلسة (`401 SESSION_REVOKED` → `details.reason`). */
const SESSION_END_MESSAGES: Record<string, string> = {
  ROLE_CHANGED: 'تم تغيير صلاحياتك، سجّل الدخول مرة أخرى',
  STAFF_SUSPENDED: 'تم إيقاف حسابك، تواصل مع مدير النظام',
  PASSWORD_RESET: 'تمت إعادة تعيين كلمة المرور، سجّل الدخول بكلمة المرور الجديدة',
};

export function errorBody(err: unknown): ApiErrorBody['error'] | undefined {
  return err instanceof HttpErrorResponse ? (err.error as ApiErrorBody | null)?.error : undefined;
}

/** رسالة صفحة الدخول بعد انتهاء الجلسة من الخادم. */
export function sessionEndedMessage(error?: ApiErrorBody['error']): string {
  const reason = (error?.details as { reason?: string } | undefined)?.reason;
  return (reason && SESSION_END_MESSAGES[reason]) ?? MESSAGES['SESSION_EXPIRED'];
}

export function errorCode(err: unknown): string | undefined {
  return err instanceof AppError ? err.code : errorBody(err)?.code;
}

export function errorMessage(err: unknown): string {
  if (err instanceof AppError) return MESSAGES[err.code] ?? err.code;
  if (!(err instanceof HttpErrorResponse)) return 'حدث خطأ غير متوقع';
  if (err.status === 0) return 'تعذّر الاتصال بالخادم، تأكد من عنوان الباك إند وإعدادات CORS';

  const error = errorBody(err);
  if (!error) return `خطأ من الخادم (${err.status})`;

  if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
    return error.details.map((d: { message?: string }) => d.message).join('، ');
  }
  if (error.code === 'INTERNAL_SERVER_ERROR') {
    return `خطأ في الخادم، أرسل هذا الرقم للمطوّر: ${error.requestId ?? '—'}`;
  }
  return MESSAGES[error.code] ?? error.message;
}
