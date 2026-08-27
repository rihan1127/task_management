import { useState, useCallback, useRef } from 'react';

/**
 * Manages toast notification state.
 * Returns the active toast, a show() function and a hide() function.
 *
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   showToast('Task created!', 'success');
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}

export default useToast;
