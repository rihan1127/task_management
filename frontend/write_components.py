import os

def w(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")

# ── KanbanBoard with Drag-and-Drop ────────────────────────────────────────────
w("src/components/KanbanBoard.jsx", """import { useState, useRef } from 'react';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';

const COLUMNS = [
  { key: 'pending',     label: 'Pending',     color: 'border-t-slate-400', headerBg: 'bg-slate-50', countColor: 'bg-slate-200 text-slate-700' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-blue-500',  headerBg: 'bg-blue-50',  countColor: 'bg-blue-200 text-blue-700' },
  { key: 'blocked',     label: 'Blocked',     color: 'border-t-red-500',   headerBg: 'bg-red-50',   countColor: 'bg-red-200 text-red-700' },
  { key: 'completed',   label: 'Completed',   color: 'border-t-emerald-500',headerBg:'bg-emerald-50',countColor:'bg-emerald-200 text-emerald-700' },
];

/**
 * KanbanBoard — displays tasks grouped into status columns.
 * Supports HTML5 native drag-and-drop to move tasks between columns.
 */
export function KanbanBoard({ tasks = [], onStatusChange }) {
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragTaskId = useRef(null);
  const dragEl = useRef(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const handleDragStart = (e, taskId) => {
    dragTaskId.current = taskId;
    dragEl.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Small delay so the browser renders the ghost before we add the class
    setTimeout(() => e.currentTarget.classList.add('kanban-dragging'), 0);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('kanban-dragging');
    setDragOverCol(null);
    dragTaskId.current = null;
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragTaskId.current !== null) {
      const task = tasks.find(t => t.id === dragTaskId.current);
      if (task && task.status !== colKey) {
        onStatusChange?.(dragTaskId.current, colKey);
      }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div
          key={col.key}
          className="flex-shrink-0 w-72 flex flex-col"
          onDragOver={e => handleDragOver(e, col.key)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, col.key)}
        >
          {/* Column Header */}
          <div className={`rounded-t-xl border-t-4 ${col.color} ${col.headerBg} px-4 py-3 flex items-center justify-between`}>
            <span className="font-semibold text-gray-800 text-sm">{col.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
              {grouped[col.key].length}
            </span>
          </div>

          {/* Drop zone */}
          <div
            className={`flex-1 rounded-b-xl border border-t-0 p-3 space-y-3 min-h-[200px] transition-all duration-150 ${
              dragOverCol === col.key ? 'kanban-drag-over' : 'border-gray-200 bg-gray-50'
            }`}
            style={{ background: dragOverCol === col.key ? 'var(--bg-hover)' : undefined }}
          >
            {grouped[col.key].length === 0 ? (
              <EmptyState
                title="No tasks"
                subtitle={dragOverCol === col.key ? 'Drop here' : `No ${col.label.toLowerCase()} tasks`}
              />
            ) : (
              grouped[col.key].map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  style={{ cursor: 'grab' }}
                >
                  <TaskCard task={task} onStatusChange={onStatusChange} />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
""")

# ── components/index.js ────────────────────────────────────────────────────────
w("src/components/index.js", """export { default as Button } from './Button';
export { Modal } from './Modal';
export { Input, Textarea, Select } from './Input';
export { StatusBadge, PriorityBadge, Badge } from './Badges';
export { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from './Table';
export { Pagination, LoadingSkeleton, LoadingSpinner } from './Pagination';
export { default as Toast } from './Toast';
export { default as TaskCard } from './TaskCard';
export { default as KanbanBoard } from './KanbanBoard';
export { default as EmptyState } from './EmptyState';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as StatCard } from './StatCard';
export { ActivityTimeline } from './ActivityTimeline';
export { NotificationCenter, ToastStack } from './NotificationCenter';
""")

print("KanbanBoard.jsx and index.js written.")
