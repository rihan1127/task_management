import os

def w(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")

BASE = "src"

# ── AuthContext ──────────────────────────────────────────────────────────────
w(f"{BASE}/context/AuthContext.jsx", """import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiClient.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: u } = res.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('auth_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    apiClient.post('/auth/logout').catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
""")

# ── ThemeContext ─────────────────────────────────────────────────────────────
w(f"{BASE}/context/ThemeContext.jsx", """import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
""")

# ── NotificationContext ──────────────────────────────────────────────────────
w(f"{BASE}/context/NotificationContext.jsx", """import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

let _nextId = 1;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef({});

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = _nextId++;
    const newNote = { id, message, type, timestamp: new Date() };
    setNotifications(prev => [newNote, ...prev].slice(0, 20));

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
""")

# ── useTaskSocket hook ───────────────────────────────────────────────────────
w(f"{BASE}/hooks/useTaskSocket.js", """import { useEffect, useRef, useCallback } from 'react';

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000') + '/ws/tasks';

/**
 * Connects to the task WebSocket and calls onEvent whenever a message arrives.
 * Handles auto-reconnect with exponential back-off.
 */
export function useTaskSocket(onEvent) {
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { retryRef.current = 0; };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEventRef.current?.(data);
      } catch {}
    };

    ws.onclose = () => {
      // Exponential back-off: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, [connect]);
}
""")

# ── ActivityTimeline component ───────────────────────────────────────────────
w(f"{BASE}/components/ActivityTimeline.jsx", """import { useEffect, useState } from 'react';
import { formatRelative, getInitials, getAvatarColor } from '../utils/formatters';
import { ActivityAPI } from '../services/api';
import classNames from 'classnames';

const ACTION_META = {
  created:        { icon: '✨', color: 'bg-emerald-100 text-emerald-700', label: 'Created task' },
  updated:        { icon: '✏️', color: 'bg-blue-100 text-blue-700',     label: 'Updated' },
  status_changed: { icon: '🔄', color: 'bg-violet-100 text-violet-700', label: 'Status changed' },
  commented:      { icon: '💬', color: 'bg-amber-100 text-amber-700',   label: 'Commented' },
  deleted:        { icon: '🗑️', color: 'bg-red-100 text-red-700',      label: 'Deleted' },
};

export function ActivityTimeline({ taskId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    ActivityAPI.getTaskActivity(taskId)
      .then(r => setActivities(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="py-4 text-center text-sm text-gray-400">Loading activity…</div>;
  if (!activities.length) return (
    <div className="py-6 text-center text-gray-400 text-sm">No activity recorded yet.</div>
  );

  return (
    <div className="space-y-4">
      {activities.map((a, i) => {
        const meta = ACTION_META[a.action] || ACTION_META.updated;
        return (
          <div key={a.id} className="flex gap-3">
            {/* Avatar */}
            {a.user ? (
              <div className={classNames(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5',
                getAvatarColor(a.user.name)
              )}>
                {getInitials(a.user.name)}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ?
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">{a.user?.name || 'System'}</span>
                <span className={classNames('text-xs px-2 py-0.5 rounded-full font-medium', meta.color)}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatRelative(a.created_at)}</span>
              </div>
              {(a.old_value || a.new_value) && (
                <div className="mt-1 text-xs text-gray-500">
                  {a.field_name && <span className="font-medium capitalize mr-1">{a.field_name.replace('_', ' ')}:</span>}
                  {a.old_value && <span className="line-through text-red-400 mr-1">{a.old_value}</span>}
                  {a.new_value && <span className="text-emerald-600">{a.new_value}</span>}
                </div>
              )}
            </div>

            {/* Timeline line */}
            {i < activities.length - 1 && (
              <div className="absolute left-[15px] mt-9 w-0.5 h-6 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ActivityTimeline;
""")

# ── NotificationCenter component ─────────────────────────────────────────────
w(f"{BASE}/components/NotificationCenter.jsx", """import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatRelative } from '../utils/formatters';
import classNames from 'classnames';

const TYPE_STYLES = {
  success: 'text-emerald-600',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
};

const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

// Toast stack rendered at bottom-right
export function ToastStack() {
  const { notifications, dismiss } = useNotifications();
  const visible = notifications.slice(0, 5);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {visible.map(n => (
        <div
          key={n.id}
          className={classNames(
            'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm pointer-events-auto',
            'bg-white border-gray-200 animate-slide-up'
          )}
          role="alert"
        >
          <span className={classNames('mt-0.5 font-bold text-sm flex-shrink-0', TYPE_STYLES[n.type] || TYPE_STYLES.info)}>
            {TYPE_ICONS[n.type] || TYPE_ICONS.info}
          </span>
          <p className="flex-1 text-sm font-medium text-gray-800 leading-snug">{n.message}</p>
          <button onClick={() => dismiss(n.id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

// Bell icon + dropdown in the top bar
export function NotificationCenter() {
  const { notifications, dismiss, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => setOpen(o => !o)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 relative"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={clearAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">All caught up! 🎉</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                  <span className={classNames('text-sm font-bold flex-shrink-0 mt-0.5', TYPE_STYLES[n.type] || TYPE_STYLES.info)}>
                    {TYPE_ICONS[n.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(n.timestamp)}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-gray-300 hover:text-gray-500 text-xs ml-1 flex-shrink-0">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
""")

# ── Login page ────────────────────────────────────────────────────────────────
w(f"{BASE}/pages/Login.jsx", """import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      notify('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="login-logo-text">TaskHub</span>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your workspace</p>

        {error && (
          <div className="login-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="alice@company.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn" id="login-submit">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo-title">Demo accounts</p>
          {[
            { name: 'Alice Johnson', role: 'Admin', email: 'alice@company.com' },
            { name: 'Bob Smith', role: 'Manager', email: 'bob@company.com' },
            { name: 'Charlie Davis', role: 'Developer', email: 'charlie@company.com' },
          ].map(u => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword('password123'); }}
              className="login-demo-btn"
            >
              <span className="font-medium">{u.name}</span>
              <span className="login-demo-role">{u.role}</span>
            </button>
          ))}
          <p className="login-demo-hint">Password: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}
""")

print("Frontend files written.")
