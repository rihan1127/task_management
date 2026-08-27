import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401; redirect to /login only if refresh also fails
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/login') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const { access_token, refresh_token } = res.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          apiClient.defaults.headers['Authorization'] = `Bearer ${access_token}`;
          processQueue(null, access_token);
          original.headers['Authorization'] = `Bearer ${access_token}`;
          return apiClient(original);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.clear();
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const AuthAPI = {
  login:   (data) => apiClient.post('/auth/login', data),
  refresh: (data) => apiClient.post('/auth/refresh', data),
  logout:  ()     => apiClient.post('/auth/logout'),
  me:      ()     => apiClient.get('/auth/me'),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const TaskAPI = {
  listTasks:  (params = {})      => apiClient.get('/tasks', { params }),
  getTask:    (taskId)           => apiClient.get(`/tasks/${taskId}`),
  createTask: (data)             => apiClient.post('/tasks', data),
  updateTask: (taskId, data)     => apiClient.put(`/tasks/${taskId}`, data),
  deleteTask: (taskId)           => apiClient.delete(`/tasks/${taskId}`),
  getUserTasks:(userId, status)  => apiClient.get(`/tasks/${userId}/assigned`, { params: { status } }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const UserAPI = {
  listUsers:    (params = {}) => apiClient.get('/users', { params }),
  getUser:      (userId)      => apiClient.get(`/users/${userId}`),
  getUserByEmail:(email)      => apiClient.get(`/users/email/${email}`),
  createUser:   (data)        => apiClient.post('/users', data),
  deleteUser:   (userId)      => apiClient.delete(`/users/${userId}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const DashboardAPI = {
  getStats:        ()         => apiClient.get('/dashboard'),
  getOverdueTasks: ()         => apiClient.get('/dashboard/tasks/overdue'),
  getUpcomingTasks:(days = 7) => apiClient.get('/dashboard/tasks/upcoming', { params: { days } }),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const CommentAPI = {
  createComment:    (taskId, data) => apiClient.post(`/comments/tasks/${taskId}`, data),
  getTaskComments:  (taskId)       => apiClient.get(`/comments/tasks/${taskId}`),
  deleteComment:    (commentId)    => apiClient.delete(`/comments/${commentId}`),
};

// ── Activity ──────────────────────────────────────────────────────────────────
export const ActivityAPI = {
  getTaskActivity: (taskId) => apiClient.get(`/activity/tasks/${taskId}`),
};

// ── External ──────────────────────────────────────────────────────────────────
export const ExternalAPI = {
  getGitHubUser: (username)        => apiClient.get(`/external/github/users/${username}`),
  getGitHubRepo: (owner, repo)     => apiClient.get(`/external/github/repos/${owner}/${repo}`),
  getWeather:    (city, country)   => apiClient.get(`/external/weather/${city}`, { params: { country } }),
};

export default apiClient;
