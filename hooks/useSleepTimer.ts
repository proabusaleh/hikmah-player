import { useCallback, useEffect, useRef } from 'react';

import { usePlayerStore } from '@/store/usePlayerStore';

export const useSleepTimer = () => {
  const {
    sleepTimerEnd,
    sleepTimerRemaining,
    setSleepTimer,
    clearSleepTimer,
    tickSleepTimer,
  } = usePlayerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sleepTimerEnd) {
      intervalRef.current = setInterval(() => {
        tickSleepTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sleepTimerEnd, tickSleepTimer]);

  const startTimer = useCallback(
    (minutes: number) => {
      setSleepTimer(minutes);
    },
    [setSleepTimer]
  );

  const cancelTimer = useCallback(() => {
    clearSleepTimer();
  }, [clearSleepTimer]);

  const isActive = sleepTimerEnd !== null;
  const formattedRemaining = isActive
    ? `${String(Math.floor(sleepTimerRemaining / 60)).padStart(2, '0')}:${String(
        sleepTimerRemaining % 60
      ).padStart(2, '0')}`
    : null;

  return {
    isActive,
    remainingSeconds: sleepTimerRemaining,
    formattedRemaining,
    startTimer,
    cancelTimer,
  };
};
