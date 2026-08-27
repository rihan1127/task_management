/**
 * Application-wide constants
 */

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'analyst', label: 'Analyst' },
];

export const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

export const STATUS_COLORS = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export const PRIORITY_COLORS = {
  low: { bg: 'bg-sky-100', text: 'text-sky-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

export const ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-800',
  manager: 'bg-indigo-100 text-indigo-800',
  developer: 'bg-blue-100 text-blue-800',
  analyst: 'bg-teal-100 text-teal-800',
};

export const DEFAULT_PAGE_SIZE = 20;
