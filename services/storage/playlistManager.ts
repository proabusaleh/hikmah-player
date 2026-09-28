import { LocalMediaItem } from '@/types/library';
import {
    Playlist,
    PLAYLIST_CONSTRAINTS,
    PlaylistFormData,
    PlaylistWithStats,
    validatePlaylistName,
} from '@/types/playlist';
import { StorageService } from './storageService';

const PLAYLISTS_KEY = '@hikmah_playlists_v2';

export const PlaylistManager = {
  async getAllPlaylists(): Promise<Playlist[]> {
    const playlists = await StorageService.getItem<Playlist[]>(PLAYLISTS_KEY);
    return playlists || [];
  },

  async getPlaylistById(id: string): Promise<Playlist | null> {
    const playlists = await this.getAllPlaylists();
    return playlists.find((p) => p.id === id) || null;
  },

  async createPlaylist(formData: PlaylistFormData): Promise<Playlist> {
    const error = validatePlaylistName(formData.name);
    if (error) throw new Error(error);

    const playlists = await this.getAllPlaylists();
    if (playlists.length >= PLAYLIST_CONSTRAINTS.MAX_PLAYLISTS) {
      throw new Error(`Maximum ${PLAYLIST_CONSTRAINTS.MAX_PLAYLISTS} playlists allowed`);
    }

    const newPlaylist: Playlist = {
      id: `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      coverColor: formData.coverColor,
      coverEmoji: formData.coverEmoji,
      mediaIds: [],
      isSystem: false,
      sortOrder: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    playlists.unshift(newPlaylist);
    await StorageService.setItem(PLAYLISTS_KEY, playlists);
    return newPlaylist;
  },

  async updatePlaylist(id: string, updates: Partial<PlaylistFormData>): Promise<void> {
    if (updates.name) {
      const error = validatePlaylistName(updates.name);
      if (error) throw new Error(error);
    }

    const playlists = await this.getAllPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Playlist not found');

    playlists[index] = {
      ...playlists[index],
      ...updates,
      name: updates.name?.trim() || playlists[index].name,
      description: updates.description?.trim() ?? playlists[index].description,
      updatedAt: Date.now(),
    };

    await StorageService.setItem(PLAYLISTS_KEY, playlists);
  },

  async deletePlaylist(id: string): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    await StorageService.setItem(PLAYLISTS_KEY, filtered);
  },

  async addMediaToPlaylist(playlistId: string, mediaIds: string[]): Promise<number> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) throw new Error('Playlist not found');

    const existingSet = new Set(playlist.mediaIds);
    const newIds = mediaIds.filter((id) => !existingSet.has(id));

    if (playlist.mediaIds.length + newIds.length > PLAYLIST_CONSTRAINTS.MAX_ITEMS_PER_PLAYLIST) {
      throw new Error(`Maximum ${PLAYLIST_CONSTRAINTS.MAX_ITEMS_PER_PLAYLIST} items per playlist`);
    }

    if (newIds.length === 0) return 0;

    playlist.mediaIds = [...playlist.mediaIds, ...newIds];
    playlist.updatedAt = Date.now();
    await StorageService.setItem(PLAYLISTS_KEY, playlists);

    return newIds.length;
  },

  async removeMediaFromPlaylist(playlistId: string, mediaIds: string[]): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const removeSet = new Set(mediaIds);
    playlist.mediaIds = playlist.mediaIds.filter((id) => !removeSet.has(id));
    playlist.updatedAt = Date.now();
    await StorageService.setItem(PLAYLISTS_KEY, playlists);
  },

  async reorderMedia(playlistId: string, fromIndex: number, toIndex: number): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const ids = [...playlist.mediaIds];
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);

    playlist.mediaIds = ids;
    playlist.sortOrder = 'manual';
    playlist.updatedAt = Date.now();
    await StorageService.setItem(PLAYLISTS_KEY, playlists);
  },

  async sortPlaylist(
    playlistId: string,
    sortOrder: Playlist['sortOrder'],
    allMedia: LocalMediaItem[]
  ): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const mediaMap = new Map(allMedia.map((m) => [m.id, m]));

    const sorted = [...playlist.mediaIds].sort((a, b) => {
      const mediaA = mediaMap.get(a);
      const mediaB = mediaMap.get(b);
      if (!mediaA || !mediaB) return 0;

      switch (sortOrder) {
        case 'title':
          return mediaA.title.localeCompare(mediaB.title);
        case 'dateAdded':
          return mediaB.addedAt - mediaA.addedAt;
        case 'duration':
          return mediaA.duration - mediaB.duration;
        default:
          return 0;
      }
    });

    playlist.mediaIds = sorted;
    playlist.sortOrder = sortOrder;
    playlist.updatedAt = Date.now();
    await StorageService.setItem(PLAYLISTS_KEY, playlists);
  },

  async duplicatePlaylist(playlistId: string): Promise<Playlist> {
    const original = await this.getPlaylistById(playlistId);
    if (!original) throw new Error('Playlist not found');

    const created = await this.createPlaylist({
      name: `${original.name} (Copy)`,
      description: original.description,
      coverColor: original.coverColor,
      coverEmoji: original.coverEmoji,
    });

    await this.addMediaToPlaylist(created.id, original.mediaIds);
    return { ...created, mediaIds: [...original.mediaIds] };
  },

  async getPlaylistWithStats(playlistId: string, allMedia: LocalMediaItem[]): Promise<PlaylistWithStats | null> {
    const playlist = await this.getPlaylistById(playlistId);
    if (!playlist) return null;

    const mediaMap = new Map(allMedia.map((m) => [m.id, m]));
    const items = playlist.mediaIds
      .map((id) => mediaMap.get(id))
      .filter(Boolean) as LocalMediaItem[];

    return {
      ...playlist,
      totalItems: items.length,
      totalDuration: items.reduce((sum, m) => sum + m.duration, 0),
      lastPlayed: items.reduce((max, m) => Math.max(max, m.lastPlayed || 0), 0) || null,
      mediaTypes: {
        audio: items.filter((m) => m.mediaType === 'audio').length,
        video: items.filter((m) => m.mediaType === 'video').length,
      },
    };
  },
};
