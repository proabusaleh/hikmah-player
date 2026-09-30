import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

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

const fileNameFor = (item: MediaItem): string => {
  const extension = item.type === 'video' ? 'mp4' : 'mp3';
  const safeTitle = item.title.replace(/[^\w\- ]+/g, '').trim() || item.id;
  return `${safeTitle}.${extension}`;
};

const triggerBrowserDownload = (href: string, filename: string): void => {
  if (typeof document === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

/**
 * Web has no app-local file system (`expo-file-system` throws
 * UnavailabilityError), so "download" means saving through the browser.
 * The library entry keeps the remote URL (streamed on playback) with the
 * recorded byte size.
 */
const downloadOnWeb = async (
  item: MediaItem,
  onProgress?: (progressFraction: number) => void
): Promise<MediaItem> => {
  const filename = fileNameFor(item);

  try {
    const response = await fetch(item.url);
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }
    const total = Number(response.headers.get('content-length') ?? 0);
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (onProgress) {
        onProgress(total > 0 ? received / total : 0);
      }
    }
    const blob = new Blob(chunks, {
      type: item.type === 'video' ? 'video/mp4' : 'audio/mpeg',
    });
    const objectUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    if (onProgress) {
      onProgress(1);
    }
    return {
      ...item,
      url: item.url,
      isLocal: false,
      sizeInBytes: received,
      addedAt: Date.now(),
    };
  } catch {
    // fetch can fail on CORS-blocked hosts — let the browser handle the
    // download directly instead of surfacing an error.
    triggerBrowserDownload(item.url, filename);
    if (onProgress) {
      onProgress(1);
    }
    return {
      ...item,
      url: item.url,
      isLocal: false,
      addedAt: Date.now(),
    };
  }
};

export const DownloadService = {
  async downloadFile(
    item: MediaItem,
    onProgress?: (progressFraction: number) => void
  ): Promise<MediaItem> {
    if (Platform.OS === 'web') {
      return downloadOnWeb(item, onProgress);
    }

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
    // Web entries point at remote URLs — nothing on disk to delete.
    if (Platform.OS === 'web' || fileUri.startsWith('http') || fileUri.startsWith('blob:')) {
      return;
    }
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
