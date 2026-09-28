import * as FileSystem from 'expo-file-system/legacy';

import { MediaItem } from '@/types/media';

const BASE_DIRECTORY =
  FileSystem.documentDirectory ??
  `${FileSystem.cacheDirectory ?? 'file://cache/'}`;
const MEDIA_DIRECTORY = `${BASE_DIRECTORY.replace(/\/+$/, '')}/hikmah_media/`;

const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIRECTORY, { intermediates: true });
  }
};

export const DownloadService = {
  async downloadFile(
    item: MediaItem,
    onProgress?: (progressFraction: number) => void
  ): Promise<MediaItem> {
    await ensureDirectoryExists();

    const fileExtension = item.type === 'video' ? 'mp4' : 'mp3';
    const localUri = `${MEDIA_DIRECTORY}${item.id}_${Date.now()}.${fileExtension}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      item.url,
      localUri,
      {},
      (downloadProgress) => {
        const total = downloadProgress.totalBytesExpectedToWrite;
        const written = downloadProgress.totalBytesWritten;
        const progress = total > 0 ? written / total : 0;

        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result || !result.uri) {
      throw new Error('Download failed: No URI returned');
    }

    const fileInfo = await FileSystem.getInfoAsync(result.uri);

    const downloadedItem: MediaItem = {
      ...item,
      url: result.uri,
      isLocal: true,
      sizeInBytes: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
      addedAt: Date.now(),
    };

    return downloadedItem;
  },

  async deleteLocalFile(fileUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (error) {
      console.error('[DownloadService] Error deleting file:', error);
      throw error;
    }
  },
};
