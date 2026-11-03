import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LiveEventsService } from '../../core/live-events.service';
import { RoleCatalog, Staff, StaffRole, StaffStatus } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Option, STAFF_STATUS_LABELS } from '../../shared/labels';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { FilterTabs } from '../../shared/ui/filter-tabs';
import { Icon } from '../../shared/ui/icon';
import { PaginationBar } from '../../shared/ui/pagination';
import { SearchBox } from '../../shared/ui/search-box';
import { StaffCreated, StaffForm } from './staff-form';
import { StaffStatusDialog } from './staff-status-dialog';
import { TemporaryPasswordDialog } from './temporary-password-dialog';

type StatusFilter = StaffStatus | '';

/** `undefined` = النموذج مغلق، `null` = إضافة، كائن = تعديل */
type FormTarget = Staff | null | undefined;

interface IssuedPassword {
  staffName: string;
  password: string;
}

@Component({
  selector: 'app-staff-page',
  imports: [
    FilterTabs,
    SearchBox,
    PaginationBar,
    Icon,
    StaffForm,
    StaffStatusDialog,
    TemporaryPasswordDialog,
    RiyadhDatePipe,
  ],
  templateUrl: './staff-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffPage {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly currentUserId = computed(() => this.auth.user()?.id);

  protected readonly tabs: Option<StatusFilter>[] = [
    { value: '', label: 'الكل' },
    { value: 'ACCEPTED', label: STAFF_STATUS_LABELS.ACCEPTED },
    { value: 'SUSPENDED', label: STAFF_STATUS_LABELS.SUSPENDED },
  ];
  protected readonly statusLabels = STAFF_STATUS_LABELS;

  protected readonly status = signal<StatusFilter>('');
  protected readonly role = signal<StaffRole | ''>('');
  private readonly search = signal('');

  protected readonly catalog = signal<RoleCatalog | null>(null);
  protected readonly formTarget = signal<FormTarget>(undefined);
  protected readonly statusTarget = signal<Staff | null>(null);
  /** تعيش فقط ما دامت نافذة كلمة المرور مفتوحة. */
  protected readonly issuedPassword = signal<IssuedPassword | null>(null);
  protected readonly busyId = signal<string | null>(null);

  protected readonly list = new PagedList<Staff>((page) =>
    this.api.listStaff({ page, role: this.role(), status: this.status(), search: this.search() }),
  );

  constructor() {
    this.list.load();
    this.api.roles().subscribe({
      next: (catalog) => this.catalog.set(catalog),
      error: (err) => this.toast.error(errorMessage(err)),
    });

    inject(LiveEventsService)
      .on('ready', 'staff.created', 'staff.updated', 'staff.status_changed')
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.list.reload());
  }

  protected setStatus(status: string): void {
    this.status.set(status as StatusFilter);
    this.list.load();
  }

  protected setRole(role: string): void {
    this.role.set(role as StaffRole | '');
    this.list.load();
  }

  protected setSearch(term: string): void {
    this.search.set(term);
    this.list.load();
  }

  protected onCreated({ staff, temporaryPassword }: StaffCreated): void {
    this.formTarget.set(undefined);
    this.issuedPassword.set({ staffName: staff.fullName, password: temporaryPassword });
    this.list.reload();
  }

  protected onUpdated(): void {
    this.formTarget.set(undefined);
    this.list.reload();
  }

  protected onStatusChanged(): void {
    this.statusTarget.set(null);
    this.list.reload();
  }

  protected resetPassword(staff: Staff): void {
    const message = `إعادة تعيين كلمة المرور لـ "${staff.fullName}"؟\nسيتم تسجيل خروجه من كل أجهزته، وستظهر لك كلمة مرور مؤقتة جديدة.`;
    if (!confirm(message)) return;

    this.busyId.set(staff.id);
    this.api.resetStaffPassword(staff.id).subscribe({
      next: ({ temporaryPassword }) => {
        this.busyId.set(null);
        this.issuedPassword.set({ staffName: staff.fullName, password: temporaryPassword });
        this.list.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
