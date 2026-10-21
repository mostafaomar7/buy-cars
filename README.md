# لوحة إدارة العضويات (Angular)

## التشغيل

```bash
npm install --legacy-peer-deps
npm start            # http://localhost:5173
```

- عنوان الباك إند في `src/environments/environment.ts` (`apiUrl`).
- البورت 5173 مسموح في `CORS_ORIGINS` على الباك إند. لو غيّرته أرسل الـ Origin الجديد لمطوّر الباك إند.

## البنية

```
src/app/
  core/        الاتصال بالـ API، الدخول، الـ interceptor، الإشعارات اللحظية (SSE)، الأنواع
  shared/      المسميات العربية، Pipe التاريخ بتوقيت الرياض، مكونات UI صغيرة
  layout/      الإطار العام (القائمة الجانبية + الشريط العلوي + الإشعارات)
  features/    الصفحات: login, home, requests, members, preapproved, audit-logs
src/styles/    ألوان الهوية (_tokens.scss) وبقية التنسيقات
```
