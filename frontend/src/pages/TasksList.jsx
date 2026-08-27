import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskAPI, UserAPI } from '../services/api';
import { Button, Input, Select, StatusBadge, PriorityBadge, Pagination, LoadingSpinner, EmptyState, ConfirmDialog, Toast } from '../components';
import { formatDate, formatDueDate, formatRelative } from '../utils/formatters';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SORT_OPTIONS } from '../utils/constants';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import { useTaskSocket } from '../hooks/useTaskSocket';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGate } from '../components/PermissionGate';

export default function TasksList() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { notify } = useNotifications();
  const { can } = usePermissions();
  const [liveIndicator, setLiveIndicator] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState({ open: false, taskId: null, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Live WebSocket updates
  const handleSocketEvent = useCallback((event) => {
    if (['task_created', 'task_updated', 'task_deleted'].includes(event?.event)) {
      setLiveIndicator(true);
      notify(`Live: ${event.event.replace('_', ' ')}`, 'info', 2500);
      loadTasks();
      setTimeout(() => setLiveIndicator(false), 2000);
    }
  }, []);
  useTaskSocket(handleSocketEvent);

  // Load users on mount
  useEffect(() => { loadUsers(); }, []);

  // Load tasks when filters change
  useEffect(() => {
    loadTasks();
  }, [page, search, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

  // Reset page to 1 when search changes
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, assigneeFilter]);

  const loadUsers = async () => {
    try {
      const res = await UserAPI.listUsers();
      setUsers(res.data);
    } catch { /* non-critical */ }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await TaskAPI.listTasks({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignee: assigneeFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTasks(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (task) => {
    setConfirmDelete({ open: true, taskId: task.id, title: task.title });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await TaskAPI.deleteTask(confirmDelete.taskId);
      setConfirmDelete({ open: false, taskId: null, title: '' });
      showToast('Task deleted successfully', 'success');
      notify('Task deleted', 'success');
      loadTasks();
    } catch {
      showToast('Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setPage(1);
  };

  const toggleSortOrder = () => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  const hasFilters = searchInput || statusFilter || priorityFilter || assigneeFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            {liveIndicator && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Live
              </span>
            )}
          </div>
          {!loading && (
            <p className="text-gray-500 mt-1 text-sm">
              {total} task{total !== 1 ? 's' : ''} {hasFilters ? 'matching filters' : 'total'}
            </p>
          )}
        </div>
        <PermissionGate permission="create_task">
          <Button variant="primary" onClick={() => navigate('/tasks/new')}>
            + New Task
          </Button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filters</h2>
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            placeholder="All Priorities"
            options={PRIORITY_OPTIONS}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
          <Select
            placeholder="All Assignees"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>
            <button
              onClick={toggleSortOrder}
              title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors text-sm font-medium"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks found"
            subtitle={hasFilters ? 'Try adjusting your filters.' : 'Create your first task to get started.'}
            action={
              !hasFilters ? (
                <Button variant="primary" onClick={() => navigate('/tasks/new')}>
                  + Create Task
                </Button>
              ) : (
                <Button variant="secondary" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => {
                  const { label: dueLabel, isOverdue, isSoon } = formatDueDate(task.due_date);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 hover:text-blue-700 transition-colors line-clamp-1">
                          {task.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4">
                        {task.assigned_user ? (
                          <span className="text-gray-700 text-sm">{task.assigned_user.name}</span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {task.due_date ? (
                          <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                            {dueLabel}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{formatRelative(task.updated_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tasks/${task.id}`)}
                          >
                            View
                          </Button>
                          <PermissionGate permission="delete_task">
                            <button
                              onClick={() => handleDeleteClick(task)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, taskId: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
      />

      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}
