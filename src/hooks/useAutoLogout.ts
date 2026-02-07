import { useEffect, useRef, useCallback, useState } from 'react';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION = 10; // 10 seconds countdown

export function useAutoLogout(isAdmin: boolean, logout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setCountdown(WARNING_DURATION);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearAllTimers();
          setShowWarning(false);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    if (!isAdmin) return;
    clearAllTimers();
    setShowWarning(false);
    setCountdown(WARNING_DURATION);
    timerRef.current = setTimeout(startCountdown, INACTIVITY_TIMEOUT);
  }, [isAdmin, startCountdown, clearAllTimers]);

  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isAdmin) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handler = () => {
      // Only reset if warning is NOT showing
      if (!countdownRef.current) {
        resetTimer();
      }
    };
    events.forEach(e => window.addEventListener(e, handler));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [isAdmin, resetTimer, clearAllTimers]);

  return { showWarning, countdown, stayLoggedIn };
}
