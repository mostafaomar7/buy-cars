import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { errorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Modal } from '../shared/ui/modal';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { newPassword, confirm } = group.value;
  return newPassword === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password-dialog',
  imports: [Modal, ReactiveFormsModule],
  template: `
    <app-modal title="تغيير كلمة المرور" (closed)="closed.emit()">
      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field">
          <span>كلمة المرور الحالية</span>
          <input class="input" type="password" formControlName="currentPassword" autocomplete="current-password" />
        </label>
        <label class="field">
          <span>كلمة المرور الجديدة</span>
          <input class="input" type="password" formControlName="newPassword" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>تأكيد كلمة المرور الجديدة</span>
          <input class="input" type="password" formControlName="confirm" autocomplete="new-password" />
          @if (form.hasError('mismatch') && form.controls.confirm.touched) {
            <small class="field__error">كلمتا المرور غير متطابقتين</small>
          }
        </label>
        @if (error(); as error) { <div class="alert alert--error">{{ error }}</div> }
        <div class="form__actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">حفظ</button>
          <button type="button" class="btn btn--ghost" (click)="closed.emit()">إلغاء</button>
        </div>
      </form>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialog {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly closed = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.auth
      .changePassword(currentPassword, newPassword)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('تم تغيير كلمة المرور');
          this.closed.emit();
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }
}
