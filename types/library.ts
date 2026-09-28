import { MediaType } from './media';

export interface LocalMediaItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration: number;
  filePath: string;
  mediaType: MediaType;
  fileSize: number;
  mimeType: string;

  progress: number;
  lastPlayed: number | null;
  playCount: number;

  favorite: boolean;
  playlists: string[];

  addedAt: number;
  modifiedAt: number;
}

export interface LibraryPlaylist {
  id: string;
  name: string;
  description?: string;
  coverThumbnail?: string;
  coverColor?: string;
  coverEmoji?: string;
  mediaIds: string[];
  isSystem?: boolean;
  sortOrder?: 'manual' | 'title' | 'dateAdded' | 'duration';
  createdAt: number;
  updatedAt: number;
}

export type LibrarySection =
  | 'all'
  | 'videos'
  | 'audio'
  | 'favorites'
  | 'recentlyPlayed'
  | 'downloads'
  | 'playlists';

export type SortField = 'title' | 'lastPlayed' | 'addedAt' | 'duration' | 'playCount';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}
