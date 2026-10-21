import { Pipe, PipeTransform } from '@angular/core';

const LOCALE = 'ar-SA-u-ca-gregory-nu-latn';
const TIME_ZONE = 'Asia/Riyadh';

const FORMATS = {
  datetime: new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }),
  date: new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, dateStyle: 'medium' }),
  time: new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, timeStyle: 'short' }),
};

/** يعرض تواريخ ISO (UTC) بتوقيت السعودية. */
@Pipe({ name: 'riyadhDate' })
export class RiyadhDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: keyof typeof FORMATS = 'datetime'): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : FORMATS[format].format(date);
  }
}
