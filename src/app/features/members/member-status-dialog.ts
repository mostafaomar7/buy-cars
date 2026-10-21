import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { ChangeableStatus, User } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { STATUS_LABELS } from '../../shared/labels';
import { Modal } from '../../shared/ui/modal';

const ACTIONS: { value: ChangeableStatus; label: string; hint: string }[] = [
  { value: 'ACCEPTED', label: 'تفعيل', hint: 'يستطيع العضو الدخول إلى التطبيق' },
  { value: 'SUSPENDED', label: 'إيقاف مؤقت', hint: 'يُسجَّل خروجه من كل الأجهزة ويُمنع من الدخول' },
  { value: 'REJECTED', label: 'رفض', hint: 'يُسجَّل خروجه من كل الأجهزة ويُمنع من الدخول' },
];

@Component({
  selector: 'app-member-status-dialog',
  imports: [Modal, ReactiveFormsModule],
  template: `
    <app-modal title="تغيير حالة العضو" (closed)="closed.emit()">
      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <p class="muted">الحالة الحالية: {{ currentLabel() }}</p>

        <div class="choice-list">
          @for (action of actions(); track action.value) {
            <label class="choice" [attr.data-status]="action.value">
              <input type="radio" formControlName="status" [value]="action.value" />
              <span>
                <strong>{{ action.label }}</strong>
                <small class="muted">{{ action.hint }}</small>
              </span>
            </label>
          }
        </div>

        <label class="field">
          <span>السبب (اختياري)</span>
          <textarea class="input" rows="2" formControlName="reason" maxlength="500"></textarea>
        </label>

        @if (error(); as error) { <div class="alert alert--error">{{ error }}</div> }

        <div class="form__actions">
          <button type="submit" class="btn btn--primary" [disabled]="form.invalid || saving()">تأكيد</button>
          <button type="button" class="btn btn--ghost" (click)="closed.emit()">إلغاء</button>
        </div>
      </form>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberStatusDialog {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  readonly member = input.required<User>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  protected readonly actions = computed(() => ACTIONS.filter((a) => a.value !== this.member().membershipStatus));
  protected readonly currentLabel = computed(() => STATUS_LABELS[this.member().membershipStatus]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    status: ['' as ChangeableStatus | '', Validators.required],
    reason: ['', Validators.maxLength(500)],
  });

  protected submit(): void {
    const { status, reason } = this.form.getRawValue();
    if (!status) return;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .changeMemberStatus(this.member().id, status, reason.trim() || undefined)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: ({ revokedSessions }) => {
          const sessions = revokedSessions ? ` وإنهاء ${revokedSessions} جلسة` : '';
          this.toast.success(`تم تغيير الحالة إلى "${STATUS_LABELS[status]}"${sessions}`);
          this.changed.emit();
          this.closed.emit();
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }
}
