/**
 * Utility Functions
 * Reusable functions for common operations
 */

/**
 * Format date to readable format
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  return d.toLocaleDateString('en-US', options[format]);
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(date);
  return tomorrow.toDateString() === checkDate.toDateString();
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format priority as label
 */
export function getPriorityLabel(priority) {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };
  return labels[priority] || priority;
}

/**
 * Format status as label
 */
export function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked'
  };
  return labels[status] || status;
}

/**
 * Get priority color
 */
export function getPriorityColor(priority) {
  const colors = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return colors[priority] || 'gray';
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
    blocked: 'red'
  };
  return colors[status] || 'gray';
}

/**
 * Debounce function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(func, delay) {
  let lastCallTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    if (currentTime - lastCallTime >= delay) {
      func(...args);
      lastCallTime = currentTime;
    }
  };
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Clone object deeply
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Merge objects
 */
export function mergeObjects(...objects) {
  return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {});
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate string
 */
export function truncate(str, length = 50) {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse error message from API
 */
export function parseApiError(error) {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred';
}
