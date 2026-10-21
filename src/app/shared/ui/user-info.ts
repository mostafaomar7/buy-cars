import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { User } from '../../core/models';
import { GENDER_LABELS, MARITAL_LABELS } from '../labels';
import { RiyadhDatePipe } from '../riyadh-date.pipe';

@Component({
  selector: 'app-user-info',
  imports: [RiyadhDatePipe],
  template: `
    @let u = user();
    <dl class="info-grid">
      <div><dt>رقم الهوية</dt><dd class="mono">{{ u.nationalId }}</dd></div>
      <div><dt>البريد الإلكتروني</dt><dd dir="ltr">{{ u.email }}</dd></div>
      <div><dt>الجوال</dt><dd class="mono" dir="ltr">{{ u.phone ?? '—' }}</dd></div>
      <div>
        <dt>تاريخ الميلاد</dt>
        <dd>{{ u.dateOfBirth ?? '—' }} @if (u.age !== null) { <span class="muted">({{ u.age }} سنة)</span> }</dd>
      </div>
      <div><dt>الجنسية</dt><dd>{{ u.nationality ?? '—' }}</dd></div>
      <div><dt>الجنس</dt><dd>{{ u.gender ? genders[u.gender] : '—' }}</dd></div>
      <div><dt>الحالة الاجتماعية</dt><dd>{{ u.maritalStatus ? marital[u.maritalStatus] : '—' }}</dd></div>
      <div><dt>المستوى التعليمي</dt><dd>{{ u.educationLevel ?? '—' }}</dd></div>
      <div><dt>تاريخ التسجيل</dt><dd>{{ u.createdAt | riyadhDate }}</dd></div>
      <div><dt>تاريخ القبول</dt><dd>{{ u.approvedAt | riyadhDate }}</dd></div>
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserInfo {
  readonly user = input.required<User>();
  protected readonly genders = GENDER_LABELS;
  protected readonly marital = MARITAL_LABELS;
}
