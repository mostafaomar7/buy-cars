import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { LiveEventsService, LiveStatus } from '../core/live-events.service';
import { StatsStore } from '../core/stats.store';
import { ToastService } from '../core/toast.service';
import { NAV_ITEMS } from '../core/navigation';
import { describeEvent, ROLE_LABELS } from '../shared/labels';
import { Avatar } from '../shared/ui/avatar';
import { Icon } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';
import { ChangePasswordDialog } from './change-password-dialog';
import { LiveFeed } from './live-feed';

const LIVE_LABELS: Record<LiveStatus, string> = {
  live: 'متصل لحظيًا',
  connecting: 'جارٍ الاتصال...',
  off: 'غير متصل',
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo, Avatar, LiveFeed, ChangePasswordDialog],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly statsStore = inject(StatsStore);
  private readonly toast = inject(ToastService);
  protected readonly live = inject(LiveEventsService);

  protected readonly nav = computed(() => NAV_ITEMS.filter((item) => this.auth.can(item.permission)));
  protected readonly can = this.auth.can;
  protected readonly user = this.auth.user;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role && role !== 'USER' ? ROLE_LABELS[role] : '';
  });
  protected readonly pendingCount = computed(() => this.statsStore.stats()?.pendingRequests ?? 0);
  protected readonly liveLabel = computed(() => LIVE_LABELS[this.live.status()]);
  protected readonly navOpen = signal(false);
  protected readonly feedOpen = signal(false);
  protected readonly passwordOpen = signal(false);

  constructor() {
    this.live
      .on('ready', 'access_request.created', 'access_request.decided', 'member.status_changed', 'session.created', 'session.revoked')
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.statsStore.refresh());

    this.live
      .on('access_request.created')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.toast.info(describeEvent(event)));
  }

  /** الإحصائيات والإشعارات اللحظية تحتاج `dashboard.view`. */
  ngOnInit(): void {
    if (!this.auth.can('dashboard.view')) return;
    this.statsStore.refresh();
    this.live.connect();
  }

  ngOnDestroy(): void {
    this.live.disconnect();
  }

  protected toggleFeed(): void {
    this.feedOpen.update((open) => !open);
    this.live.markRead();
  }

  protected logout(): void {
    this.auth.logout();
  }
}
