import { useState, useEffect } from 'react';
import { TaskAPI } from '../services/api';
import { IssueTypeIcon, JiraPriorityIcon, IssueTypeBadge } from '../components/JiraIcons';
import { IssueDetailDrawer } from '../components/IssueDetailDrawer';
import { LoadingSpinner } from '../components';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { getInitials, getAvatarColor } from '../utils/formatters';
import classNames from 'classnames';

export default function Backlog() {
  const { notify } = useNotifications();
  const { can } = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Inline issue creator state
  const [sprintInlineTitle, setSprintInlineTitle] = useState('');
  const [isCreatingSprintIssue, setIsCreatingSprintIssue] = useState(false);
  const [backlogInlineTitle, setBacklogInlineTitle] = useState('');
  const [isCreatingBacklogIssue, setIsCreatingBacklogIssue] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await TaskAPI.listTasks({ page_size: 100 });
      setTasks(res.data.items || []);
    } catch {
      notify('Failed to load backlog issues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (task) => {
    setSelectedTaskId(task.id);
    setDrawerOpen(true);
  };

  const handleQuickCreate = async (title, sprintName) => {
    if (!title.trim()) return;
    try {
      await TaskAPI.createTask({
        title: title.trim(),
        sprint: sprintName,
        issue_type: 'story',
        story_points: 3,
        priority: 'medium',
      });
      notify('Issue created', 'success');
      loadTasks();
    } catch {
      notify('Failed to create issue', 'error');
    }
  };

  const moveSprint = async (taskId, newSprint) => {
    try {
      await TaskAPI.updateTask(taskId, { sprint: newSprint });
      notify(`Moved to ${newSprint}`, 'success', 1500);
      loadTasks();
    } catch {
      notify('Failed to move issue', 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>;
  }

  const sprintTasks = tasks.filter(t => (t.sprint || 'Sprint 1') === 'Sprint 1');
  const backlogTasks = tasks.filter(t => (t.sprint || 'Sprint 1') === 'Backlog' || t.sprint === 'Sprint 2');

  const sprintPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const backlogPoints = backlogTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Backlog & Sprint Planning</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan sprints, estimate story points, and prioritize work</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            Total Points: {sprintPoints + backlogPoints}
          </span>
        </div>
      </div>

      {/* ── Active Sprint Container ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>Sprint 1</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Active</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 font-medium">{sprintTasks.length} issues</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
              {sprintPoints} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => notify('Sprint 1 completed! Generating sprint retrospective report...', 'info')}
              className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 transition-colors shadow-sm"
            >
              Complete Sprint
            </button>
          </div>
        </div>

        {/* Sprint Issues List */}
        <div className="divide-y divide-gray-100" style={{ borderColor: 'var(--border)' }}>
          {sprintTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 italic">No issues in Sprint 1. Move issues from Backlog below.</div>
          ) : (
            sprintTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleIssueClick(task)}
                className="px-5 py-3 flex items-center justify-between hover:bg-blue-50/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IssueTypeIcon type={task.issue_type || 'story'} className="w-4 h-4" />
                  <span className="font-bold text-xs text-gray-500 w-16 flex-shrink-0">PROJ-{task.id}</span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</span>
                  {task.epic_name && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                      {task.epic_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSprint(task.id, 'Backlog'); }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-blue-600 transition-opacity mr-2"
                    title="Move to backlog"
                  >
                    Move to Backlog ↓
                  </button>

                  <span className={classNames('text-[10px] font-bold px-2 py-0.5 rounded capitalize', {
                    'bg-slate-100 text-slate-700': task.status === 'pending',
                    'bg-blue-100 text-blue-700': task.status === 'in_progress',
                    'bg-emerald-100 text-emerald-700': task.status === 'completed',
                    'bg-red-100 text-red-700': task.status === 'blocked',
                  })}>
                    {task.status.replace('_', ' ')}
                  </span>

                  <JiraPriorityIcon priority={task.priority} className="w-3.5 h-3.5" />

                  {task.story_points != null && (
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center border border-gray-200">
                      {task.story_points}
                    </span>
                  )}

                  {task.assigned_user ? (
                    <div className={classNames('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', getAvatarColor(task.assigned_user.name))}>
                      {getInitials(task.assigned_user.name)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">
                      ?
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Inline Create Row */}
          {isCreatingSprintIssue ? (
            <div className="px-5 py-2.5 bg-blue-50/30 flex items-center gap-3">
              <IssueTypeIcon type="story" className="w-4 h-4" />
              <input
                type="text"
                autoFocus
                placeholder="What needs to be done in Sprint 1? (Press Enter to add)"
                value={sprintInlineTitle}
                onChange={e => setSprintInlineTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleQuickCreate(sprintInlineTitle, 'Sprint 1');
                    setSprintInlineTitle('');
                    setIsCreatingSprintIssue(false);
                  }
                  if (e.key === 'Escape') setIsCreatingSprintIssue(false);
                }}
                className="flex-1 text-sm bg-transparent outline-none border-b border-blue-500 py-1"
                style={{ color: 'var(--text-primary)' }}
              />
              <button onClick={() => setIsCreatingSprintIssue(false)} className="text-xs text-gray-400">Cancel</button>
            </div>
          ) : (
            can('create_task') && (
              <button
                onClick={() => setIsCreatingSprintIssue(true)}
                className="w-full px-5 py-2.5 text-left text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-bold">+</span> Create issue in Sprint 1
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Backlog Container ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>Backlog</span>
            <span className="text-xs text-gray-500 font-medium">{backlogTasks.length} issues</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-600 text-white">
              {backlogPoints} pts
            </span>
          </div>

          <button
            onClick={() => notify('Created Sprint 2 draft', 'success')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            Create Sprint
          </button>
        </div>

        {/* Backlog Issues List */}
        <div className="divide-y divide-gray-100" style={{ borderColor: 'var(--border)' }}>
          {backlogTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 italic">Backlog is empty. Create issues below.</div>
          ) : (
            backlogTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleIssueClick(task)}
                className="px-5 py-3 flex items-center justify-between hover:bg-blue-50/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IssueTypeIcon type={task.issue_type || 'story'} className="w-4 h-4" />
                  <span className="font-bold text-xs text-gray-500 w-16 flex-shrink-0">PROJ-{task.id}</span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</span>
                  {task.epic_name && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                      {task.epic_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSprint(task.id, 'Sprint 1'); }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline transition-opacity mr-2 font-semibold"
                    title="Move to Sprint 1"
                  >
                    Move to Sprint 1 ↑
                  </button>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    {task.status.replace('_', ' ')}
                  </span>

                  <JiraPriorityIcon priority={task.priority} className="w-3.5 h-3.5" />

                  {task.story_points != null && (
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center border border-gray-200">
                      {task.story_points}
                    </span>
                  )}

                  {task.assigned_user ? (
                    <div className={classNames('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', getAvatarColor(task.assigned_user.name))}>
                      {getInitials(task.assigned_user.name)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">
                      ?
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Inline Create Row */}
          {isCreatingBacklogIssue ? (
            <div className="px-5 py-2.5 bg-blue-50/30 flex items-center gap-3">
              <IssueTypeIcon type="story" className="w-4 h-4" />
              <input
                type="text"
                autoFocus
                placeholder="What needs to be done in Backlog? (Press Enter to add)"
                value={backlogInlineTitle}
                onChange={e => setBacklogInlineTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleQuickCreate(backlogInlineTitle, 'Backlog');
                    setBacklogInlineTitle('');
                    setIsCreatingBacklogIssue(false);
                  }
                  if (e.key === 'Escape') setIsCreatingBacklogIssue(false);
                }}
                className="flex-1 text-sm bg-transparent outline-none border-b border-blue-500 py-1"
                style={{ color: 'var(--text-primary)' }}
              />
              <button onClick={() => setIsCreatingBacklogIssue(false)} className="text-xs text-gray-400">Cancel</button>
            </div>
          ) : (
            can('create_task') && (
              <button
                onClick={() => setIsCreatingBacklogIssue(true)}
                className="w-full px-5 py-2.5 text-left text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-bold">+</span> Create issue in Backlog
              </button>
            )
          )}
        </div>
      </div>

      {/* Drawer */}
      <IssueDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={loadTasks}
      />
    </div>
  );
}
