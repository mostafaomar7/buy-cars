import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AppError } from './api-error';
import { LoginResult, User } from './models';

const TOKEN_KEY = 'admin.token';
const USER_KEY = 'admin.user';

/** التوكن يُحفظ في sessionStorage فقط (يُمسح بإغلاق المتصفح) كما ينصح الدليل. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private readonly _user = signal<User | null>(readUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(identifier: string, password: string): Observable<User> {
    const body = { identifier, password, platform: 'web', deviceName: deviceName() };
    return this.api.post<LoginResult>('/auth/login', body).pipe(
      switchMap(({ user, session }) => {
        if (user.role === 'ADMIN') {
          this.setSession(session.token, user);
          return of(user);
        }
        // حساب عادي: لا نحفظ التوكن، وننهي الجلسة التي أُنشئت على الخادم.
        return this.revoke(session.token).pipe(switchMap(() => throwError(() => new AppError('NOT_ADMIN'))));
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  logout(): void {
    const token = this._token();
    if (token) this.revoke(token).subscribe();
    this.clearSession();
  }

  /** يمسح الجلسة محليًا ويرجع لصفحة الدخول (يُستدعى أيضًا عند أي 401). */
  clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private revoke(token: string): Observable<void> {
    return this.api
      .post('/auth/logout', {}, { Authorization: `Bearer ${token}` })
      .pipe(map(() => undefined));
  }
}

function readUser(): User | null {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function deviceName(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  return `Dashboard - ${browser}`;
}
