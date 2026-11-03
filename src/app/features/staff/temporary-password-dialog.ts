import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';

/**
 * يعرض كلمة المرور المؤقتة (تُرجع من الخادم مرة واحدة فقط).
 * لا تُحفظ في أي مكان؛ تختفي بإغلاق النافذة.
 */
@Component({
  selector: 'app-temporary-password-dialog',
  imports: [Modal, Icon],
  template: `
    <app-modal title="كلمة المرور المؤقتة" (closed)="closed.emit()">
      <div class="form">
        <p>
          كلمة المرور المؤقتة للموظف <strong>{{ staffName() }}</strong>.
          ابعتها له، وهيُطلب منه تغييرها أول ما يدخل.
        </p>

        <div class="secret">
          <input #secret class="input mono" dir="ltr" readonly [value]="password()" (focus)="secret.select()" />
          <button type="button" class="btn btn--primary" (click)="copy(secret)">
            <app-icon [name]="copied() ? 'check' : 'copy'" /> {{ copied() ? 'تم النسخ' : 'نسخ' }}
          </button>
        </div>

        <div class="alert alert--warn">
          <app-icon name="alert" />
          <span>لن تظهر كلمة المرور مرة أخرى بعد إغلاق هذه النافذة.</span>
        </div>

        <div class="form__actions">
          <button type="button" class="btn btn--ghost" (click)="closed.emit()">تم</button>
        </div>
      </div>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporaryPasswordDialog {
  readonly staffName = input.required<string>();
  readonly password = input.required<string>();
  readonly closed = output<void>();

  protected readonly copied = signal(false);

  protected async copy(field: HTMLInputElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password());
      this.copied.set(true);
    } catch {
      // الحافظة غير متاحة: نحدّد النص ليُنسخ يدويًا.
      field.select();
    }
  }
}
