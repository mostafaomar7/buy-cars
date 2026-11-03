import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** أبعاد ملف الشعار، ومنطقة الشعار الفعلية داخله (بدون الهوامش الفارغة). */
const SOURCE = { src: 'tarkalna-logo-green-transparent.png', width: 3200, height: 2000 };
const CROP = { x: 590, y: 435, width: 2020, height: 1130 };

/** شعار تركلنا. `tone="light"` يعرضه أبيض للخلفيات الخضراء الغامقة. */
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="width()" [attr.height]="height()" [attr.viewBox]="viewBox" role="img" aria-label="تركلنا">
      <image [attr.href]="source.src" [attr.width]="source.width" [attr.height]="source.height" />
    </svg>
  `,
  host: { class: 'logo', '[class.logo--light]': 'tone() === "light"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  readonly height = input(40);
  readonly tone = input<'brand' | 'light'>('brand');

  protected readonly width = computed(() => Math.round((this.height() * CROP.width) / CROP.height));
  protected readonly source = SOURCE;
  protected readonly viewBox = `${CROP.x} ${CROP.y} ${CROP.width} ${CROP.height}`;
}
