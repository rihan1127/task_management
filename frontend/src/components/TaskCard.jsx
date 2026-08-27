import { IssueTypeIcon, JiraPriorityIcon } from './JiraIcons';
import { getInitials, getAvatarColor } from '../utils/formatters';
import classNames from 'classnames';

export default function TaskCard({ task, onStatusChange, onClick }) {
  if (!task) return null;
  const issueKey = `PROJ-${task.id}`;

  return (
    <div
      onClick={() => onClick?.(task)}
      className="group bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow hover:border-blue-400 transition-all duration-150 cursor-pointer select-none relative"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Epic badge if attached */}
      {task.epic_name && (
        <div className="mb-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 truncate max-w-[180px]">
            {task.epic_name}
          </span>
        </div>
      )}

      {/* Summary / Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-3" style={{ color: 'var(--text-primary)' }}>
        {task.title}
      </p>

      {/* Card Footer: Issue Type + Key + Priority on Left | Points + Assignee on Right */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-1.5">
          <IssueTypeIcon type={task.issue_type || 'story'} className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-500 hover:underline" style={{ color: 'var(--text-muted)' }}>
            {issueKey}
          </span>
          <JiraPriorityIcon priority={task.priority} className="w-3.5 h-3.5 ml-0.5" />
        </div>

        <div className="flex items-center gap-1.5">
          {task.story_points != null && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200" title={`${task.story_points} Story Points`}>
              {task.story_points}
            </span>
          )}

          {task.assigned_user ? (
            <div
              className={classNames(
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0',
                getAvatarColor(task.assigned_user.name)
              )}
              title={`Assigned to ${task.assigned_user.name}`}
            >
              {getInitials(task.assigned_user.name)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]" title="Unassigned">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { TaskCard };
