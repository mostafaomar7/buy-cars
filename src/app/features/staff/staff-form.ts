import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { RoleCatalog, Staff, StaffInput, StaffRole } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Modal } from '../../shared/ui/modal';

export interface StaffCreated {
  staff: Staff;
  temporaryPassword: string;
}

@Component({
  selector: 'app-staff-form',
  imports: [Modal, ReactiveFormsModule],
  templateUrl: './staff-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffForm implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  /** `null` = إضافة موظف جديد */
  readonly staff = input<Staff | null>(null);
  readonly catalog = input.required<RoleCatalog>();
  readonly closed = output<void>();
  readonly created = output<StaffCreated>();
  readonly updated = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as StaffRole | '', Validators.required],
  });

  /** الأدوار التي يملك المستخدم الحالي منحها فقط. */
  protected readonly roles = computed(() => this.catalog().roles.filter((role) => role.assignable));

  private readonly selectedRole = toSignal(this.form.controls.role.valueChanges, { initialValue: '' });

  /** صلاحيات الدور المختار بأسمائها العربية. */
  protected readonly selectedPermissions = computed(() => {
    const role = this.catalog().roles.find((r) => r.key === this.selectedRole());
    const labels = new Map(this.catalog().permissions.map((p) => [p.key, p.label]));
    return role?.permissions.map((key) => labels.get(key) ?? key) ?? [];
  });

  ngOnInit(): void {
    const staff = this.staff();
    if (staff) this.form.setValue({ fullName: staff.fullName, email: staff.email, role: staff.role });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const staff = this.staff();
    if (staff) {
      this.update(staff);
    } else {
      this.create();
    }
  }

  private create(): void {
    this.run(this.api.createStaff(this.value()), (result) => this.created.emit(result));
  }

  /** نرسل الحقول المتغيّرة فقط، وتغيير الدور يحتاج تأكيدًا لأنه يُخرج الموظف من أجهزته. */
  private update(staff: Staff): void {
    const value = this.value();
    const changes: Partial<StaffInput> = {};
    if (value.fullName !== staff.fullName) changes.fullName = value.fullName;
    if (value.email !== staff.email) changes.email = value.email;
    if (value.role !== staff.role) changes.role = value.role;

    if (Object.keys(changes).length === 0) {
      this.toast.info('لا توجد تغييرات');
      return;
    }
    if (changes.role && !confirm('تغيير الدور سيُخرج الموظف من كل أجهزته فورًا. متابعة؟')) return;

    this.run(this.api.updateStaff(staff.id, changes), ({ revokedSessions }) => {
      const sessions = revokedSessions ? ` وتسجيل خروجه من ${revokedSessions} جلسة` : '';
      this.toast.success(`تم حفظ التعديلات${sessions}`);
      this.updated.emit();
    });
  }

  private value(): StaffInput {
    const { fullName, email, role } = this.form.getRawValue();
    return { fullName: fullName.trim(), email: email.trim(), role: role as StaffRole };
  }

  private run<T>(request$: Observable<T>, onSuccess: (result: T) => void): void {
    this.saving.set(true);
    this.error.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: onSuccess,
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
