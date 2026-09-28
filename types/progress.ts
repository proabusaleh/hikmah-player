export interface PlaybackProgress {
  mediaId: string;
  title: string;
  thumbnailUrl?: string;
  mediaType: 'audio' | 'video';
  sourceUrl: string;
  position: number;
  duration: number;
  progressPercent: number;
  updatedAt: number;
  startedAt: number;
  speakerOrArtist?: string;
  playlistId?: string;
}

export type ContinueWatchingFilter = 'all' | 'video' | 'audio';

export const PROGRESS_CONFIG = {
  MIN_SAVE_THRESHOLD: 5,
  AUTO_SAVE_INTERVAL: 3000,
  MIN_DISPLAY_PERCENT: 2,
  MAX_DISPLAY_PERCENT: 95,
  MAX_HISTORY_ITEMS: 100,
  EXPIRY_DAYS: 90,
} as const;
