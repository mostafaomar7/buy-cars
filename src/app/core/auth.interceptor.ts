import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from './api.service';
import { AuthService } from './auth.service';

/** يضيف توكن الأدمن لطلبات الـ API، ويرجع لصفحة الدخول عند أي 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const token = auth.token();
  if (token && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  const isAuthCall = req.url.startsWith(`${API_URL}/auth/login`) || req.url.startsWith(`${API_URL}/auth/logout`);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall) {
        auth.clearSession();
      }
      return throwError(() => err);
    }),
  );
};
