
import classNames from 'classnames';

const ROLE_STYLES = {
  admin:     'bg-violet-100 text-violet-800 ring-violet-300',
  manager:   'bg-blue-100 text-blue-800 ring-blue-300',
  developer: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  analyst:   'bg-amber-100 text-amber-800 ring-amber-300',
};

const ROLE_ICONS = { admin: 'Admin', manager: 'Manager', developer: 'Dev', analyst: 'Analyst' };

export function RoleBadge({ role, size = 'sm' }) {
  const style = ROLE_STYLES[role] || 'bg-gray-100 text-gray-700 ring-gray-300';
  return (
    <span className={classNames(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold capitalize ring-1',
      size === 'sm' ? 'text-xs' : 'text-sm px-3 py-1',
      style
    )}>
      {role}
    </span>
  );
}
