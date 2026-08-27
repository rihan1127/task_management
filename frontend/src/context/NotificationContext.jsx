import { createContext, useContext, useState, useCallback, useRef } from 'react';

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
