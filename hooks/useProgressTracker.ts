import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { PROGRESS_CONFIG } from '@/types/progress';

export const useProgressTracker = () => {
  const { currentTrack, position, duration, status } = usePlayerStore();
  const { saveProgress, getResumePosition } = useContinueWatchingStore();

  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedPositionRef = useRef(0);

  useEffect(() => {
    if (status === 'playing' && currentTrack) {
      saveIntervalRef.current = setInterval(() => {
        const currentPositionSec = position / 1000;
        const durationSec = duration / 1000;

        if (
          Math.abs(currentPositionSec - lastSavedPositionRef.current) >= 2 &&
          durationSec > 0
        ) {
          void saveProgress({
            mediaId: currentTrack.id,
            title: currentTrack.title,
            thumbnailUrl: currentTrack.thumbnailUrl,
            mediaType: currentTrack.type,
            sourceUrl: currentTrack.url,
            position: currentPositionSec,
            duration: durationSec,
            speakerOrArtist: currentTrack.artistOrSpeaker,
          });
          lastSavedPositionRef.current = currentPositionSec;
        }
      }, PROGRESS_CONFIG.AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [status, currentTrack, position, duration, saveProgress]);

  useEffect(() => {
    if ((status === 'paused' || status === 'stopped') && currentTrack && position > 0) {
      const currentPositionSec = position / 1000;
      const durationSec = duration / 1000;

      if (durationSec > 0) {
        void saveProgress({
          mediaId: currentTrack.id,
          title: currentTrack.title,
          thumbnailUrl: currentTrack.thumbnailUrl,
          mediaType: currentTrack.type,
          sourceUrl: currentTrack.url,
          position: currentPositionSec,
          duration: durationSec,
          speakerOrArtist: currentTrack.artistOrSpeaker,
        });
        lastSavedPositionRef.current = currentPositionSec;
      }
    }
  }, [status, currentTrack, position, duration, saveProgress]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        (nextState === 'background' || nextState === 'inactive') &&
        currentTrack &&
        position > 0
      ) {
        const currentPositionSec = position / 1000;
        const durationSec = duration / 1000;

        if (durationSec > 0) {
          void saveProgress({
            mediaId: currentTrack.id,
            title: currentTrack.title,
            thumbnailUrl: currentTrack.thumbnailUrl,
            mediaType: currentTrack.type,
            sourceUrl: currentTrack.url,
            position: currentPositionSec,
            duration: durationSec,
            speakerOrArtist: currentTrack.artistOrSpeaker,
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [currentTrack, position, duration, saveProgress]);

  useEffect(() => {
    lastSavedPositionRef.current = 0;
  }, [currentTrack?.id]);

  const getResumeTime = useCallback(
    (mediaId: string): number | null => getResumePosition(mediaId),
    [getResumePosition]
  );

  return {
    getResumeTime,
    isTracking: status === 'playing' && currentTrack !== null,
  };
};
