import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  protected readonly describe = describeEvent;

  protected link(event: LiveEvent): string[] | null {
    if (event.type === 'access_request.created' && !event.data['autoApproved']) {
      return ['/requests', event.data['requestId']];
    }
    return event.data['userId'] && event.data['role'] !== 'ADMIN' ? ['/members', event.data['userId']] : null;
  }
}
