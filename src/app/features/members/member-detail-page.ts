import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, filter, finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LiveEventsService } from '../../core/live-events.service';
import { MemberDetails } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { Icon } from '../../shared/ui/icon';
import { StatusBadge } from '../../shared/ui/status-badge';
import { UserInfo } from '../../shared/ui/user-info';
import { MemberForm } from './member-form';
import { MemberSessions } from './member-sessions';
import { MemberStatusDialog } from './member-status-dialog';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-member-detail-page',
  imports: [
    RouterLink,
    Avatar,
    StatusBadge,
    UserInfo,
    Icon,
    MemberForm,
    MemberSessions,
    MemberStatusDialog,
    RiyadhDatePipe,
  ],
  templateUrl: './member-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailPage implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  protected readonly can = inject(AuthService).can;

  /** من الرابط `/members/:id` */
  readonly id = input.required<string>();

  protected readonly details = signal<MemberDetails | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal(false);
  protected readonly statusDialogOpen = signal(false);
  protected readonly photoBusy = signal(false);

  constructor() {
    inject(LiveEventsService)
      .on('member.status_changed', 'member.updated', 'access_request.decided', 'session.created', 'session.revoked')
      .pipe(
        filter((event) => event.data['userId'] === this.id()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.api.getMember(this.id()).subscribe({
      next: (details) => this.details.set(details),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected onSaved(): void {
    this.editing.set(false);
    this.load();
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      this.toast.error('الصورة يجب أن تكون JPEG أو PNG أو WebP');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      this.toast.error('حجم الصورة أكبر من 5MB');
      return;
    }
    this.updatePhoto(this.api.uploadMemberPhoto(this.id(), file), 'تم تحديث الصورة');
  }

  protected deletePhoto(): void {
    if (!confirm('حذف صورة العضو؟')) return;
    this.updatePhoto(this.api.deleteMemberPhoto(this.id()), 'تم حذف الصورة');
  }

  private updatePhoto(request$: Observable<unknown>, successMessage: string): void {
    this.photoBusy.set(true);
    request$.pipe(finalize(() => this.photoBusy.set(false))).subscribe({
      next: () => {
        this.toast.success(successMessage);
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
