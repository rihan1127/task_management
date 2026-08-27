import classNames from 'classnames';

const COLOR_MAP = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-white',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'text-white',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'text-white',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 to-red-600',
    light: 'bg-rose-50',
    text: 'text-rose-600',
    icon: 'text-white',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    light: 'bg-violet-50',
    text: 'text-violet-600',
    icon: 'text-white',
  },
};

export function StatCard({
  title,
  value,
  icon,
  color = 'blue',
  subtitle = null,
  trend = null,    // { value: number, label: string } — positive = up, negative = down
  onClick = null,
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div
      className={classNames(
        'bg-white rounded-2xl p-5 shadow-sm border border-gray-100',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={classNames(
          'w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
          colors.bg
        )}>
          <span className={colors.icon}>{icon}</span>
        </div>
      </div>

      {trend != null && (
        <div className={classNames(
          'flex items-center gap-1 text-xs font-semibold',
          trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
        )}>
          {trend.value >= 0 ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
