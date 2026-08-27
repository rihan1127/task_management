import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskAPI, UserAPI } from '../services/api';
import { Button, Input, Textarea, Select, LoadingSpinner } from '../components';
import { useEffect } from 'react';

export default function CreateTask() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await UserAPI.listUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        // Append time so Pydantic's datetime parser accepts the date-only string from <input type="date">
        due_date: formData.due_date ? `${formData.due_date}T00:00:00` : null
      };

      await TaskAPI.createTask(payload);
      navigate('/tasks?success=Task created successfully');
    } catch (err) {
      const detail = err.response?.data?.detail;
      // FastAPI validation errors return detail as an array of objects — convert to a readable string
      const errorMessage = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join('; ')
        : (typeof detail === 'string' ? detail : 'Failed to create task');
      setError(errorMessage);
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
        <p className="text-gray-600 mb-6">Fill in the details below to create a new task</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <Input
            label="Task Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={errors.title}
            placeholder="Enter task title"
            required
          />

          {/* Description */}
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter detailed task description (optional)"
            rows={4}
          />

          {/* Priority & Assignment Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />

            <Select
              label="Assign To"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              options={users.map(u => ({
                value: u.id.toString(),
                label: `${u.name} (${u.email})`
              }))}
            />
          </div>

          {/* Due Date */}
          <Input
            label="Due Date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleInputChange}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Task
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/tasks')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Be specific with your task title for better searchability</li>
          <li>• Add detailed descriptions to help assigned team members understand context</li>
          <li>• Set realistic due dates to keep the team on track</li>
          <li>• Assign tasks to team members to distribute workload</li>
          <li>• Use priority levels to highlight urgent tasks</li>
        </ul>
      </div>
    </div>
  );
}
