import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

/** صورة العضو (رابط موقّع) مع بديل بالأحرف الأولى عند غيابها أو انتهاء صلاحيتها. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" alt="" (error)="failed.set(true)" />
    } @else {
      <span>{{ initials() }}</span>
    }
  `,
  host: {
    class: 'avatar',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.38',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar {
  readonly src = input<string | null>(null);
  readonly name = input('');
  readonly size = input(40);

  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });

  protected readonly initials = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join(''),
  );
}
