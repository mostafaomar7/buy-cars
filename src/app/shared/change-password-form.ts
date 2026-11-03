import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { errorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';

/** 8 حروف على الأقل وفيها حرف ورقم (نفس شرط الخادم). */
const PASSWORD_RULES = [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*\p{L})(?=.*\d).+$/u)];

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { newPassword, confirm } = group.value;
  return newPassword === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <label class="field">
        <span>كلمة المرور الحالية</span>
        <input class="input" type="password" dir="ltr" formControlName="currentPassword" autocomplete="current-password" />
      </label>
      <label class="field">
        <span>كلمة المرور الجديدة</span>
        <input class="input" type="password" dir="ltr" formControlName="newPassword" autocomplete="new-password" />
        <small [class]="form.controls.newPassword.touched && form.controls.newPassword.invalid ? 'field__error' : 'muted'">
          8 أحرف على الأقل، وتحتوي على حرف ورقم
        </small>
      </label>
      <label class="field">
        <span>تأكيد كلمة المرور الجديدة</span>
        <input class="input" type="password" dir="ltr" formControlName="confirm" autocomplete="new-password" />
        @if (form.hasError('mismatch') && form.controls.confirm.touched) {
          <small class="field__error">كلمتا المرور غير متطابقتين</small>
        }
      </label>

      @if (error(); as error) {
        <div class="alert alert--error">{{ error }}</div>
      }

      <div class="form__actions">
        <button type="submit" class="btn btn--primary" [disabled]="saving()">
          {{ saving() ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور' }}
        </button>
        <ng-content />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordForm {
  private readonly auth = inject(AuthService);

  readonly changed = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', PASSWORD_RULES],
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
        next: () => this.changed.emit(),
        error: (err) => this.error.set(errorMessage(err)),
      });
  }
}
