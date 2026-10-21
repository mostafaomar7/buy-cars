import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Option } from '../labels';

@Component({
  selector: 'app-filter-tabs',
  template: `
    @for (option of options(); track option.value) {
      <button type="button" role="tab" class="tabs__tab"
              [class.is-active]="option.value === value()"
              [attr.aria-selected]="option.value === value()"
              (click)="valueChange.emit(option.value)">
        {{ option.label }}
      </button>
    }
  `,
  host: { class: 'tabs', role: 'tablist' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterTabs {
  readonly options = input.required<Option[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
}
