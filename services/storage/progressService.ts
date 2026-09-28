import { PlaybackProgress, PROGRESS_CONFIG } from '@/types/progress';
import { StorageService } from './storageService';

const STORAGE_KEY = '@hikmah_playback_progress';

export const ProgressService = {
  async getAllProgress(): Promise<PlaybackProgress[]> {
    const records = await StorageService.getItem<PlaybackProgress[]>(STORAGE_KEY);
    return records || [];
  },

  async saveProgress(progress: PlaybackProgress): Promise<void> {
    try {
      const allRecords = await this.getAllProgress();
      const filtered = allRecords.filter((record) => record.mediaId !== progress.mediaId);
      filtered.unshift(progress);
      const trimmed = filtered.slice(0, PROGRESS_CONFIG.MAX_HISTORY_ITEMS);
      await StorageService.setItem(STORAGE_KEY, trimmed);
    } catch (error) {
      console.error('[ProgressService] Save failed:', error);
    }
  },

  async getProgress(mediaId: string): Promise<PlaybackProgress | null> {
    const allRecords = await this.getAllProgress();
    return allRecords.find((record) => record.mediaId === mediaId) || null;
  },

  async deleteProgress(mediaId: string): Promise<void> {
    const allRecords = await this.getAllProgress();
    const filtered = allRecords.filter((record) => record.mediaId !== mediaId);
    await StorageService.setItem(STORAGE_KEY, filtered);
  },

  async markAsFinished(mediaId: string): Promise<void> {
    await this.deleteProgress(mediaId);
  },

  async getContinueWatchingItems(): Promise<PlaybackProgress[]> {
    const allRecords = await this.getAllProgress();
    const now = Date.now();
    const expiryMs = PROGRESS_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    return allRecords.filter((record) => {
      const expired = now - record.updatedAt > expiryMs;
      if (expired) return false;

      const percent = record.progressPercent;
      return (
        percent >= PROGRESS_CONFIG.MIN_DISPLAY_PERCENT &&
        percent <= PROGRESS_CONFIG.MAX_DISPLAY_PERCENT
      );
    });
  },

  async cleanup(): Promise<number> {
    const allRecords = await this.getAllProgress();
    const now = Date.now();
    const expiryMs = PROGRESS_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const validRecords = allRecords.filter((record) => now - record.updatedAt <= expiryMs);
    const removedCount = allRecords.length - validRecords.length;

    if (removedCount > 0) {
      await StorageService.setItem(STORAGE_KEY, validRecords);
    }

    return removedCount;
  },

  async clearAll(): Promise<void> {
    await StorageService.removeItem(STORAGE_KEY);
  },
};
