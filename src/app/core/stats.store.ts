import { Injectable, inject, signal } from '@angular/core';
import { AdminApi } from './admin-api.service';
import { Stats } from './models';

/** إحصائيات مشتركة بين الصفحة الرئيسية وعداد الطلبات في القائمة الجانبية. */
@Injectable({ providedIn: 'root' })
export class StatsStore {
  private readonly api = inject(AdminApi);

  readonly stats = signal<Stats | null>(null);

  refresh(): void {
    this.api.stats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => undefined,
    });
  }
}
