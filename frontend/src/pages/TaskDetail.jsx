import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TaskAPI, CommentAPI, UserAPI } from '../services/api';
import { Button, Modal, LoadingSpinner } from '../components';
import { ActivityTimeline } from '../components';
import { formatDate, formatRelative, formatDateInput, getInitials, getAvatarColor } from '../utils/formatters';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { RoleBadge } from '../components/RoleBadge';
import classNames from 'classnames';

const PRIORITY_STRIPE = {
  low: 'bg-sky-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  urgent: 'bg-rose-600',
};

function QuickSelect({ options, value, onChange, colorMap, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={classNames(
            'px-3 py-1 rounded-full text-xs font-semibold ring-1 transition-all duration-150',
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            value === o.value
              ? (colorMap[o.value] || 'ring-blue-400 bg-blue-100 text-blue-700') + ' ring-2 scale-105 shadow-sm'
              : 'ring-gray-200 bg-gray-50 text-gray-500 hover:ring-gray-300 hover:text-gray-700'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { user } = useAuth();
  const { can, canEditTask, canChangeStatus, canDeleteTask, role } = usePermissions();

  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: null,
    due_date: '',
  });

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, usersRes] = await Promise.all([
        TaskAPI.getTask(taskId),
        UserAPI.listUsers().catch(() => ({ data: [] })),
      ]);
      setTask(taskRes.data);
      setUsers(usersRes.data);
      setFormData({
        title: taskRes.data.title,
        description: taskRes.data.description || '',
        status: taskRes.data.status,
        priority: taskRes.data.priority,
        assigned_to: taskRes.data.assigned_user?.id || null,
        due_date: formatDateInput(taskRes.data.due_date),
      });
    } catch {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await TaskAPI.updateTask(taskId, {
        title: formData.title || undefined,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        due_date: formData.due_date ? formData.due_date + 'T00:00:00' : null,
      });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      notify('Task updated successfully', 'success');
      loadData();
    } catch {
      notify('Failed to save task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickUpdate = async (field, value) => {
    try {
      setIsSavingQuick(true);
      await TaskAPI.updateTask(taskId, { [field]: value });
      setTask((prev) => ({ ...prev, [field]: value }));
      notify(`${field.replace('_', ' ')} updated`, 'success');
    } catch {
      notify('Update failed', 'error');
    } finally {
      setIsSavingQuick(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsCommenting(true);
      await CommentAPI.createComment(taskId, { comment: newComment });
      setNewComment('');
      notify('Comment posted', 'success');
      loadData();
    } catch {
      notify('Failed to add comment', 'error');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await TaskAPI.deleteTask(taskId);
      notify('Task deleted', 'info');
      navigate('/tasks');
    } catch {
      notify('Failed to delete task', 'error');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_user?.id || null,
        due_date: formatDateInput(task.due_date),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-2xl p-8 text-center bg-red-50 border border-red-200">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="font-semibold text-red-800 mb-1">{error || 'Task not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-blue-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  const userCanEdit = canEditTask(task);
  const userCanChangeStatus = canChangeStatus(task);
  const userCanDelete = canDeleteTask(task);
  const userCanAssign = can('assign_task');

  const dueOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const dueSoon = task.due_date && !dueOverdue && new Date(task.due_date) - new Date() < 172800000;

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      {/* Priority colour stripe */}
      <div className={classNames('h-1.5 rounded-t-2xl w-full', PRIORITY_STRIPE[task.priority])} />

      <div
        className="rounded-b-2xl border border-t-0 overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <nav className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link to="/" className="hover:text-blue-500 transition-colors">Home</Link>
            <span>/</span>
            {can('view_all_tasks') ? (
              <Link to="/tasks" className="hover:text-blue-500 transition-colors">Tasks</Link>
            ) : (
              <Link to="/kanban" className="hover:text-blue-500 transition-colors">Kanban</Link>
            )}
            <span>/</span>
            <span className="truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>{task.title}</span>
          </nav>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              {!editMode ? (
                <h1
                  className={classNames(
                    'text-2xl font-extrabold leading-snug transition-opacity',
                    userCanEdit ? 'cursor-pointer hover:opacity-80' : ''
                  )}
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => userCanEdit && setEditMode(true)}
                  title={userCanEdit ? 'Click to edit' : undefined}
                >
                  {task.title}
                </h1>
              ) : (
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  autoFocus
                  className="w-full text-2xl font-extrabold bg-transparent outline-none border-b-2 border-blue-500 pb-1"
                  style={{ color: 'var(--text-primary)' }}
                />
              )}

              <div className="mt-3 flex items-center flex-wrap gap-2">
                {/* Status pill */}
                <span
                  className={classNames('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1', {
                    'ring-slate-300 bg-slate-100 text-slate-700': task.status === 'pending',
                    'ring-blue-400 bg-blue-100 text-blue-700': task.status === 'in_progress',
                    'ring-emerald-400 bg-emerald-100 text-emerald-700': task.status === 'completed',
                    'ring-red-400 bg-red-100 text-red-700': task.status === 'blocked',
                  })}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {{ pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', blocked: 'Blocked' }[task.status]}
                </span>

                {/* Priority pill */}
                <span
                  className={classNames('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1', {
                    'ring-sky-300 bg-sky-100 text-sky-700': task.priority === 'low',
                    'ring-amber-300 bg-amber-100 text-amber-700': task.priority === 'medium',
                    'ring-orange-400 bg-orange-100 text-orange-700': task.priority === 'high',
                    'ring-rose-500 bg-rose-100 text-rose-700': task.priority === 'urgent',
                  })}
                >
                  {{ low: '↓', medium: '→', high: '↑', urgent: '🔥' }[task.priority] || ''}{' '}
                  {{ low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[task.priority]}
                </span>

                {dueOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full ring-1 ring-red-300">
                    ⏰ Overdue
                  </span>
                )}
                {dueSoon && !dueOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full ring-1 ring-amber-300">
                    ⚡ Due soon
                  </span>
                )}
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full animate-fadeIn">
                    ✓ Saved
                  </span>
                )}
                {!userCanEdit && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                    Read-only mode ({role})
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons gated by permission */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              {!editMode ? (
                <>
                  {userCanEdit && (
                    <button
                      id="task-edit-btn"
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit task
                    </button>
                  )}
                  {userCanDelete && (
                    <button
                      id="task-delete-btn"
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors ring-1 ring-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    id="task-save-btn"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl text-sm font-semibold ring-1 transition-colors"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-muted)', borderColor: 'var(--border)' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Main 2-column Body ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          {/* LEFT: Description + Comments & Activity */}
          <div className="p-8 space-y-8" style={{ borderRight: '1px solid var(--border)' }}>
            {/* Description */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Description
              </h2>
              {!editMode ? (
                task.description ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {task.description}
                  </p>
                ) : (
                  userCanEdit ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-sm italic text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      + Add a description
                    </button>
                  ) : (
                    <p className="text-sm italic text-gray-400">No description provided</p>
                  )
                )
              ) : (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Describe this task…"
                  className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              )}
            </section>

            {/* Comments / Activity Tabs */}
            <section>
              <div className="flex items-center gap-1 mb-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'comments', label: 'Comments', count: task.comments?.length },
                  { key: 'activity', label: 'Activity', count: null },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={classNames(
                      'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                      activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-100'
                    )}
                    style={activeTab !== tab.key ? { color: 'var(--text-secondary)' } : {}}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={classNames(
                          'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold',
                          activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'comments' && (
                <div className="space-y-5">
                  {/* Composer */}
                  {role !== 'analyst' && (
                    <div className="flex gap-3">
                      <div
                        className={classNames(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5',
                          getAvatarColor(user?.name || 'U')
                        )}
                      >
                        {getInitials(user?.name || 'U')}
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Write a comment… (Ctrl+Enter to submit)"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleAddComment();
                          }}
                          rows={newComment ? 4 : 2}
                          className="w-full rounded-xl p-3 text-sm resize-none outline-none transition-all"
                          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                        {newComment.trim() && (
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setNewComment('')}
                              className="text-xs px-3 py-1.5 rounded-lg"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Discard
                            </button>
                            <button
                              id="post-comment-btn"
                              onClick={handleAddComment}
                              disabled={isCommenting}
                              className="text-xs px-4 py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                            >
                              {isCommenting ? 'Posting…' : 'Post comment'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comments list */}
                  {task.comments && task.comments.length > 0 ? (
                    <div className="space-y-4">
                      {task.comments.map((c) => (
                        <div key={c.id} className="flex gap-3 animate-fadeIn">
                          <div
                            className={classNames(
                              'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5',
                              getAvatarColor(c.author.name)
                            )}
                          >
                            {getInitials(c.author.name)}
                          </div>
                          <div
                            className="flex-1 rounded-xl p-4"
                            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {c.author.name}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatRelative(c.created_at)}
                              </span>
                            </div>
                            <p
                              className="text-sm whitespace-pre-wrap leading-relaxed"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {c.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-10 rounded-2xl"
                      style={{ background: 'var(--bg-muted)', border: '1px dashed var(--border)' }}
                    >
                      <div className="text-3xl mb-2">💬</div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        No comments yet
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Be the first to add a note!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && <ActivityTimeline taskId={parseInt(taskId)} />}
            </section>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="p-6 space-y-5">
            {isSavingQuick && (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 animate-pulse">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating…
              </div>
            )}

            {/* Status */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Status
                </p>
                {!userCanChangeStatus && (
                  <span className="text-[10px] text-gray-400">Locked</span>
                )}
              </div>
              {!editMode ? (
                <QuickSelect
                  options={STATUS_OPTIONS}
                  value={task.status}
                  disabled={!userCanChangeStatus}
                  onChange={(v) => userCanChangeStatus && quickUpdate('status', v)}
                  colorMap={{
                    pending: 'ring-slate-300 bg-slate-100 text-slate-700',
                    in_progress: 'ring-blue-400 bg-blue-100 text-blue-700',
                    completed: 'ring-emerald-400 bg-emerald-100 text-emerald-700',
                    blocked: 'ring-red-400 bg-red-100 text-red-700',
                  }}
                />
              ) : (
                <select
                  name="status"
                  value={formData.status}
                  disabled={!userCanChangeStatus}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Priority
                </p>
                {!userCanEdit && (
                  <span className="text-[10px] text-gray-400">Locked</span>
                )}
              </div>
              {!editMode ? (
                <QuickSelect
                  options={PRIORITY_OPTIONS}
                  value={task.priority}
                  disabled={!userCanEdit}
                  onChange={(v) => userCanEdit && quickUpdate('priority', v)}
                  colorMap={{
                    low: 'ring-sky-300 bg-sky-100 text-sky-700',
                    medium: 'ring-amber-300 bg-amber-100 text-amber-700',
                    high: 'ring-orange-400 bg-orange-100 text-orange-700',
                    urgent: 'ring-rose-500 bg-rose-100 text-rose-700',
                  }}
                />
              ) : (
                <select
                  name="priority"
                  value={formData.priority}
                  disabled={!userCanEdit}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignee */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Assigned to
              </p>
              {!editMode ? (
                task.assigned_user ? (
                  <div className="flex items-center gap-2.5">
                    <div
                      className={classNames(
                        'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                        getAvatarColor(task.assigned_user.name)
                      )}
                    >
                      {getInitials(task.assigned_user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {task.assigned_user.name}
                      </p>
                      <div className="mt-0.5">
                        <RoleBadge role={task.assigned_user.role} />
                      </div>
                    </div>
                  </div>
                ) : (
                  userCanAssign ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-sm text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      + Assign someone
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Unassigned</p>
                  )
                )
              ) : (
                <select
                  name="assigned_to"
                  value={formData.assigned_to || ''}
                  disabled={!userCanAssign}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Due date */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Due date
              </p>
              {!editMode ? (
                task.due_date ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: dueOverdue ? '#ef4444' : dueSoon ? '#f59e0b' : 'var(--text-muted)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: dueOverdue ? '#ef4444' : dueSoon ? '#f59e0b' : 'var(--text-primary)' }}
                      >
                        {formatDate(task.due_date)}
                      </p>
                      {dueOverdue && <p className="text-xs text-red-400">Past due</p>}
                      {dueSoon && !dueOverdue && <p className="text-xs text-amber-400">Due soon</p>}
                    </div>
                  </div>
                ) : (
                  userCanEdit ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-sm text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      + Set a due date
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No due date</p>
                  )
                )
              ) : (
                <input
                  type="date"
                  name="due_date"
                  disabled={!userCanEdit}
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              )}
            </div>

            {/* Details Metadata */}
            <div
              className="rounded-xl p-4 space-y-2.5"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Details
              </p>
              {[
                { label: 'Task ID', value: '#' + task.id, mono: true },
                { label: 'Created by', value: task.creator?.name },
                { label: 'Created', value: formatDate(task.created_at) },
                { label: 'Last updated', value: formatRelative(task.updated_at) },
                { label: 'Comments', value: String(task.comments?.length || 0) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {row.label}
                  </span>
                  <span
                    className={classNames('text-xs font-semibold max-w-[130px] text-right truncate', row.mono ? 'font-mono' : '')}
                    style={{ color: row.mono ? 'var(--text-muted)' : 'var(--text-secondary)' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Danger zone — visible only to roles with delete_task permission */}
            {userCanDelete && (
              <div className="rounded-xl p-4" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">Danger zone</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full text-sm font-semibold text-red-600 bg-white hover:bg-red-50 py-2 rounded-lg ring-1 ring-red-200 transition-colors cursor-pointer"
                >
                  Delete this task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
              Delete Task
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{task.title}"</strong>?
          This cannot be undone and will remove all comments and history.
        </p>
      </Modal>
    </div>
  );
}
