import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from './api.service';
import { errorBody, sessionEndedMessage } from './api-error';
import { AuthService } from './auth.service';

/**
 * يضيف توكن الموظف لطلبات الـ API، ويتعامل مع:
 * - `401` → يمسح الجلسة ويرجع لصفحة الدخول مع سبب الإنهاء.
 * - `403 PASSWORD_CHANGE_REQUIRED` → يحوّل لصفحة تغيير كلمة المرور.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const token = auth.token();
  if (token && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  // كلمة مرور خاطئة هنا لا تعني انتهاء الجلسة.
  const isAuthCall = ['/auth/login', '/auth/logout', '/auth/change-password'].some((path) =>
    req.url.startsWith(API_URL + path),
  );

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && !isAuthCall) {
        const error = errorBody(err);
        if (err.status === 401) auth.clearSession(sessionEndedMessage(error));
        if (err.status === 403 && error?.code === 'PASSWORD_CHANGE_REQUIRED') auth.requirePasswordChange();
      }
      return throwError(() => err);
    }),
  );
};
