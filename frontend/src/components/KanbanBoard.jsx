import { useState, useRef, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import { IssueDetailDrawer } from './IssueDetailDrawer';
import { IssueTypeIcon } from './JiraIcons';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import classNames from 'classnames';

const COLUMNS = [
  { key: 'pending', label: 'TO DO', color: 'border-t-slate-400', headerBg: 'bg-slate-100', countBg: 'bg-slate-200 text-slate-700' },
  { key: 'in_progress', label: 'IN PROGRESS', color: 'border-t-blue-500', headerBg: 'bg-blue-50', countBg: 'bg-blue-200 text-blue-800' },
  { key: 'blocked', label: 'BLOCKED', color: 'border-t-red-500', headerBg: 'bg-red-50', countBg: 'bg-red-200 text-red-800' },
  { key: 'completed', label: 'DONE', color: 'border-t-emerald-500', headerBg: 'bg-emerald-50', countBg: 'bg-emerald-200 text-emerald-800' },
];

function KanbanBoard({ tasks = [], onStatusChange, onTaskUpdated, onQuickCreate }) {
  const { canChangeStatus, can } = usePermissions();
  const { user } = useAuth();

  const [dragOverCol, setDragOverCol] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inlineCreatingCol, setInlineCreatingCol] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');

  // Quick filters state
  const [search, setSearch] = useState('');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const dragTaskId = useRef(null);
  const dragEl = useRef(null);

  // Apply quick filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (onlyMyIssues && task.assigned_user?.id !== user?.id) return false;
      if (typeFilter && task.issue_type !== typeFilter) return false;
      return true;
    });
  }, [tasks, search, onlyMyIssues, typeFilter, user?.id]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      const colTasks = filteredTasks.filter(t => t.status === col.key);
      const points = colTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
      acc[col.key] = { tasks: colTasks, points };
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleCardClick = (task) => {
    setSelectedTaskId(task.id);
    setDrawerOpen(true);
  };

  const handleDragStart = (e, taskId) => {
    dragTaskId.current = taskId;
    dragEl.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.currentTarget?.classList?.add('kanban-dragging'), 0);
  };

  const handleDragEnd = (e) => {
    e.currentTarget?.classList?.remove('kanban-dragging');
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
      if (task && task.status !== colKey && canChangeStatus(task)) {
        onStatusChange?.(dragTaskId.current, colKey);
      }
    }
  };

  const submitInlineCreate = (colKey) => {
    if (!inlineTitle.trim()) {
      setInlineCreatingCol(null);
      return;
    }
    onQuickCreate?.({
      title: inlineTitle.trim(),
      status: colKey,
      issue_type: 'story',
      story_points: 3,
      sprint: 'Sprint 1',
    });
    setInlineTitle('');
    setInlineCreatingCol(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Jira Quick Filter Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-xl border border-gray-200" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative w-48">
            <input
              type="text"
              placeholder="Search board..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 outline-none"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            />
            <svg className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Quick filter pills */}
          <button
            onClick={() => setOnlyMyIssues(p => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${onlyMyIssues ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-400' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Only my issues
          </button>

          {['story', 'bug', 'task', 'epic'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(p => p === type ? '' : type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${typeFilter === type ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-400' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <IssueTypeIcon type={type} className="w-3 h-3" />
              {type}s
            </button>
          ))}

          {(search || onlyMyIssues || typeFilter) && (
            <button
              onClick={() => { setSearch(''); setOnlyMyIssues(false); setTypeFilter(''); }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <strong>{filteredTasks.length}</strong> of {tasks.length} issues
        </div>
      </div>

      {/* ── Jira Kanban Columns ─────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colData = grouped[col.key] || { tasks: [], points: 0 };
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72 flex flex-col rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.key)}
            >
              {/* Column Header */}
              <div className={`border-t-4 ${col.color} px-3.5 py-2.5 flex items-center justify-between bg-white border-b border-gray-200`} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {col.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.countBg}`}>
                    {colData.tasks.length}
                  </span>
                </div>
                {colData.points > 0 && (
                  <span className="text-[10px] text-gray-400 font-semibold" title="Total Story Points">
                    {colData.points} pts
                  </span>
                )}
              </div>

              {/* Card List Drop Zone */}
              <div
                className={`flex-1 p-2.5 space-y-2.5 min-h-[350px] transition-colors ${dragOverCol === col.key ? 'kanban-drag-over bg-blue-50/50' : ''
                  }`}
              >
                {colData.tasks.length === 0 && inlineCreatingCol !== col.key ? (
                  <div className="py-12 text-center text-xs text-gray-400 italic">
                    No issues
                  </div>
                ) : (
                  colData.tasks.map(task => {
                    const isDraggable = canChangeStatus(task);
                    return (
                      <div
                        key={task.id}
                        draggable={isDraggable}
                        onDragStart={e => isDraggable && handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        style={{ cursor: isDraggable ? 'grab' : 'pointer' }}
                      >
                        <TaskCard task={task} onClick={handleCardClick} />
                      </div>
                    );
                  })
                )}

                {/* Inline Quick Card Creator */}
                {inlineCreatingCol === col.key ? (
                  <div className="bg-white rounded-lg p-2.5 border border-blue-400 shadow-sm space-y-2" style={{ background: 'var(--bg-surface)' }}>
                    <textarea
                      autoFocus
                      rows={2}
                      placeholder="What needs to be done? (Press Enter to add)"
                      value={inlineTitle}
                      onChange={e => setInlineTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitInlineCreate(col.key);
                        }
                        if (e.key === 'Escape') setInlineCreatingCol(null);
                      }}
                      className="w-full text-xs p-1 outline-none resize-none"
                      style={{ background: 'transparent', color: 'var(--text-primary)' }}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => submitInlineCreate(col.key)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setInlineCreatingCol(null)}
                          className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400">Story · 3 pts</span>
                    </div>
                  </div>
                ) : (
                  can('create_task') && (
                    <button
                      onClick={() => { setInlineCreatingCol(col.key); setInlineTitle(''); }}
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 transition-colors flex items-center gap-1.5"
                    >
                      <span className="font-bold text-sm leading-none">+</span> Create issue
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Jira Slide-out Inspector Drawer ─────────────────────────────── */}
      <IssueDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={() => {
          onTaskUpdated?.();
        }}
      />
    </div>
  );
}

export default KanbanBoard;
