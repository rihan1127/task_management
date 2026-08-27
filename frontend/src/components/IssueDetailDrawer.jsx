import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TaskAPI, CommentAPI, UserAPI } from '../services/api';
import { IssueTypeBadge, JiraPriorityIcon, IssueTypeIcon } from './JiraIcons';
import { ActivityTimeline } from './ActivityTimeline';
import { formatDate, formatRelative, getInitials, getAvatarColor } from '../utils/formatters';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import classNames from 'classnames';

export function IssueDetailDrawer({ taskId, isOpen, onClose, onTaskUpdated }) {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { user } = useAuth();
  const { can, canEditTask, canChangeStatus, canDeleteTask } = usePermissions();

  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask();
    }
  }, [isOpen, taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const [tRes, uRes] = await Promise.all([
        TaskAPI.getTask(taskId),
        UserAPI.listUsers().catch(() => ({ data: [] })),
      ]);
      setTask(tRes.data);
      setTitleValue(tRes.data.title);
      setDescValue(tRes.data.description || '');
      setUsers(uRes.data);
    } catch {
      notify('Failed to load issue details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    if (!task) return;
    try {
      setIsUpdating(true);
      await TaskAPI.updateTask(task.id, { [field]: value });
      setTask(prev => ({ ...prev, [field]: value }));
      notify(`${field.replace('_', ' ')} updated`, 'success', 2000);
      onTaskUpdated?.();
    } catch {
      notify('Update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveTitle = async () => {
    if (!titleValue.trim() || titleValue === task.title) {
      setIsEditingTitle(false);
      return;
    }
    await handleFieldUpdate('title', titleValue);
    setIsEditingTitle(false);
  };

  const saveDesc = async () => {
    await handleFieldUpdate('description', descValue);
    setIsEditingDesc(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsCommenting(true);
      await CommentAPI.createComment(task.id, { comment: newComment });
      setNewComment('');
      notify('Comment posted', 'success');
      loadTask();
      onTaskUpdated?.();
    } catch {
      notify('Failed to add comment', 'error');
    } finally {
      setIsCommenting(false);
    }
  };

  if (!isOpen) return null;

  const userCanEdit = task ? canEditTask(task) : false;
  const userCanChangeStatus = task ? canChangeStatus(task) : false;
  const issueKey = task ? `PROJ-${task.id}` : '';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        style={{ width: '850px' }}
      >
        <div
          className="w-full bg-white shadow-2xl flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <IssueTypeBadge type={task?.issue_type || 'story'} showLabel={false} />
              <span className="font-bold text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/tasks/${task?.id}`)}>
                {issueKey}
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-500 font-medium">{task?.sprint || 'Sprint 1'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/tasks/${task?.id}`)}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                title="Open full page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Full view
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading || !task ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            /* Main 2-column drawer body */
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_280px]">
              {/* Left Column: Summary, Description, Activity */}
              <div className="p-6 space-y-6 border-r border-gray-100" style={{ borderColor: 'var(--border)' }}>
                {/* Title / Summary */}
                <div>
                  {isEditingTitle && userCanEdit ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={titleValue}
                        onChange={e => setTitleValue(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                        autoFocus
                        className="w-full text-xl font-bold p-2 rounded border border-blue-500 outline-none"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsEditingTitle(false)} className="px-2 py-1 text-xs text-gray-500">Cancel</button>
                        <button onClick={saveTitle} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <h1
                      onClick={() => userCanEdit && setIsEditingTitle(true)}
                      className={classNames(
                        "text-xl font-extrabold leading-snug p-1 rounded transition-colors",
                        userCanEdit ? "cursor-pointer hover:bg-gray-100" : ""
                      )}
                      style={{ color: 'var(--text-primary)' }}
                      title={userCanEdit ? "Click to edit" : undefined}
                    >
                      {task.title}
                    </h1>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</h3>
                  {isEditingDesc && userCanEdit ? (
                    <div className="space-y-2">
                      <textarea
                        value={descValue}
                        onChange={e => setDescValue(e.target.value)}
                        rows={6}
                        autoFocus
                        className="w-full text-sm p-3 rounded-lg border border-blue-500 outline-none resize-none"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                        placeholder="Add a detailed description..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1 text-xs text-gray-500">Cancel</button>
                        <button onClick={saveDesc} className="px-4 py-1 bg-blue-600 text-white rounded text-xs font-semibold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => userCanEdit && setIsEditingDesc(true)}
                      className={classNames(
                        "text-sm p-3 rounded-lg min-h-[80px] whitespace-pre-wrap transition-colors leading-relaxed",
                        userCanEdit ? "cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200" : ""
                      )}
                      style={{ color: task.description ? 'var(--text-secondary)' : 'var(--text-muted)', background: 'var(--bg-muted)' }}
                    >
                      {task.description || (userCanEdit ? "Click to add a description..." : "No description provided.")}
                    </div>
                  )}
                </div>

                {/* Activity & Comments Tabs */}
                <div className="pt-4 border-t border-gray-100" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-gray-800" style={{ color: 'var(--text-primary)' }}>Activity</h3>
                    <div className="flex gap-2">
                      {['comments', 'history'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={classNames(
                            "px-3 py-1 rounded text-xs font-semibold capitalize transition-colors",
                            activeTab === tab ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      {/* Comment Composer */}
                      <div className="flex gap-3">
                        <div className={classNames(
                          "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5",
                          getAvatarColor(user?.name || 'U')
                        )}>
                          {getInitials(user?.name || 'U')}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Add a comment... (Ctrl+Enter to post)"
                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }}
                            rows={newComment ? 3 : 1}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none transition-all resize-none"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                          />
                          {newComment.trim() && (
                            <div className="flex justify-end gap-2 mt-1.5">
                              <button onClick={() => setNewComment('')} className="px-2 py-1 text-xs text-gray-500">Cancel</button>
                              <button
                                onClick={handleAddComment}
                                disabled={isCommenting}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                              >
                                {isCommenting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments list */}
                      {task.comments && task.comments.length > 0 ? (
                        task.comments.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <div className={classNames(
                              "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5",
                              getAvatarColor(c.author.name)
                            )}>
                              {getInitials(c.author.name)}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-gray-900" style={{ color: 'var(--text-primary)' }}>{c.author.name}</span>
                                <span className="text-gray-400 text-[11px]">{formatRelative(c.created_at)}</span>
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{c.comment}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4">No comments on this issue yet.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <ActivityTimeline taskId={task.id} />
                  )}
                </div>
              </div>

              {/* Right Column: Status, Assignee, Points, Details */}
              <div className="p-6 space-y-5 bg-gray-50/50" style={{ background: 'var(--bg-muted)' }}>
                {/* Status Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Status</label>
                  <select
                    value={task.status}
                    disabled={!userCanChangeStatus}
                    onChange={e => handleFieldUpdate('status', e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assignee</label>
                  <select
                    value={task.assigned_user?.id || ''}
                    disabled={!can('assign_task')}
                    onChange={e => handleFieldUpdate('assigned_to', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Story Points</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[1, 2, 3, 5, 8, 13].map(pts => (
                      <button
                        key={pts}
                        disabled={!userCanEdit}
                        onClick={() => handleFieldUpdate('story_points', task.story_points === pts ? null : pts)}
                        className={classNames(
                          "w-7 h-7 rounded-full text-xs font-bold border transition-all",
                          task.story_points === pts
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-105"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                        )}
                      >
                        {pts}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Priority</label>
                  <select
                    value={task.priority}
                    disabled={!userCanEdit}
                    onChange={e => handleFieldUpdate('priority', e.target.value)}
                    className="w-full text-xs font-medium p-2 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Epic Link */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Epic</label>
                  <input
                    type="text"
                    value={task.epic_name || ''}
                    disabled={!userCanEdit}
                    onChange={e => setTask(prev => ({ ...prev, epic_name: e.target.value }))}
                    onBlur={e => handleFieldUpdate('epic_name', e.target.value || null)}
                    placeholder="None"
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white outline-none"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Sprint */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Sprint</label>
                  <select
                    value={task.sprint || 'Sprint 1'}
                    disabled={!userCanEdit}
                    onChange={e => handleFieldUpdate('sprint', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Sprint 1">Sprint 1 (Active)</option>
                    <option value="Sprint 2">Sprint 2 (Future)</option>
                    <option value="Backlog">Backlog</option>
                  </select>
                </div>

                {/* Metadata details */}
                <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-400">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium text-gray-600">{formatDate(task.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span className="font-medium text-gray-600">{formatRelative(task.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporter</span>
                    <span className="font-medium text-gray-600">{task.creator?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetailDrawer;