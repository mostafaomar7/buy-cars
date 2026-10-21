import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Pagination } from '../../core/models';

@Component({
  selector: 'app-pagination',
  template: `
    @if (pagination(); as p) {
      <span class="muted">{{ p.total }} نتيجة · صفحة {{ p.page }} من {{ p.pages || 1 }}</span>
      <div class="pager__actions">
        <button type="button" class="btn btn--ghost btn--sm" [disabled]="p.page <= 1"
                (click)="pageChange.emit(p.page - 1)">السابق</button>
        <button type="button" class="btn btn--ghost btn--sm" [disabled]="p.page >= p.pages"
                (click)="pageChange.emit(p.page + 1)">التالي</button>
      </div>
    }
  `,
  host: { class: 'pager' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationBar {
  readonly pagination = input<Pagination | null>(null);
  readonly pageChange = output<number>();
}
