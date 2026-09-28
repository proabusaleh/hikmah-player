import { create } from 'zustand';

import { ProgressService } from '@/services/storage/progressService';
import { ContinueWatchingFilter, PlaybackProgress, PROGRESS_CONFIG } from '@/types/progress';

interface ContinueWatchingState {
  progressRecords: PlaybackProgress[];
  continueWatchingItems: PlaybackProgress[];
  filter: ContinueWatchingFilter;
  isLoading: boolean;

  loadProgress: () => Promise<void>;
  refreshContinueWatching: () => Promise<void>;

  saveProgress: (data: {
    mediaId: string;
    title: string;
    thumbnailUrl?: string;
    mediaType: 'audio' | 'video';
    sourceUrl: string;
    position: number;
    duration: number;
    speakerOrArtist?: string;
    playlistId?: string;
  }) => Promise<void>;

  getResumePosition: (mediaId: string) => number | null;
  clearProgress: (mediaId: string) => Promise<void>;
  markFinished: (mediaId: string) => Promise<void>;

  setFilter: (filter: ContinueWatchingFilter) => void;
  getFilteredItems: () => PlaybackProgress[];

  cleanupExpired: () => Promise<void>;
  clearAllProgress: () => Promise<void>;
}

export const useContinueWatchingStore = create<ContinueWatchingState>((set, get) => ({
  progressRecords: [],
  continueWatchingItems: [],
  filter: 'all',
  isLoading: false,

  loadProgress: async () => {
    set({ isLoading: true });
    try {
      const [allRecords, continueItems] = await Promise.all([
        ProgressService.getAllProgress(),
        ProgressService.getContinueWatchingItems(),
      ]);
      set({
        progressRecords: allRecords,
        continueWatchingItems: continueItems,
        isLoading: false,
      });
    } catch (error) {
      console.error('[ContinueWatchingStore] Load failed:', error);
      set({ isLoading: false });
    }
  },

  refreshContinueWatching: async () => {
    const items = await ProgressService.getContinueWatchingItems();
    set({ continueWatchingItems: items });
  },

  saveProgress: async (data) => {
    const { position, duration } = data;

    if (position < PROGRESS_CONFIG.MIN_SAVE_THRESHOLD) return;

    const progressPercent = duration > 0 ? Math.round((position / duration) * 100) : 0;

    if (progressPercent > PROGRESS_CONFIG.MAX_DISPLAY_PERCENT) {
      await ProgressService.markAsFinished(data.mediaId);
      await get().refreshContinueWatching();
      return;
    }

    const existing = get().progressRecords.find((record) => record.mediaId === data.mediaId);

    const record: PlaybackProgress = {
      mediaId: data.mediaId,
      title: data.title,
      thumbnailUrl: data.thumbnailUrl,
      mediaType: data.mediaType,
      sourceUrl: data.sourceUrl,
      position,
      duration,
      progressPercent,
      updatedAt: Date.now(),
      startedAt: existing?.startedAt || Date.now(),
      speakerOrArtist: data.speakerOrArtist,
      playlistId: data.playlistId,
    };

    await ProgressService.saveProgress(record);
    set((state) => {
      const filtered = state.progressRecords.filter((item) => item.mediaId !== data.mediaId);
      return { progressRecords: [record, ...filtered] };
    });
    await get().refreshContinueWatching();
  },

  getResumePosition: (mediaId) => {
    const record = get().progressRecords.find((item) => item.mediaId === mediaId);
    return record ? record.position : null;
  },

  clearProgress: async (mediaId) => {
    await ProgressService.deleteProgress(mediaId);
    set((state) => ({
      progressRecords: state.progressRecords.filter((item) => item.mediaId !== mediaId),
    }));
    await get().refreshContinueWatching();
  },

  markFinished: async (mediaId) => {
    await ProgressService.markAsFinished(mediaId);
    set((state) => ({
      progressRecords: state.progressRecords.filter((item) => item.mediaId !== mediaId),
    }));
    await get().refreshContinueWatching();
  },

  setFilter: (filter) => set({ filter }),

  getFilteredItems: () => {
    const { continueWatchingItems, filter } = get();
    if (filter === 'all') return continueWatchingItems;
    return continueWatchingItems.filter((item) => item.mediaType === filter);
  },

  cleanupExpired: async () => {
    const removedCount = await ProgressService.cleanup();
    if (removedCount > 0) {
      await get().loadProgress();
    }
  },

  clearAllProgress: async () => {
    await ProgressService.clearAll();
    set({ progressRecords: [], continueWatchingItems: [] });
  },
}));
