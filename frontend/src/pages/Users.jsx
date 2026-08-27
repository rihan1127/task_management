import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAPI } from '../services/api';
import { Button, Input, Select, Modal, LoadingSpinner, EmptyState, ConfirmDialog, Toast } from '../components';
import { getInitials, getAvatarColor } from '../utils/formatters';
import { ROLE_OPTIONS, ROLE_COLORS } from '../utils/constants';
import { useToast } from '../hooks/useToast';
import classNames from 'classnames';

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, userId: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', role: 'developer' });
  const [errors, setErrors] = useState({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await UserAPI.listUsers();
      setUsers(res.data);
    } catch {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      await UserAPI.createUser(formData);
      setFormData({ name: '', email: '', role: 'developer' });
      setShowCreateModal(false);
      showToast('Team member added successfully', 'success');
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create user';
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setConfirmDelete({ open: true, userId: user.id, name: user.name });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await UserAPI.deleteUser(confirmDelete.userId);
      setConfirmDelete({ open: false, userId: null, name: '' });
      showToast('Team member removed', 'success');
      loadUsers();
    } catch {
      showToast('Failed to remove team member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1 text-sm">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
      )}

      {/* Users Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title={search ? 'No members found' : 'No team members yet'}
          subtitle={search ? 'Try a different search term.' : 'Add your first team member to get started.'}
          action={
            !search && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                + Add Member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={classNames(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg',
                  getAvatarColor(user.name)
                )}>
                  {getInitials(user.name)}
                </div>
                <button
                  onClick={() => handleDeleteClick(user)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 text-base">{user.name}</h3>
              <p className="text-sm text-gray-500 mb-3 truncate">{user.email}</p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={classNames(
                  'inline-block px-2.5 py-1 rounded-lg text-xs font-semibold',
                  ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                )}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <button
                  onClick={() => navigate(`/tasks?assignee=${user.id}`)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  View tasks →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', email: '', role: 'developer' });
          setErrors({});
        }}
        title="Add Team Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateUser} isLoading={isSubmitting}>Add Member</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateUser}>
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{errors.submit}</div>
          )}
          <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} placeholder="Jane Smith" required />
          <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} placeholder="jane@company.com" required />
          <Select label="Role" name="role" value={formData.role} onChange={handleInputChange} options={ROLE_OPTIONS} />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, userId: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Remove Team Member"
        message={`Remove "${confirmDelete.name}" from the team? Their tasks will remain but they'll be deactivated.`}
        confirmLabel="Remove Member"
        isLoading={isDeleting}
      />

      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}
