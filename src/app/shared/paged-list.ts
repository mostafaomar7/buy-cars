import { signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { errorMessage } from '../core/api-error';
import { Page, Pagination } from '../core/models';

/** حالة قائمة مقسّمة لصفحات: العناصر + التحميل + الخطأ. */
export class PagedList<T> {
  readonly items = signal<T[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private subscription?: Subscription;

  constructor(private readonly fetchPage: (page: number) => Observable<Page<T>>) {}

  load(page = 1): void {
    this.subscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.subscription = this.fetchPage(page).subscribe({
      next: ({ items, pagination }) => {
        this.items.set(items);
        this.pagination.set(pagination);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.load(this.pagination()?.page ?? 1);
  }
}
