
import { usePermissions } from '../hooks/usePermissions';

/**
 * Renders children only when the current user has the given permission.
 * Use `fallback` to show an alternative for unauthorised users.
 */
export function PermissionGate({ permission, fallback = null, children }) {
  const { can } = usePermissions();
  return can(permission) ? children : fallback;
}

/** Full-page access-denied screen for route-level protection. */
export function ProtectedPage({ permission, children }) {
  const { can } = usePermissions();
  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl">
          &#x1F512;
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Access Restricted</h2>
        <p className="text-sm max-w-sm text-center" style={{ color: 'var(--text-secondary)' }}>
          Your current role does not have permission to view this page.
          Contact an administrator if you need access.
        </p>
      </div>
    );
  }
  return children;
}
