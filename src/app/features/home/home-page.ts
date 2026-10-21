import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { LiveEventsService } from '../../core/live-events.service';
import { AccessRequest } from '../../core/models';
import { StatsStore } from '../../core/stats.store';
import { LiveFeed } from '../../layout/live-feed';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Avatar } from '../../shared/ui/avatar';

interface StatCard {
  label: string;
  value: number;
  tone: 'green' | 'mid' | 'dark' | 'warn' | 'danger';
  link?: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, Avatar, LiveFeed, RiyadhDatePipe],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(AdminApi);
  private readonly statsStore = inject(StatsStore);
  private readonly stats = this.statsStore.stats;

  protected readonly pending = new PagedList<AccessRequest>((page) =>
    this.api.listRequests({ status: 'PENDING', page, limit: 5 }),
  );

  protected readonly cards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'طلبات بانتظار المراجعة', value: s.pendingRequests, tone: 'warn', link: '/requests' },
      { label: 'إجمالي الأعضاء', value: s.members.total, tone: 'dark', link: '/members' },
      { label: 'أعضاء مقبولون', value: s.members.ACCEPTED, tone: 'green' },
      { label: 'أعضاء موقوفون', value: s.members.SUSPENDED, tone: 'danger' },
      { label: 'معتمدون مسبقًا لم يسجلوا', value: s.preapprovedOpen, tone: 'mid', link: '/preapproved' },
      { label: 'جلسات أعضاء نشطة', value: s.activeMemberSessions, tone: 'mid' },
    ];
  });

  constructor() {
    this.statsStore.refresh();
    this.pending.load();
    inject(LiveEventsService)
      .on('ready', 'access_request.created', 'access_request.decided', 'member.status_changed')
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.pending.reload());
  }
}
