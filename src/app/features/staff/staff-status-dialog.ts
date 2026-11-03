import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { Staff } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Modal } from '../../shared/ui/modal';

/** إيقاف موظف نشط (مع سبب اختياري) أو إعادة تفعيل موظف موقوف. */
@Component({
  selector: 'app-staff-status-dialog',
  imports: [Modal, ReactiveFormsModule],
  template: `
    <app-modal [title]="suspending() ? 'إيقاف موظف' : 'تفعيل موظف'" (closed)="closed.emit()">
      <div class="form">
        @if (suspending()) {
          <p>
            سيتم إيقاف حساب <strong>{{ staff().fullName }}</strong> وتسجيل خروجه من كل أجهزته،
            ولن يستطيع الدخول حتى يُعاد تفعيله.
          </p>
          <label class="field">
            <span>السبب (اختياري)</span>
            <textarea class="input" rows="2" [formControl]="reason" maxlength="500"></textarea>
          </label>
        } @else {
          <p>سيتمكن <strong>{{ staff().fullName }}</strong> من الدخول إلى لوحة التحكم مرة أخرى.</p>
        }

        @if (error(); as error) {
          <div class="alert alert--error">{{ error }}</div>
        }

        <div class="form__actions">
          <button type="button" [class]="suspending() ? 'btn btn--danger' : 'btn btn--primary'"
                  [disabled]="saving()" (click)="confirm()">
            {{ suspending() ? 'تأكيد الإيقاف' : 'تأكيد التفعيل' }}
          </button>
          <button type="button" class="btn btn--ghost" (click)="closed.emit()">إلغاء</button>
        </div>
      </div>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffStatusDialog {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  readonly staff = input.required<Staff>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  protected readonly suspending = computed(() => this.staff().status === 'ACCEPTED');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reason = new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) });

  protected confirm(): void {
    const suspending = this.suspending();
    const reason = suspending ? this.reason.value.trim() || undefined : undefined;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .changeStaffStatus(this.staff().id, suspending ? 'SUSPENDED' : 'ACCEPTED', reason)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(suspending ? 'تم إيقاف الموظف' : 'تم تفعيل الموظف');
          this.changed.emit();
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }
}
