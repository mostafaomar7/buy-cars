import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { LiveEvent, LiveEventsService } from '../core/live-events.service';
import { describeEvent } from '../shared/labels';
import { RiyadhDatePipe } from '../shared/riyadh-date.pipe';

/** قائمة آخر الأحداث اللحظية؛ كل حدث يخص عضوًا يفتح صفحته. */
@Component({
  selector: 'app-live-feed',
  imports: [RouterLink, RiyadhDatePipe],
  template: `
    @for (event of live.feed(); track $index) {
      <a class="feed-item" [attr.data-type]="event.type" [routerLink]="link(event)">
        <span class="feed-item__dot"></span>
        <span class="feed-item__text">{{ describe(event) }}</span>
        <time class="muted">{{ event.receivedAt | riyadhDate: 'time' }}</time>
      </a>
    } @empty {
      <p class="empty">لا توجد إشعارات بعد. ستظهر هنا الأحداث لحظة وقوعها.</p>
    }
  `,
  host: { class: 'feed' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveFeed {
  protected readonly live = inject(LiveEventsService);
  private readonly can = inject(AuthService).can;
  protected readonly describe = describeEvent;

  /** رابط الحدث، فقط لو الموظف يملك صلاحية الصفحة. */
  protected link({ type, data }: LiveEvent): string[] | null {
    if (type.startsWith('staff.')) return this.can('staff.manage') ? ['/staff'] : null;
    if (type === 'access_request.created' && !data['autoApproved']) {
      return this.can('requests.view') ? ['/requests', data['requestId']] : null;
    }
    const isMember = data['userId'] && (data['role'] ?? 'USER') === 'USER';
    return isMember && this.can('members.view') ? ['/members', data['userId']] : null;
  }
}
