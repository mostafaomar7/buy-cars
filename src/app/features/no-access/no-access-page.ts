import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/ui/icon';

/** حساب موظف بدون أي صلاحية عرض. */
@Component({
  selector: 'app-no-access-page',
  imports: [Icon],
  template: `
    <section class="card empty-state">
      <app-icon name="lock" />
      <h1>لا توجد صفحات متاحة لحسابك</h1>
      <p class="muted">تواصل مع مدير النظام لمنحك الصلاحيات المناسبة.</p>
      <button type="button" class="btn btn--ghost" (click)="auth.logout()">تسجيل الخروج</button>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoAccessPage {
  protected readonly auth = inject(AuthService);
}
