import { create } from 'zustand';

import { LibraryDatabase } from '@/services/storage/libraryDatabase';
import { checkPhoneMediaPermission, importPhoneMedia, toPermissionState, type PhoneMediaPermissionState } from '@/services/storage/deviceMedia';
import { MediaScanner } from '@/services/storage/mediaScanner';
import { LibrarySection, LocalMediaItem, SortConfig } from '@/types/library';
import { Playlist } from '@/types/playlist';

interface LibraryState {
  allMedia: LocalMediaItem[];
  playlists: Playlist[];
  activeSection: LibrarySection;
  sortConfig: SortConfig;
  searchQuery: string;

  isLoading: boolean;
  isScanning: boolean;
  lastScanResult: { added: number; total: number } | null;

  isImportingPhoneMedia: boolean;
  phoneMediaResult: { added: number; total: number } | null;
  phoneMediaPermission: PhoneMediaPermissionState;

  getFilteredMedia: () => LocalMediaItem[];
  getVideos: () => LocalMediaItem[];
  getAudio: () => LocalMediaItem[];
  getFavorites: () => LocalMediaItem[];
  getRecentlyPlayed: () => LocalMediaItem[];
  getDownloads: () => LocalMediaItem[];
  getPlaylistMedia: (playlistId: string) => LocalMediaItem[];

  loadLibrary: () => Promise<void>;
  scanDevice: () => Promise<void>;
  importPhoneMedia: () => Promise<'imported' | 'denied' | 'unavailable'>;
  refreshPhoneMediaPermission: () => Promise<PhoneMediaPermissionState>;

  setActiveSection: (section: LibrarySection) => void;
  setSortConfig: (config: SortConfig) => void;
  setSearchQuery: (query: string) => void;

  toggleFavorite: (id: string) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  recordPlayback: (id: string) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;

  createPlaylist: (name: string, description?: string) => Promise<string>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
}

