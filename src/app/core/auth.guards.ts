import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission } from './models';
import { landingPath } from './navigation';

/** صفحات الداشبورد: لازم دخول، ولو مطلوب تغيير كلمة المرور فلا شيء غيرها. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  return !auth.mustChangePassword() || router.createUrlTree(['/change-password']);
};

/** صفحة تغيير كلمة المرور الإجبارية. */
export const passwordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  return auth.mustChangePassword() || router.createUrlTree(['/']);
};

export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/']);

/** بدون الصلاحية يتحوّل لأول صفحة مسموح بها. */
export function permissionGuard(permission: Permission): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    return auth.can(permission) || inject(Router).createUrlTree([landingPath(auth.can)]);
  };
}
