export type MediaType = 'audio' | 'video';

export interface MediaItem {
  id: string;
  title: string;
  artistOrSpeaker?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  type: MediaType;
  isLocal?: boolean;
  sizeInBytes?: number;
  addedAt: number;
}

export type PlaybackStatus =
  | 'idle'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error';

export type RepeatMode = 'off' | 'all' | 'one';
