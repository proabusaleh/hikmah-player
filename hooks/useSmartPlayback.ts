import { useCallback, useEffect, useRef } from 'react';

import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSmartPlaybackStore } from '@/store/useSmartPlaybackStore';
import { MediaItem } from '@/types/media';

export const useSmartPlayback = () => {
  const {
    config,
    networkState,
    currentQuality,
    qualityDecision,
    currentSkipSegment,
    showSkipButton,
    smartQueue,
    isSmartQueueActive,
    resumeData,
    showResumePrompt,
    startNetworkMonitoring,
    stopNetworkMonitoring,
    checkSkipOpportunity,
    executeSkip,
    generateSmartQueue,
    getNextSmartItem,
    checkResume,
    dismissResume,
    acceptResume,
    recordPlay,
    updateConfig,
    setUserQuality,
    recalculateQuality,
    clearSmartQueue,
  } = useSmartPlaybackStore();

  const { currentTrack, position, duration, status } = usePlayerStore();
  const { progressRecords } = useContinueWatchingStore();
  const { allMedia } = useLibraryStore();

  const skipCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start Network Monitoring ──
  useEffect(() => {
    startNetworkMonitoring();
    return () => stopNetworkMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Periodic Skip Detection (player position is in ms, engine uses seconds) ──
  useEffect(() => {
    if (status === 'playing' && currentTrack && (config.skipIntro || config.skipOutro)) {
      skipCheckIntervalRef.current = setInterval(() => {
        const posSec = position / 1000;
        const durSec = duration / 1000;
        if (durSec > 0) {
          void checkSkipOpportunity(posSec, durSec, currentTrack.id);
        }
      }, 1000);
    }

    return () => {
      if (skipCheckIntervalRef.current) {
        clearInterval(skipCheckIntervalRef.current);
        skipCheckIntervalRef.current = null;
      }
    };
  }, [status, currentTrack, config.skipIntro, config.skipOutro, position, duration, checkSkipOpportunity]);

  // ── Record Play on Track Change ──
  useEffect(() => {
    if (currentTrack && status === 'playing') {
      recordPlay(currentTrack.id);
    }
  }, [currentTrack, status, recordPlay]);

  // ── Generate Smart Queue when current track changes ──
  useEffect(() => {
    if (!currentTrack || !config.smartQueue || allMedia.length === 0) {
      clearSmartQueue();
      return;
    }

    const libraryAsMedia: MediaItem[] = allMedia.map((m) => ({
      id: m.id,
      title: m.title,
      url: m.filePath,
      duration: m.duration,
      type: m.mediaType,
      addedAt: m.addedAt,
      thumbnailUrl: m.thumbnail,
    }));

    generateSmartQueue(currentTrack, libraryAsMedia, progressRecords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, config.smartQueue, allMedia, progressRecords, generateSmartQueue, clearSmartQueue]);

  // ── Check Resume on New Track ──
  useEffect(() => {
    if (!currentTrack) {
      dismissResume();
      return;
    }

    if (!config.autoResume) {
      dismissResume();
      return;
    }

    checkResume(currentTrack.id, progressRecords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, config.autoResume, progressRecords, checkResume, dismissResume]);

  // ── Handle Skip (returns target in seconds) ──
  const handleSkip = useCallback((): number | null => {
    return executeSkip();
  }, [executeSkip]);

  // ── Handle Resume (returns position in seconds) ──
  const handleResume = useCallback((): number | null => {
    return acceptResume();
  }, [acceptResume]);

  // ── Get Next Smart Track ──
  const getNextTrack = useCallback(() => {
    return getNextSmartItem();
  }, [getNextSmartItem]);

  return {
    // Config
    config,
    updateConfig,

    // Network
    networkState,
    isOnline: networkState.type !== 'none',
    isWifi: networkState.type === 'wifi',
    isMetered: networkState.isMetered,

    // Quality
    currentQuality,
    qualityDecision,
    setUserQuality,
    recalculateQuality,

    // Skip
    currentSkipSegment,
    showSkipButton,
    handleSkip,

    // Smart Queue
    smartQueue,
    isSmartQueueActive,
    getNextTrack,

    // Resume
    resumeData,
    showResumePrompt,
    handleResume,
    dismissResume,
  };
};
