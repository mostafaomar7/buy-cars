import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { errorMessage } from '../../core/api-error';
import { Preapproved } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Option } from '../../shared/labels';
import { PagedList } from '../../shared/paged-list';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { FilterTabs } from '../../shared/ui/filter-tabs';
import { Icon } from '../../shared/ui/icon';
import { PaginationBar } from '../../shared/ui/pagination';
import { SearchBox } from '../../shared/ui/search-box';
import { PreapprovedForm } from './preapproved-form';

type ConsumedFilter = 'open' | 'consumed';

/** `undefined` = النموذج مغلق، `null` = إضافة، كائن = تعديل */
type FormTarget = Preapproved | null | undefined;

@Component({
  selector: 'app-preapproved-page',
  imports: [RouterLink, FilterTabs, SearchBox, PaginationBar, Icon, PreapprovedForm, RiyadhDatePipe],
  templateUrl: './preapproved-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreapprovedPage {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  protected readonly tabs: Option<ConsumedFilter>[] = [
    { value: 'open', label: 'لم يسجلوا بعد' },
    { value: 'consumed', label: 'سجّلوا بالفعل' },
  ];

  protected readonly filter = signal<ConsumedFilter>('open');
  protected readonly formTarget = signal<FormTarget>(undefined);
  private readonly search = signal('');

  protected readonly list = new PagedList<Preapproved>((page) =>
    this.api.listPreapproved({ consumed: this.filter() === 'consumed', search: this.search(), page }),
  );

  constructor() {
    this.list.load();
  }

  protected setFilter(value: string): void {
    this.filter.set(value as ConsumedFilter);
    this.list.load();
  }

  protected setSearch(term: string): void {
    this.search.set(term);
    this.list.load();
  }

  protected onSaved(): void {
    this.formTarget.set(undefined);
    this.list.reload();
  }

  protected remove(entry: Preapproved): void {
    if (!confirm(`حذف رقم الهوية ${entry.nationalId} من المعتمدين مسبقًا؟`)) return;

    this.api.deletePreapproved(entry.id).subscribe({
      next: () => {
        this.toast.success('تم الحذف');
        this.list.reload();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
