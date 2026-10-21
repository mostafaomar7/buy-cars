import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorCode, errorMessage } from '../../core/api-error';
import { LiveEventsService } from '../../core/live-events.service';
import { Session } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { PLATFORM_LABELS } from '../../shared/labels';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-member-sessions',
  imports: [Icon, RiyadhDatePipe],
  templateUrl: './member-sessions.html',
  host: { class: 'card' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSessions implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  readonly userId = input.required<string>();
  readonly changed = output<void>();

  protected readonly platforms = PLATFORM_LABELS;
  protected readonly sessions = signal<Session[]>([]);
  protected readonly includeInactive = signal(false);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly activeCount = computed(() => this.sessions().filter((s) => s.active).length);

  constructor() {
    inject(LiveEventsService)
      .on('session.created', 'session.revoked')
      .pipe(
        filter((event) => event.data['userId'] === this.userId()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected toggleInactive(include: boolean): void {
    this.includeInactive.set(include);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api
      .memberSessions(this.userId(), this.includeInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.error.set(null);
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  protected revoke(session: Session): void {
    if (!confirm(`إنهاء الجلسة على "${session.deviceName ?? 'هذا الجهاز'}"؟`)) return;

    this.busy.set(true);
    this.api
      .revokeSession(session.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('تم إنهاء الجلسة');
          this.afterChange();
        },
        error: (err) => {
          this.toast.error(errorMessage(err));
          if (errorCode(err) === 'SESSION_ALREADY_REVOKED') this.load();
        },
      });
  }

  protected logoutAll(): void {
    const message =
      'سيتم تسجيل خروج العضو من كل الأجهزة.\nيستطيع الدخول مرة أخرى؛ لمنعه من الدخول استخدم "تغيير الحالة ← إيقاف".';
    if (!confirm(message)) return;

    this.busy.set(true);
    this.api
      .logoutMember(this.userId())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: ({ revokedSessions }) => {
          this.toast.success(`تم تسجيل الخروج من ${revokedSessions} جلسة`);
          this.afterChange();
        },
        error: (err) => this.toast.error(errorMessage(err)),
      });
  }

  private afterChange(): void {
    this.load();
    this.changed.emit();
  }
}
