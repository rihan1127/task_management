import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

/**
 * Format a date as a relative string ("2 hours ago", "in 3 days")
 */
export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}

/**
 * Format a date as a short local date string ("Aug 26, 2026")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

/**
 * Format a date for HTML date inputs ("YYYY-MM-DD")
 */
export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Returns a human-friendly due date label and whether it's overdue.
 * e.g. "Today", "Tomorrow", "Aug 30", "3 days overdue"
 */
export function formatDueDate(dateStr) {
  if (!dateStr) return { label: 'No due date', isOverdue: false, isSoon: false };
  const date = new Date(dateStr);
  const overdue = isPast(date) && !isToday(date);
  const soon = isToday(date) || isTomorrow(date);

  let label;
  if (overdue) {
    label = `${formatDistanceToNow(date)} overdue`;
  } else if (isToday(date)) {
    label = 'Due today';
  } else if (isTomorrow(date)) {
    label = 'Due tomorrow';
  } else {
    label = `Due ${format(date, 'MMM d')}`;
  }

  return { label, isOverdue: overdue, isSoon: soon };
}

/**
 * Returns initials from a full name (up to 2 characters).
 * "Alice Johnson" → "AJ"
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Generate a consistent background color class for a user avatar based on name.
 */
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
];

export function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str = '') {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to Title Case.
 * "in_progress" → "In Progress"
 */
export function snakeToTitle(str = '') {
  return str
    .split('_')
    .map((w) => capitalize(w))
    .join(' ');
}