const sortMedia = (items: LocalMediaItem[], config: SortConfig): LocalMediaItem[] => {
  const sorted = [...items];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (config.field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'lastPlayed':
        comparison = (a.lastPlayed || 0) - (b.lastPlayed || 0);
        break;
      case 'addedAt':
        comparison = a.addedAt - b.addedAt;
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'playCount':
        comparison = a.playCount - b.playCount;
        break;
      default:
        comparison = 0;
    }

    return config.order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  allMedia: [],
  playlists: [],
  activeSection: 'all',
  sortConfig: { field: 'addedAt', order: 'desc' },
  searchQuery: '',

  isLoading: false,
  isScanning: false,
  lastScanResult: null,

  isImportingPhoneMedia: false,
  phoneMediaResult: null,
  phoneMediaPermission: 'undetermined',

  getFilteredMedia: () => {
    const { allMedia, activeSection, sortConfig, searchQuery } = get();
    let filtered: LocalMediaItem[];

    switch (activeSection) {
      case 'videos':
        filtered = allMedia.filter((m) => m.mediaType === 'video');
        break;
      case 'audio':
        filtered = allMedia.filter((m) => m.mediaType === 'audio');
        break;
      case 'favorites':
        filtered = allMedia.filter((m) => m.favorite);
        break;
      case 'recentlyPlayed':
        filtered = allMedia
          .filter((m) => m.lastPlayed !== null)
          .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        return filtered;
      case 'downloads':
        filtered = allMedia.filter((m) => m.filePath.includes('hikmah_media'));
        break;
      case 'playlists':
        filtered = [];
        break;
      default:
        filtered = [...allMedia];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.filePath.toLowerCase().includes(query)
      );
    }

    return sortMedia(filtered, sortConfig);
  },

  getVideos: () => get().allMedia.filter((m) => m.mediaType === 'video'),
  getAudio: () => get().allMedia.filter((m) => m.mediaType === 'audio'),
  getFavorites: () => get().allMedia.filter((m) => m.favorite),
  getRecentlyPlayed: () =>
    get()
      .allMedia.filter((m) => m.lastPlayed !== null)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, 20),
  getDownloads: () => get().allMedia.filter((m) => m.filePath.includes('hikmah_media')),
  getPlaylistMedia: (playlistId: string) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return [];

    const mediaMap = new Map(get().allMedia.map((m) => [m.id, m]));
    return playlist.mediaIds
      .map((id) => mediaMap.get(id))
      .filter(Boolean) as LocalMediaItem[];
  },

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const [media, playlists] = await Promise.all([
        LibraryDatabase.getAllMedia(),
        LibraryDatabase.getAllPlaylists(),
      ]);
      set({ allMedia: media, playlists, isLoading: false });
    } catch (error) {
      console.error('[LibraryStore] Load failed:', error);
      set({ isLoading: false });
    }
  },

  scanDevice: async () => {
    set({ isScanning: true });
    try {
      const result = await MediaScanner.scanDeviceStorage();
      set({ lastScanResult: result, isScanning: false });
      await get().loadLibrary();
    } catch (error) {
      console.error('[LibraryStore] Scan failed:', error);
      set({ isScanning: false });
    }
  },

  importPhoneMedia: async () => {
    set({ isImportingPhoneMedia: true });
    try {
      const result = await importPhoneMedia();
      if (result.status === 'imported') {
        set({
          phoneMediaResult: { added: result.added, total: result.total },
          isImportingPhoneMedia: false,
        });
        await get().loadLibrary();
        await get().refreshPhoneMediaPermission();
      } else {
        set({ isImportingPhoneMedia: false });
      }
      return result.status;
    } catch (error) {
      console.error('[LibraryStore] Phone media import failed:', error);
      set({ isImportingPhoneMedia: false });
      return 'unavailable';
    }
  },

  refreshPhoneMediaPermission: async () => {
    try {
      const response = await checkPhoneMediaPermission();
      const state = toPermissionState(response);
      set({ phoneMediaPermission: state });
      return state;
    } catch {
      set({ phoneMediaPermission: 'undetermined' });
      return 'undetermined' as PhoneMediaPermissionState;
    }
  },

  setActiveSection: (section) => set({ activeSection: section }),
  setSortConfig: (config) => set({ sortConfig: config }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleFavorite: async (id: string) => {
    const { allMedia } = get();
    const item = allMedia.find((m) => m.id === id);
    if (!item) return;

    const nextFavorite = !item.favorite;
    await LibraryDatabase.updateMediaItem(id, { favorite: nextFavorite });
    set({
      allMedia: allMedia.map((m) => (m.id === id ? { ...m, favorite: nextFavorite } : m)),
    });
  },

  updateProgress: async (id: string, progress: number) => {
    await LibraryDatabase.updateMediaItem(id, { progress });
    set({
      allMedia: get().allMedia.map((m) => (m.id === id ? { ...m, progress } : m)),
    });
  },

  recordPlayback: async (id: string) => {
    const { allMedia } = get();
    const item = allMedia.find((m) => m.id === id);
    if (!item) return;

    const updates = {
      lastPlayed: Date.now(),
      playCount: item.playCount + 1,
    };

    await LibraryDatabase.updateMediaItem(id, updates);
    set({
      allMedia: allMedia.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });
  },

  removeMedia: async (id: string) => {
    await LibraryDatabase.removeMediaItem(id);
    set({
      allMedia: get().allMedia.filter((m) => m.id !== id),
    });
  },

  createPlaylist: async (name, description = '', coverColor = '#10B981', coverEmoji = '📁') => {
    const id = `pl_${Date.now().toString(36)}`;
    const playlist: Playlist = {
      id,
      name,
      description,
      coverColor,
      coverEmoji,
      mediaIds: [],
      isSystem: false,
      sortOrder: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await LibraryDatabase.createPlaylist(playlist);
    set({ playlists: [playlist, ...get().playlists] });
    return id;
  },

  deletePlaylist: async (id: string) => {
    await LibraryDatabase.deletePlaylist(id);
    set({ playlists: get().playlists.filter((p) => p.id !== id) });
  },

  addToPlaylist: async (playlistId: string, mediaId: string) => {
    const { playlists, allMedia } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.mediaIds.includes(mediaId)) return;

    const updatedIds = [...playlist.mediaIds, mediaId];
    await LibraryDatabase.updatePlaylist(playlistId, { mediaIds: updatedIds });

    const media = allMedia.find((m) => m.id === mediaId);
    if (media && !media.playlists.includes(playlistId)) {
      await LibraryDatabase.updateMediaItem(mediaId, {
        playlists: [...media.playlists, playlistId],
      });
    }

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? { ...p, mediaIds: updatedIds, updatedAt: Date.now() } : p
      ),
      allMedia: allMedia.map((m) =>
        m.id === mediaId && !m.playlists.includes(playlistId)
          ? { ...m, playlists: [...m.playlists, playlistId] }
          : m
      ),
    });
  },

  removeFromPlaylist: async (playlistId: string, mediaId: string) => {
    const { playlists, allMedia } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updatedIds = playlist.mediaIds.filter((id) => id !== mediaId);
    await LibraryDatabase.updatePlaylist(playlistId, { mediaIds: updatedIds });

    const media = allMedia.find((m) => m.id === mediaId);
    if (media) {
      await LibraryDatabase.updateMediaItem(mediaId, {
        playlists: media.playlists.filter((id) => id !== playlistId),
      });
    }

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? { ...p, mediaIds: updatedIds, updatedAt: Date.now() } : p
      ),
      allMedia: allMedia.map((m) =>
        m.id === mediaId
          ? { ...m, playlists: m.playlists.filter((id) => id !== playlistId) }
          : m
      ),
    });
  },

  renamePlaylist: async (id: string, name: string) => {
    await LibraryDatabase.updatePlaylist(id, { name });
    set({
      playlists: get().playlists.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      ),
    });
  },
}));
