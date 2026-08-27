import classNames from 'classnames';

// Status Badge
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Pending'
    },
    in_progress: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'In Progress'
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Completed'
    },
    blocked: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Blocked'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={classNames(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      config.bg,
      config.text
    )}>
      <span className="w-2 h-2 rounded-full mr-2 bg-current opacity-60"></span>
      {config.label}
    </span>
  );
};

// Priority Badge
export const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Low',
      icon: '⬇️'
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Medium',
      icon: '→'
    },
    high: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      label: 'High',
      icon: '⬆️'
    },
    urgent: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Urgent',
      icon: '🔥'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={classNames(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      config.bg,
      config.text
    )}>
      {config.icon} {config.label}
    </span>
  );
};

// Generic Badge
export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={classNames(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
