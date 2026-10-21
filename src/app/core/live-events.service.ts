import { Injectable, inject, signal } from '@angular/core';
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import { Observable, Subject, filter } from 'rxjs';
import { API_URL } from './api.service';
import { AuthService } from './auth.service';

export type LiveEventType =
  | 'ready'
  | 'access_request.created'
  | 'session.created'
  | 'access_request.decided'
  | 'member.status_changed'
  | 'member.updated'
  | 'session.revoked';

export interface LiveEvent {
  type: LiveEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  receivedAt: Date;
}

export type LiveStatus = 'off' | 'connecting' | 'live';

const RETRY_MS = 5000;
const FEED_SIZE = 30;

class UnauthorizedError extends Error {}

/**
 * الإشعارات اللحظية من `GET /admin/events` (SSE).
 * EventSource الأصلي لا يدعم الهيدرز، لذلك نستخدم fetch-event-source.
 */
@Injectable({ providedIn: 'root' })
export class LiveEventsService {
  private readonly auth = inject(AuthService);
  private readonly events$ = new Subject<LiveEvent>();
  private controller: AbortController | null = null;

  readonly status = signal<LiveStatus>('off');
  readonly feed = signal<LiveEvent[]>([]);
  readonly unread = signal(0);

  /** الأحداث لا تُعاد بعد الانقطاع، لذلك استمع لـ `ready` لإعادة تحميل البيانات. */
  on(...types: LiveEventType[]): Observable<LiveEvent> {
    return this.events$.pipe(filter((event) => types.includes(event.type)));
  }

  connect(): void {
    const token = this.auth.token();
    if (!token || this.controller) return;

    const controller = new AbortController();
    this.controller = controller;
    this.status.set('connecting');

    fetchEventSource(`${API_URL}/admin/events`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      openWhenHidden: true,
      onopen: async (res) => {
        if (res.status === 401 || res.status === 403) throw new UnauthorizedError();
        if (!res.ok) throw new Error(`SSE ${res.status}`);
        this.status.set('live');
      },
      onmessage: (message) => this.handle(message),
      onclose: () => {
        throw new Error('closed'); // أعد الاتصال
      },
      onerror: (err) => {
        if (err instanceof UnauthorizedError) {
          this.disconnect();
          this.auth.clearSession();
          throw err; // يوقف إعادة المحاولة
        }
        this.status.set('connecting');
        return RETRY_MS;
      },
    }).catch(() => undefined);
  }

  disconnect(): void {
    this.controller?.abort();
    this.controller = null;
    this.status.set('off');
    this.feed.set([]);
    this.unread.set(0);
  }

  markRead(): void {
    this.unread.set(0);
  }

  private handle(message: EventSourceMessage): void {
    if (!message.event) return;

    const event: LiveEvent = {
      type: message.event as LiveEventType,
      data: parse(message.data),
      receivedAt: new Date(),
    };

    if (event.type !== 'ready') {
      this.feed.update((feed) => [event, ...feed].slice(0, FEED_SIZE));
      this.unread.update((n) => n + 1);
    }
    this.events$.next(event);
  }
}

function parse(data: string): Record<string, unknown> {
  try {
    return JSON.parse(data) ?? {};
  } catch {
    return {};
  }
}
