import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AuditLog } from '../../core/models';
import { AUDIT_ACTION_LABELS, describeAudit } from '../../shared/labels';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { PaginationBar } from '../../shared/ui/pagination';

@Component({
  selector: 'app-audit-logs-page',
  imports: [RouterLink, PaginationBar, RiyadhDatePipe],
  templateUrl: './audit-logs-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsPage {
  private readonly api = inject(AdminApi);

  /** من `?targetUserId=` (رابط "سجل العمليات" في صفحة العضو) */
  readonly targetUserId = input<string>();

  protected readonly actions = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }));
  protected readonly actionLabel = (action: string) => AUDIT_ACTION_LABELS[action] ?? action;
  protected readonly describe = describeAudit;
  protected readonly action = signal('');

  protected readonly list = new PagedList<AuditLog>((page) =>
    this.api.auditLogs({ page, action: this.action(), targetUserId: this.targetUserId() }),
  );

  constructor() {
    // يعيد التحميل عند فتح الصفحة وعند تغيّر فلتر العضو في الرابط.
    effect(() => {
      this.targetUserId();
      untracked(() => this.list.load());
    });
  }

  protected setAction(action: string): void {
    this.action.set(action);
    this.list.load();
  }
}
