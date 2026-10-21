import { ChangeDetectionStrategy, Component, OnDestroy, input, output } from '@angular/core';
import { Icon } from './icon';

const DEBOUNCE_MS = 400;

@Component({
  selector: 'app-search-box',
  imports: [Icon],
  template: `
    <app-icon name="search" />
    <input type="search" [placeholder]="placeholder()" [attr.aria-label]="placeholder()"
           (input)="onInput($any($event.target).value)" />
  `,
  host: { class: 'search-box' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBox implements OnDestroy {
  readonly placeholder = input('بحث...');
  readonly search = output<string>();

  private timer?: ReturnType<typeof setTimeout>;

  protected onInput(value: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search.emit(value.trim()), DEBOUNCE_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
