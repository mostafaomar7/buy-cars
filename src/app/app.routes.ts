import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'تسجيل الدخول',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'الرئيسية',
        loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'requests',
        title: 'طلبات الانضمام',
        loadComponent: () => import('./features/requests/requests-page').then((m) => m.RequestsPage),
      },
      {
        path: 'requests/:id',
        title: 'تفاصيل الطلب',
        loadComponent: () => import('./features/requests/request-detail-page').then((m) => m.RequestDetailPage),
      },
      {
        path: 'members',
        title: 'الأعضاء',
        loadComponent: () => import('./features/members/members-page').then((m) => m.MembersPage),
      },
      {
        path: 'members/:id',
        title: 'صفحة العضو',
        loadComponent: () => import('./features/members/member-detail-page').then((m) => m.MemberDetailPage),
      },
      {
        path: 'preapproved',
        title: 'المعتمدون مسبقًا',
        loadComponent: () => import('./features/preapproved/preapproved-page').then((m) => m.PreapprovedPage),
      },
      {
        path: 'audit-logs',
        title: 'سجل العمليات',
        loadComponent: () => import('./features/audit-logs/audit-logs-page').then((m) => m.AuditLogsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
