import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    @for (toast of toasts.toasts(); track toast.id) {
      <div [class]="'toast toast--' + toast.kind" role="status" (click)="toasts.dismiss(toast.id)">
        {{ toast.text }}
      </div>
    }
  `,
  host: { class: 'toasts', 'aria-live': 'polite' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
