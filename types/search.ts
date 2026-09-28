import { MediaType } from './media';

// ─── Searchable Document ─────────────────────────────
export interface SearchDocument {
  id: string;
  title: string;
  artistOrSpeaker: string;
  category: string; // e.g., 'Tafsir', 'Arabic Course', 'Quran'
  playlistNames: string[]; // Names of playlists this item belongs to
  filename: string; // Original filename without extension
  tags: string[]; // User-defined or auto-generated tags
  mediaType: MediaType;
  sourceUrl: string;
  thumbnailUrl?: string;
  duration: number;
  isLocal: boolean;
  lastPlayed: number | null;
  playCount: number;
  favorite: boolean;
}

// ─── Search Result ───────────────────────────────────
export interface SearchResult {
  document: SearchDocument;
  score: number; // Relevance score (0-1)
  matchedFields: string[]; // Which fields matched
  highlightTitle: string; // Title with match highlighted
}

// ─── Search Category Group ───────────────────────────
export interface SearchCategoryGroup {
  category: 'all' | 'videos' | 'audio' | 'playlists' | 'favorites' | 'recent';
  label: string;
  results: SearchResult[];
  totalCount: number;
}

// ─── Search Filters ──────────────────────────────────
export interface SearchFilters {
  mediaType: 'all' | 'audio' | 'video';
  category: string; // Empty = all categories
  isLocal: boolean | null; // null = both
  isFavorite: boolean | null;
  minDuration: number; // seconds, 0 = no filter
  maxDuration: number; // seconds, 0 = no filter
  sortBy: 'relevance' | 'title' | 'recent' | 'duration' | 'popular';
}

// ─── Search History ──────────────────────────────────
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

// ─── Search Config ───────────────────────────────────
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 1,
  MAX_RESULTS: 50,
  MAX_HISTORY: 20,
  DEBOUNCE_MS: 300,
  FIELD_WEIGHTS: {
    title: 10,
    artistOrSpeaker: 7,
    tags: 6,
    category: 5,
    playlistNames: 4,
    filename: 3,
  } as const,
} as const;

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  mediaType: 'all',
  category: '',
  isLocal: null,
  isFavorite: null,
  minDuration: 0,
  maxDuration: 0,
  sortBy: 'relevance',
};
