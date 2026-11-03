import { Routes } from '@angular/router';
import { authGuard, guestGuard, passwordChangeGuard, permissionGuard } from './core/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'تسجيل الدخول',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'change-password',
    title: 'تغيير كلمة المرور',
    canActivate: [passwordChangeGuard],
    loadComponent: () => import('./features/change-password/change-password-page').then((m) => m.ChangePasswordPage),
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
        canActivate: [permissionGuard('dashboard.view')],
        loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'requests',
        title: 'طلبات الانضمام',
        canActivate: [permissionGuard('requests.view')],
        loadComponent: () => import('./features/requests/requests-page').then((m) => m.RequestsPage),
      },
      {
        path: 'requests/:id',
        title: 'تفاصيل الطلب',
        canActivate: [permissionGuard('requests.view')],
        loadComponent: () => import('./features/requests/request-detail-page').then((m) => m.RequestDetailPage),
      },
      {
        path: 'members',
        title: 'الأعضاء',
        canActivate: [permissionGuard('members.view')],
        loadComponent: () => import('./features/members/members-page').then((m) => m.MembersPage),
      },
      {
        path: 'members/:id',
        title: 'صفحة العضو',
        canActivate: [permissionGuard('members.view')],
        loadComponent: () => import('./features/members/member-detail-page').then((m) => m.MemberDetailPage),
      },
      {
        path: 'preapproved',
        title: 'المعتمدون مسبقًا',
        canActivate: [permissionGuard('preapproved.view')],
        loadComponent: () => import('./features/preapproved/preapproved-page').then((m) => m.PreapprovedPage),
      },
      {
        path: 'audit-logs',
        title: 'سجل العمليات',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: () => import('./features/audit-logs/audit-logs-page').then((m) => m.AuditLogsPage),
      },
      {
        path: 'staff',
        title: 'الموظفون',
        canActivate: [permissionGuard('staff.manage')],
        loadComponent: () => import('./features/staff/staff-page').then((m) => m.StaffPage),
      },
      {
        path: 'no-access',
        title: 'لا توجد صلاحيات',
        loadComponent: () => import('./features/no-access/no-access-page').then((m) => m.NoAccessPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
