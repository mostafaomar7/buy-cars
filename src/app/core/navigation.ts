import type { IconName } from '../shared/ui/icon';
import { Permission } from './models';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  permission: Permission;
  exact?: boolean;
}

/** صفحات الداشبورد والصلاحية المطلوبة لكل صفحة. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'home', permission: 'dashboard.view', exact: true },
  { path: '/requests', label: 'طلبات الانضمام', icon: 'inbox', permission: 'requests.view' },
  { path: '/members', label: 'الأعضاء', icon: 'users', permission: 'members.view' },
  { path: '/preapproved', label: 'المعتمدون مسبقًا', icon: 'shield', permission: 'preapproved.view' },
  { path: '/audit-logs', label: 'سجل العمليات', icon: 'history', permission: 'audit.view' },
  { path: '/staff', label: 'الموظفون', icon: 'staff', permission: 'staff.manage' },
];

/** أول صفحة يملك الموظف صلاحيتها. */
export function landingPath(can: (permission: Permission) => boolean): string {
  return NAV_ITEMS.find((item) => can(item.permission))?.path ?? '/no-access';
}
