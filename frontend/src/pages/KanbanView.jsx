import { useState, useEffect, useCallback } from 'react';
import { TaskAPI } from '../services/api';
import { KanbanBoard, LoadingSpinner, EmptyState } from '../components';
import { Button } from '../components';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useTaskSocket } from '../hooks/useTaskSocket';
import { useNotifications } from '../context/NotificationContext';
import { Toast } from '../components';

export default function KanbanView() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { notify } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveIndicator, setLiveIndicator] = useState(false);

  const handleSocketEvent = useCallback((event) => {
    if (['task_created', 'task_updated', 'task_deleted'].includes(event?.event)) {
      setLiveIndicator(true);
      notify(`Live update: ${event.event.replace('_', ' ')}`, 'info', 3000);
      loadAllTasks();
      setTimeout(() => setLiveIndicator(false), 2000);
    }
  }, []);

  useTaskSocket(handleSocketEvent);

  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      // Fetch all tasks without pagination for kanban (max 100)
      const res = await TaskAPI.listTasks({ page: 1, page_size: 100 });
      setTasks(res.data.items);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await TaskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      showToast(`Task moved to ${newStatus.replace('_', ' ')}`, 'success');
    } catch {
      showToast('Failed to update task status', 'error');
    }
  };

  const handleQuickCreate = async (cardData) => {
    try {
      await TaskAPI.createTask(cardData);
      notify('Issue created', 'success');
      loadAllTasks();
    } catch {
      notify('Failed to create issue', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Active Sprint Board</h1>
            {liveIndicator && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Sprint 1 · {tasks.length} issue{tasks.length !== 1 ? 's' : ''} across all columns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={loadAllTasks}>
            ↺ Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/tasks/new')}>
            + Create Issue
          </Button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onTaskUpdated={loadAllTasks}
          onQuickCreate={handleQuickCreate}
        />
      )}

      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}
