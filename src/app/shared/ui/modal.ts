import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `
    <div class="modal__backdrop" (click)="closed.emit()"></div>
    <section class="modal" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="modal__header">
        <h2>{{ title() }}</h2>
        <button type="button" class="icon-btn" aria-label="إغلاق" (click)="closed.emit()">
          <app-icon name="close" />
        </button>
      </header>
      <div class="modal__body"><ng-content /></div>
    </section>
  `,
  host: { class: 'modal-host', '(document:keydown.escape)': 'closed.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  readonly title = input.required<string>();
  readonly closed = output<void>();
}
