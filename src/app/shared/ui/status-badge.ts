import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MembershipStatus } from '../../core/models';
import { STATUS_LABELS } from '../labels';

@Component({
  selector: 'app-status-badge',
  template: `{{ label() }}`,
  host: { '[class]': '"badge badge--" + status().toLowerCase()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<MembershipStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()] ?? this.status());
}
