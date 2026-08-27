import { useEffect, useState } from 'react';
import { formatRelative, getInitials, getAvatarColor } from '../utils/formatters';
import { ActivityAPI } from '../services/api';
import classNames from 'classnames';

const ACTION_META = {
  created:        { icon: '✨', color: 'bg-emerald-100 text-emerald-700', label: 'Created task' },
  updated:        { icon: '✏️', color: 'bg-blue-100 text-blue-700',     label: 'Updated' },
  status_changed: { icon: '🔄', color: 'bg-violet-100 text-violet-700', label: 'Status changed' },
  commented:      { icon: '💬', color: 'bg-amber-100 text-amber-700',   label: 'Commented' },
  deleted:        { icon: '🗑️', color: 'bg-red-100 text-red-700',      label: 'Deleted' },
};

export function ActivityTimeline({ taskId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    ActivityAPI.getTaskActivity(taskId)
      .then(r => setActivities(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="py-4 text-center text-sm text-gray-400">Loading activity…</div>;
  if (!activities.length) return (
    <div className="py-6 text-center text-gray-400 text-sm">No activity recorded yet.</div>
  );

  return (
    <div className="space-y-4">
      {activities.map((a, i) => {
        const meta = ACTION_META[a.action] || ACTION_META.updated;
        return (
          <div key={a.id} className="flex gap-3">
            {/* Avatar */}
            {a.user ? (
              <div className={classNames(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5',
                getAvatarColor(a.user.name)
              )}>
                {getInitials(a.user.name)}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ?
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">{a.user?.name || 'System'}</span>
                <span className={classNames('text-xs px-2 py-0.5 rounded-full font-medium', meta.color)}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatRelative(a.created_at)}</span>
              </div>
              {(a.old_value || a.new_value) && (
                <div className="mt-1 text-xs text-gray-500">
                  {a.field_name && <span className="font-medium capitalize mr-1">{a.field_name.replace('_', ' ')}:</span>}
                  {a.old_value && <span className="line-through text-red-400 mr-1">{a.old_value}</span>}
                  {a.new_value && <span className="text-emerald-600">{a.new_value}</span>}
                </div>
              )}
            </div>

            {/* Timeline line */}
            {i < activities.length - 1 && (
              <div className="absolute left-[15px] mt-9 w-0.5 h-6 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ActivityTimeline;
