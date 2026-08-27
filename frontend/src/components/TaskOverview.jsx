import { useNavigate } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badges';
import { formatDueDate } from '../utils/formatters';

/**
 * TaskOverview — compact summary row used in dashboards and lists.
 * Shows task title, status, priority, and due date in a single row.
 */
export function TaskOverview({ task }) {
  const navigate = useNavigate();
  const { label: dueLabel, isOverdue } = formatDueDate(task?.due_date);

  if (!task) return null;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
        {task.due_date && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {dueLabel}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
    </div>
  );
}

export default TaskOverview;
