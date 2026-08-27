import { useState, useRef, useEffect } from 'react';
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
