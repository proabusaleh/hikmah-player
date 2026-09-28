import { create } from 'zustand';

import { StorageKeys } from '@/constants/colors';
import { ContentNotifications } from '@/services/notifications/contentNotifications';
import { DownloadService } from '@/services/storage/downloadService';
import { StorageService } from '@/services/storage/storageService';
import { MediaItem } from '@/types/media';

interface DownloadsState {
  downloadedItems: MediaItem[];
  downloadProgress: Record<string, number>;
  isDownloading: Record<string, boolean>;

  loadDownloads: () => Promise<void>;
  startDownload: (item: MediaItem) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  isItemDownloaded: (id: string) => boolean;
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  downloadedItems: [],
  downloadProgress: {},
  isDownloading: {},

  loadDownloads: async () => {
    const items = await StorageService.getItem<MediaItem[]>(StorageKeys.DOWNLOADS_METADATA);
    if (items) {
      set({ downloadedItems: items });
    }
  },

  startDownload: async (item: MediaItem) => {
    const { isDownloading, downloadedItems } = get();
    if (isDownloading[item.id]) {
      return;
    }

    set((state) => ({
      isDownloading: { ...state.isDownloading, [item.id]: true },
      downloadProgress: { ...state.downloadProgress, [item.id]: 0 },
    }));

    try {
      const downloadedItem = await DownloadService.downloadFile(item, (progress) => {
        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            [item.id]: progress,
          },
        }));

        // Silent progress notification (throttled to ≥10% steps inside).
        void ContentNotifications.showDownloadProgress(item.id, item.title, progress, 0, 0);
      });

      const updatedList = [downloadedItem, ...downloadedItems];
      set({ downloadedItems: updatedList });
      await StorageService.setItem(StorageKeys.DOWNLOADS_METADATA, updatedList);

      const fileSizeMB = (downloadedItem.sizeInBytes || 0) / (1024 * 1024);
      await ContentNotifications.showDownloadComplete(item.id, item.title, item.type, fileSizeMB);
    } catch (error) {
      console.error(`[useDownloadsStore] Download failed for ${item.title}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ContentNotifications.showDownloadFailed(item.id, item.title, message);
    } finally {
      set((state) => {
        const nextIsDownloading = { ...state.isDownloading };
        delete nextIsDownloading[item.id];

        return { isDownloading: nextIsDownloading };
      });
    }
  },

  removeDownload: async (id: string) => {
    const { downloadedItems } = get();
    const itemToDelete = downloadedItems.find((item) => item.id === id);

    if (!itemToDelete) {
      return;
    }

    await DownloadService.deleteLocalFile(itemToDelete.url);

    const updatedList = downloadedItems.filter((item) => item.id !== id);
    set({ downloadedItems: updatedList });
    await StorageService.setItem(StorageKeys.DOWNLOADS_METADATA, updatedList);
  },

  isItemDownloaded: (id: string) => {
    return get().downloadedItems.some((item) => item.id === id);
  },
}));
