import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { LiveEventsService } from '../../core/live-events.service';
import { MembershipStatus, User } from '../../core/models';
import { Option, STATUS_LABELS, toOptions } from '../../shared/labels';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { FilterTabs } from '../../shared/ui/filter-tabs';
import { Icon } from '../../shared/ui/icon';
import { PaginationBar } from '../../shared/ui/pagination';
import { SearchBox } from '../../shared/ui/search-box';
import { StatusBadge } from '../../shared/ui/status-badge';

type StatusFilter = MembershipStatus | '';

@Component({
  selector: 'app-members-page',
  imports: [RouterLink, Avatar, StatusBadge, FilterTabs, SearchBox, PaginationBar, Icon, RiyadhDatePipe],
  templateUrl: './members-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersPage {
  private readonly api = inject(AdminApi);

  protected readonly tabs: Option<StatusFilter>[] = [{ value: '', label: 'الكل' }, ...toOptions(STATUS_LABELS)];
  protected readonly status = signal<StatusFilter>('');
  private readonly search = signal('');

  protected readonly list = new PagedList<User>((page) =>
    this.api.listMembers({ status: this.status(), search: this.search(), page }),
  );

  constructor() {
    this.list.load();
    inject(LiveEventsService)
      .on('ready', 'access_request.created', 'member.status_changed', 'member.updated')
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.list.reload());
  }

  protected setStatus(status: string): void {
    this.status.set(status as StatusFilter);
    this.list.load();
  }

  protected setSearch(term: string): void {
    this.search.set(term);
    this.list.load();
  }
}
