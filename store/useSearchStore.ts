import { create } from 'zustand';

import { SearchEngine } from '@/services/search/searchEngine';
import { StorageService } from '@/services/storage/storageService';
import {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_CONFIG,
  SearchCategoryGroup,
  SearchDocument,
  SearchFilters,
  SearchHistoryItem,
  SearchResult,
} from '@/types/search';
import { useLibraryStore } from './useLibraryStore';

const HISTORY_KEY = '@hikmah_search_history';

interface SearchState {
  // Query
  query: string;
  debouncedQuery: string;

  // Index
  searchIndex: SearchDocument[];
  isIndexReady: boolean;

  // Results
  results: SearchResult[];
  categoryGroups: SearchCategoryGroup[];
  totalResults: number;
  isSearching: boolean;

  // Filters
  filters: SearchFilters;
  availableCategories: string[];

  // History
  searchHistory: SearchHistoryItem[];
  suggestions: string[];

  // Actions
  buildSearchIndex: () => void;
  setQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  performSearch: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  clearQuery: () => void;

  // History
  loadHistory: () => Promise<void>;
  addToHistory: (query: string, resultCount: number) => Promise<void>;
  removeFromHistory: (query: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Suggestions
  updateSuggestions: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  debouncedQuery: '',
  searchIndex: [],
  isIndexReady: false,
  results: [],
  categoryGroups: [],
  totalResults: 0,
  isSearching: false,
  filters: { ...DEFAULT_SEARCH_FILTERS },
  availableCategories: [],
  searchHistory: [],
  suggestions: [],

  // ── Build Index ──
  buildSearchIndex: () => {
    const { allMedia, playlists } = useLibraryStore.getState();
    const index = SearchEngine.buildIndex(allMedia, playlists);
    const categories = SearchEngine.getCategories(index);
    set({
      searchIndex: index,
      isIndexReady: true,
      availableCategories: categories,
    });
    // Re-run search if a query is already active (e.g. library loaded after)
    if (get().debouncedQuery.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      get().performSearch();
    }
  },

  // ── Query ──
  setQuery: (query) => {
    set({ query });
    get().updateSuggestions();
  },

  setDebouncedQuery: (query) => {
    set({ debouncedQuery: query });
    get().performSearch();
  },

  // ── Search ──
  performSearch: () => {
    const { debouncedQuery, searchIndex, filters } = get();

    if (debouncedQuery.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      set({ results: [], categoryGroups: [], totalResults: 0 });
      return;
    }

    set({ isSearching: true });

    const results = SearchEngine.search(debouncedQuery, searchIndex, filters);

    // Build category groups
    const videoResults = results.filter((r) => r.document.mediaType === 'video');
    const audioResults = results.filter((r) => r.document.mediaType === 'audio');
    const favoriteResults = results.filter((r) => r.document.favorite);
    const recentResults = results
      .filter((r) => r.document.lastPlayed !== null)
      .sort((a, b) => (b.document.lastPlayed || 0) - (a.document.lastPlayed || 0));

    const groups: SearchCategoryGroup[] = [
      {
        category: 'all',
        label: 'All Results',
        results,
        totalCount: results.length,
      },
      {
        category: 'videos',
        label: 'Videos',
        results: videoResults,
        totalCount: videoResults.length,
      },
      {
        category: 'audio',
        label: 'Audio',
        results: audioResults,
        totalCount: audioResults.length,
      },
      {
        category: 'favorites',
        label: 'Favorites',
        results: favoriteResults,
        totalCount: favoriteResults.length,
      },
      {
        category: 'recent',
        label: 'Recently Played',
        results: recentResults,
        totalCount: recentResults.length,
      },
    ];

    set({
      results,
      categoryGroups: groups,
      totalResults: results.length,
      isSearching: false,
    });
  },

  // ── Filters ──
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().performSearch();
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_SEARCH_FILTERS } });
    get().performSearch();
  },

  clearQuery: () => {
    set({
      query: '',
      debouncedQuery: '',
      results: [],
      categoryGroups: [],
      totalResults: 0,
      suggestions: [],
    });
  },

  // ── History ──
  loadHistory: async () => {
    const history = (await StorageService.getItem<SearchHistoryItem[]>(HISTORY_KEY)) || [];
    set({ searchHistory: history });
  },

  addToHistory: async (query, resultCount) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const { searchHistory } = get();
    const filtered = searchHistory.filter((h) => h.query.toLowerCase() !== trimmed.toLowerCase());

    const newItem: SearchHistoryItem = {
      query: trimmed,
      timestamp: Date.now(),
      resultCount,
    };

    const updated = [newItem, ...filtered].slice(0, SEARCH_CONFIG.MAX_HISTORY);
    set({ searchHistory: updated });
    await StorageService.setItem(HISTORY_KEY, updated);
  },

  removeFromHistory: async (query) => {
    const { searchHistory } = get();
    const updated = searchHistory.filter((h) => h.query !== query);
    set({ searchHistory: updated });
    await StorageService.setItem(HISTORY_KEY, updated);
  },

  clearHistory: async () => {
    set({ searchHistory: [] });
    await StorageService.removeItem(HISTORY_KEY);
  },

  // ── Suggestions ──
  updateSuggestions: () => {
    const { query, searchIndex } = get();
    if (query.trim().length < 1) {
      set({ suggestions: [] });
      return;
    }
    const suggestions = SearchEngine.getSuggestions(query, searchIndex);
    set({ suggestions });
  },
}));
