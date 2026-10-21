import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { LiveEventsService } from '../../core/live-events.service';
import { AccessRequest, RequestStatus } from '../../core/models';
import { Option } from '../../shared/labels';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { FilterTabs } from '../../shared/ui/filter-tabs';
import { Icon } from '../../shared/ui/icon';
import { PaginationBar } from '../../shared/ui/pagination';
import { SearchBox } from '../../shared/ui/search-box';
import { StatusBadge } from '../../shared/ui/status-badge';

type StatusFilter = RequestStatus | '';

@Component({
  selector: 'app-requests-page',
  imports: [RouterLink, Avatar, StatusBadge, FilterTabs, SearchBox, PaginationBar, Icon, RiyadhDatePipe],
  templateUrl: './requests-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage {
  private readonly api = inject(AdminApi);

  protected readonly tabs: Option<StatusFilter>[] = [
    { value: 'PENDING', label: 'معلقة' },
    { value: 'ACCEPTED', label: 'مقبولة' },
    { value: 'REJECTED', label: 'مرفوضة' },
    { value: '', label: 'الكل' },
  ];

  protected readonly status = signal<StatusFilter>('PENDING');
  private readonly search = signal('');

  protected readonly list = new PagedList<AccessRequest>((page) =>
    this.api.listRequests({ status: this.status(), search: this.search(), page }),
  );

  constructor() {
    this.list.load();
    inject(LiveEventsService)
      .on('ready', 'access_request.created', 'access_request.decided')
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
