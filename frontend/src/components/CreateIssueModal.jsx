import { useState, useEffect } from 'react';
import { TaskAPI, UserAPI } from '../services/api';
import { IssueTypeIcon } from './JiraIcons';
import { useNotifications } from '../context/NotificationContext';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';

const ISSUE_TYPES = [
  { value: 'story', label: 'Story', desc: 'A user story or product requirement' },
  { value: 'task', label: 'Task', desc: 'A general technical task or action item' },
  { value: 'bug', label: 'Bug', desc: 'A defect or unintended behavior' },
  { value: 'epic', label: 'Epic', desc: 'A large feature encompassing multiple stories' },
];

export function CreateIssueModal({ isOpen, onClose, onIssueCreated, initialStatus = 'pending' }) {
  const { notify } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: 'story',
    story_points: 3,
    epic_name: '',
    sprint: 'Sprint 1',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  });

  useEffect(() => {
    if (isOpen) {
      UserAPI.listUsers().then(res => setUsers(res.data)).catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      notify('Summary cannot be empty', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        issue_type: formData.issue_type,
        story_points: formData.story_points ? parseInt(formData.story_points) : undefined,
        epic_name: formData.epic_name?.trim() || undefined,
        sprint: formData.sprint || 'Sprint 1',
        priority: formData.priority,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        due_date: formData.due_date ? `${formData.due_date}T00:00:00` : undefined,
      };

      await TaskAPI.createTask(payload);
      notify('Issue created successfully', 'success');
      setFormData({
        title: '', description: '', issue_type: 'story',
        story_points: 3, epic_name: '', sprint: 'Sprint 1',
        priority: 'medium', assigned_to: '', due_date: '',
      });
      onIssueCreated?.();
      onClose();
    } catch (err) {
      notify('Failed to create issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-10 overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              +
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Create Issue</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Issue Type Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Issue Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ISSUE_TYPES.map(t => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setFormData(p => ({ ...p, issue_type: t.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${formData.issue_type === t.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-400'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <IssueTypeIcon type={t.value} className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary / Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Add details, acceptance criteria, or context..."
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 resize-none"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* 3-column row: Story Points, Priority, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Story Points</label>
              <select
                value={formData.story_points}
                onChange={e => setFormData(p => ({ ...p, story_points: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                {[1, 2, 3, 5, 8, 13, 20].map(pt => (
                  <option key={pt} value={pt}>{pt} points</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Assignee</label>
              <select
                value={formData.assigned_to}
                onChange={e => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-column row: Epic & Sprint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Epic</label>
              <input
                type="text"
                placeholder="e.g. Security & Auth"
                value={formData.epic_name}
                onChange={e => setFormData(p => ({ ...p, epic_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Sprint</label>
              <select
                value={formData.sprint}
                onChange={e => setFormData(p => ({ ...p, sprint: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <option value="Sprint 1">Sprint 1 (Active)</option>
                <option value="Sprint 2">Sprint 2</option>
                <option value="Backlog">Backlog</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateIssueModal;