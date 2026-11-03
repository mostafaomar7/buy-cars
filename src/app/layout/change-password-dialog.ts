import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { ChangePasswordForm } from '../shared/change-password-form';
import { Modal } from '../shared/ui/modal';

@Component({
  selector: 'app-change-password-dialog',
  imports: [Modal, ChangePasswordForm],
  template: `
    <app-modal title="تغيير كلمة المرور" (closed)="closed.emit()">
      <app-change-password-form (changed)="onChanged()">
        <button type="button" class="btn btn--ghost" (click)="closed.emit()">إلغاء</button>
      </app-change-password-form>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialog {
  private readonly toast = inject(ToastService);

  readonly closed = output<void>();

  protected onChanged(): void {
    this.toast.success('تم تغيير كلمة المرور');
    this.closed.emit();
  }
}
