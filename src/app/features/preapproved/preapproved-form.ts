import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize, map } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { Preapproved, PreapprovedInput, PreapprovedResult } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';

type Field = keyof PreapprovedInput;

@Component({
  selector: 'app-preapproved-form',
  imports: [Modal, ReactiveFormsModule, Icon],
  templateUrl: './preapproved-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreapprovedForm implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  /** `null` = إضافة سجل جديد */
  readonly entry = input<Preapproved | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nationalId: ['', Validators.required],
    fullName: [''],
    phone: [''],
    dateOfBirth: [''],
    note: [''],
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** رقم الهوية وحده = أي شخص يعرفه يُقبل تلقائيًا. */
  protected readonly weakMatch = computed(() => !this.value().phone?.trim() && !this.value().dateOfBirth);

  ngOnInit(): void {
    const entry = this.entry();
    if (entry) {
      this.form.setValue({
        nationalId: entry.nationalId,
        fullName: entry.fullName ?? '',
        phone: entry.phone ?? '',
        dateOfBirth: entry.dateOfBirth ?? '',
        note: entry.note ?? '',
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const entry = this.entry();
    const request$: Observable<string> = entry
      ? this.api.updatePreapproved(entry.id, this.changes(entry)).pipe(map(() => 'تم حفظ التعديلات'))
      : this.api.createPreapproved(this.newEntry()).pipe(map(createdMessage));

    this.saving.set(true);
    this.error.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (message) => {
        this.toast.success(message);
        this.saved.emit();
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private newEntry(): PreapprovedInput {
    const value = this.form.getRawValue();
    const input: PreapprovedInput = {};
    for (const field of Object.keys(value) as Field[]) {
      const text = value[field].trim();
      if (text) input[field] = text;
    }
    return input;
  }

  private changes(entry: Preapproved): PreapprovedInput {
    const value = this.form.getRawValue();
    const changes: PreapprovedInput = {};
    for (const field of Object.keys(value) as Field[]) {
      const text = value[field].trim();
      if (text !== (entry[field] ?? '')) changes[field] = text || null;
    }
    return changes;
  }
}

function createdMessage({ autoApproved, matchedUserId }: PreapprovedResult): string {
  if (autoApproved) return 'تمت الإضافة، وتم قبول طلبه المعلق تلقائيًا';
  if (matchedUserId) return 'تمت الإضافة. يوجد طلب معلق بنفس الهوية لكن البيانات مختلفة، راجعه يدويًا';
  return 'تمت الإضافة إلى المعتمدين مسبقًا';
}
