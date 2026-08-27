
/**
 * usePermissions -- centralised RBAC.
 * Permission matrix:
 *              admin   manager  developer  analyst
 * create_task    Y       Y        N          N
 * edit_any_task  Y       Y        N          N
 * edit_own_task  Y       Y        Y          N
 * delete_task    Y       Y        N          N
 * manage_users   Y       N        N          N
 * view_team      Y       Y        N          Y
 * view_all_tasks Y       Y        N          Y
 * view_externals Y       Y        N          N
 * change_any_status Y   Y        N          N
 * change_own_status Y   Y        Y          N
 * assign_task    Y       Y        N          N
 * view_reports   Y       Y        N          Y
 * view_kanban    Y       Y        Y          Y
 */
import { useAuth } from '../context/AuthContext';

const PERMISSIONS = {
  admin: [
    'create_task','edit_any_task','edit_own_task','delete_task',
    'manage_users','view_team','view_all_tasks','view_externals',
    'change_any_status','change_own_status','assign_task',
    'view_reports','view_kanban',
  ],
  manager: [
    'create_task','edit_any_task','edit_own_task','delete_task',
    'view_team','view_all_tasks','view_externals',
    'change_any_status','change_own_status','assign_task',
    'view_reports','view_kanban',
  ],
  developer: [
    'edit_own_task','change_own_status','view_kanban',
  ],
  analyst: [
    'view_all_tasks','view_team','view_reports','view_kanban',
  ],
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'developer';
  const perms = PERMISSIONS[role] || PERMISSIONS.developer;

  const can = (permission) => perms.includes(permission);

  const canEditTask = (task) => {
    if (can('edit_any_task')) return true;
    if (can('edit_own_task') && task?.assigned_user?.id === user?.id) return true;
    return false;
  };

  const canChangeStatus = (task) => {
    if (can('change_any_status')) return true;
    if (can('change_own_status') && task?.assigned_user?.id === user?.id) return true;
    return false;
  };

  const canDeleteTask = (task) => can('delete_task');

  return { can, canEditTask, canChangeStatus, canDeleteTask, role, user };
}
