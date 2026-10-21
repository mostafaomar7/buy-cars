import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { MemberField, MemberUpdate, User } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { GENDER_LABELS, MARITAL_LABELS, toOptions } from '../../shared/labels';

/** الحقول التي يمكن مسحها بإرسال `null`. */
const NULLABLE: ReadonlySet<MemberField> = new Set([
  'phone',
  'dateOfBirth',
  'nationality',
  'gender',
  'maritalStatus',
  'educationLevel',
]);

@Component({
  selector: 'app-member-form',
  imports: [ReactiveFormsModule],
  templateUrl: './member-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberForm implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  readonly member = input.required<User>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly genders = toOptions(GENDER_LABELS);
  protected readonly maritalStatuses = toOptions(MARITAL_LABELS);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    nationalId: ['', Validators.required],
    phone: [''],
    dateOfBirth: [''],
    nationality: [''],
    gender: [''],
    maritalStatus: [''],
    educationLevel: [''],
  });

  ngOnInit(): void {
    const member = this.member();
    for (const field of this.fields()) {
      this.form.controls[field].setValue(member[field] ?? '');
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const changes = this.changes();
    if (Object.keys(changes).length === 0) {
      this.toast.info('لا توجد تغييرات');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.api
      .updateMember(this.member().id, changes)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('تم حفظ البيانات');
          this.saved.emit();
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  /** نرسل فقط الحقول التي تغيّرت، والفارغ من الحقول الاختيارية يُرسل `null`. */
  private changes(): MemberUpdate {
    const value = this.form.getRawValue();
    const member = this.member();
    const changes: MemberUpdate = {};

    for (const field of this.fields()) {
      const next = value[field].trim();
      if (next === (member[field] ?? '')) continue;
      changes[field] = next === '' && NULLABLE.has(field) ? null : next;
    }
    return changes;
  }

  private fields(): MemberField[] {
    return Object.keys(this.form.controls) as MemberField[];
  }
}
