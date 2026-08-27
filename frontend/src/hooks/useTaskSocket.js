import { useEffect, useRef, useCallback } from 'react';

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
