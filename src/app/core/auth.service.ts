import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AppError } from './api-error';
import { CurrentUser, LoginResult, Permission } from './models';

const TOKEN_KEY = 'admin.token';
const USER_KEY = 'admin.user';

/** التوكن يُحفظ في sessionStorage فقط (يُمسح بإغلاق المتصفح) كما ينصح الدليل. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private readonly _user = signal<CurrentUser | null>(readUser());
  private readonly _notice = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  /** رسالة تظهر في صفحة الدخول (مثل سبب إنهاء الجلسة). */
  readonly notice = this._notice.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());
  readonly mustChangePassword = computed(() => !!this._user()?.mustChangePassword);

  /** الإخفاء في الواجهة للتجربة فقط، والخادم هو اللي بيمنع فعلًا. */
  readonly can = (permission: Permission): boolean => !!this._user()?.permissions.includes(permission);

  /** عند فتح التطبيق: تحديث بيانات المستخدم وصلاحياته من الخادم. */
  restore(): Promise<unknown> {
    if (!this._token()) return Promise.resolve();
    return firstValueFrom(this.refreshUser().pipe(catchError(() => of(null))));
  }

  login(identifier: string, password: string): Observable<CurrentUser> {
    this._notice.set(null);
    const body = { identifier, password, platform: 'web', deviceName: deviceName() };
    return this.api.post<LoginResult>('/auth/login', body).pipe(
      switchMap(({ user, session }) => {
        if (user.role !== 'USER') {
          this.setSession(session.token, user);
          return of(user);
        }
        // حساب عضو عادي: لا نحفظ التوكن، وننهي الجلسة التي أُنشئت على الخادم.
        return this.revoke(session.token).pipe(switchMap(() => throwError(() => new AppError('NOT_ADMIN'))));
      }),
    );
  }

  refreshUser(): Observable<CurrentUser> {
    return this.api.get<{ user: CurrentUser }>('/auth/me').pipe(
      map(({ user }) => user),
      tap((user) => this.setUser(user)),
    );
  }

  /** بعد التغيير نعيد تحميل المستخدم ليتحدّث `mustChangePassword`. */
  changePassword(currentPassword: string, newPassword: string): Observable<CurrentUser> {
    return this.api
      .post('/auth/change-password', { currentPassword, newPassword })
      .pipe(switchMap(() => this.refreshUser()));
  }

  /** عند `403 PASSWORD_CHANGE_REQUIRED` من الخادم. */
  requirePasswordChange(): void {
    const user = this._user();
    if (user) this.setUser({ ...user, mustChangePassword: true });
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    const token = this._token();
    if (token) this.revoke(token).subscribe({ error: () => undefined });
    this.clearSession();
  }

  /** يمسح الجلسة محليًا ويرجع لصفحة الدخول، مع رسالة اختيارية تظهر هناك. */
  clearSession(notice: string | null = null): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this._notice.set(notice);
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: CurrentUser): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
    this.setUser(user);
  }

  private setUser(user: CurrentUser): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private revoke(token: string): Observable<void> {
    return this.api
      .post('/auth/logout', {}, { Authorization: `Bearer ${token}` })
      .pipe(map(() => undefined));
  }
}

/** بيانات قديمة بدون `permissions` تُتجاهل، فيتم تحميلها من جديد عبر `restore()`. */
function readUser(): CurrentUser | null {
  try {
    const user = JSON.parse(sessionStorage.getItem(USER_KEY) ?? 'null');
    return Array.isArray(user?.permissions) ? user : null;
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
