import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ChangePasswordForm } from '../../shared/change-password-form';
import { Logo } from '../../shared/ui/logo';

/** تغيير كلمة المرور المؤقتة إجباريًا قبل أي صفحة أخرى (`mustChangePassword`). */
@Component({
  selector: 'app-change-password-page',
  imports: [ChangePasswordForm, Logo],
  template: `
    <div class="center-page">
      <section class="center-page__card">
        <app-logo [height]="48" />
        <h1>تغيير كلمة المرور</h1>
        <p class="muted">
          مرحبًا {{ auth.user()?.fullName }}، أنت تستخدم كلمة مرور مؤقتة. اختر كلمة مرور جديدة للمتابعة.
        </p>
        <app-change-password-form (changed)="onChanged()">
          <button type="button" class="btn btn--ghost" (click)="auth.logout()">تسجيل الخروج</button>
        </app-change-password-form>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPage {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected onChanged(): void {
    this.toast.success('تم تغيير كلمة المرور');
    this.router.navigate(['/']);
  }
}
