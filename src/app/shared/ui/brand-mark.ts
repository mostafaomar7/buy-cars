import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** شعار هندسي بسيط بألوان الهوية. */
@Component({
  selector: 'app-brand-mark',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="var(--bg)" />
      <path d="M6 24a18 18 0 0 1 18-18v18z" fill="var(--green-500)" />
      <path d="M24 6a18 18 0 0 1 18 18H24z" fill="var(--green-700)" />
      <path d="M6 24h18v18A18 18 0 0 1 6 24z" fill="var(--green-900)" />
      <circle cx="33" cy="33" r="6" fill="var(--green-500)" />
    </svg>
  `,
  host: { class: 'brand-mark' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandMark {
  readonly size = input(40);
}
