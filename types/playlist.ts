export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  coverEmoji: string;
  mediaIds: string[];
  isSystem: boolean;
  sortOrder: 'manual' | 'title' | 'dateAdded' | 'duration';
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistWithStats extends Playlist {
  totalItems: number;
  totalDuration: number;
  lastPlayed: number | null;
  mediaTypes: {
    audio: number;
    video: number;
  };
}

export interface PlaylistFormData {
  name: string;
  description: string;
  coverColor: string;
  coverEmoji: string;
}

export type PlaylistAction =
  | 'play'
  | 'shuffle'
  | 'rename'
  | 'edit'
  | 'delete'
  | 'addMedia'
  | 'share';

export const PLAYLIST_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  MAX_PLAYLISTS: 100,
  MAX_ITEMS_PER_PLAYLIST: 500,
} as const;

export const PLAYLIST_COVER_COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
] as const;

export const PLAYLIST_COVER_EMOJIS = [
  '📁', '🎵', '🎬', '📚', '🕌', '🌙',
  '⭐', '🎧', '📖', '🎤', '💡', '🤲',
  '📝', '🏫', '🌍', '❤️', '🔖', '📌',
] as const;

export const validatePlaylistName = (name: string): string | null => {
  const trimmed = name.trim();
  if (trimmed.length < PLAYLIST_CONSTRAINTS.NAME_MIN_LENGTH) {
    return 'Playlist name cannot be empty';
  }
  if (trimmed.length > PLAYLIST_CONSTRAINTS.NAME_MAX_LENGTH) {
    return `Name must be under ${PLAYLIST_CONSTRAINTS.NAME_MAX_LENGTH} characters`;
  }
  return null;
};

export const validatePlaylistDescription = (desc: string): string | null => {
  if (desc.length > PLAYLIST_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
    return `Description must be under ${PLAYLIST_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`;
  }
  return null;
};
