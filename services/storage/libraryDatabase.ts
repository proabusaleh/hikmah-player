import { LocalMediaItem } from '@/types/library';
import { Playlist } from '@/types/playlist';
import { StorageService } from './storageService';

const KEYS = {
  MEDIA_ITEMS: '@hikmah_library_media',
  PLAYLISTS: '@hikmah_library_playlists',
} as const;

export const LibraryDatabase = {
  async getAllMedia(): Promise<LocalMediaItem[]> {
    const items = await StorageService.getItem<LocalMediaItem[]>(KEYS.MEDIA_ITEMS);
    return items || [];
  },

  async saveAllMedia(items: LocalMediaItem[]): Promise<void> {
    await StorageService.setItem(KEYS.MEDIA_ITEMS, items);
  },

  async addMediaItem(item: LocalMediaItem): Promise<void> {
    const items = await this.getAllMedia();
    const exists = items.find((i) => i.id === item.id);
    if (!exists) {
      items.unshift(item);
      await this.saveAllMedia(items);
    }
  },

  async updateMediaItem(id: string, updates: Partial<LocalMediaItem>): Promise<void> {
    const items = await this.getAllMedia();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        modifiedAt: Date.now(),
      };
      await this.saveAllMedia(items);
    }
  },

  async removeMediaItem(id: string): Promise<void> {
    const items = await this.getAllMedia();
    const filtered = items.filter((i) => i.id !== id);
    await this.saveAllMedia(filtered);
  },

  async getMediaById(id: string): Promise<LocalMediaItem | null> {
    const items = await this.getAllMedia();
    return items.find((i) => i.id === id) || null;
  },

  async getAllPlaylists(): Promise<Playlist[]> {
    const playlists = await StorageService.getItem<Playlist[]>(KEYS.PLAYLISTS);
    return playlists || [];
  },

  async saveAllPlaylists(playlists: Playlist[]): Promise<void> {
    await StorageService.setItem(KEYS.PLAYLISTS, playlists);
  },

  async createPlaylist(playlist: Playlist): Promise<void> {
    const playlists = await this.getAllPlaylists();
    playlists.unshift(playlist);
    await this.saveAllPlaylists(playlists);
  },

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index !== -1) {
      playlists[index] = {
        ...playlists[index],
        ...updates,
        updatedAt: Date.now(),
      };
      await this.saveAllPlaylists(playlists);
    }
  },

  async deletePlaylist(id: string): Promise<void> {
    const playlists = await this.getAllPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    await this.saveAllPlaylists(filtered);
  },

  async clearAll(): Promise<void> {
    await StorageService.removeItem(KEYS.MEDIA_ITEMS);
    await StorageService.removeItem(KEYS.PLAYLISTS);
  },
};
