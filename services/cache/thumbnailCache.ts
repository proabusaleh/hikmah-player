import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';

const CACHE_DIR = `${FileSystem.cacheDirectory}thumbnails/`;
const MAX_CACHE_SIZE_MB = 100;
const MAX_CACHE_AGE_DAYS = 30;

const getFileSize = (info: FileSystem.FileInfo): number => {
  return info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0;
};

const getModTimeMs = (info: FileSystem.FileInfo): number => {
  return info.exists && 'modificationTime' in info && typeof info.modificationTime === 'number'
    ? info.modificationTime * 1000
    : 0;
};

export const ThumbnailCache = {
  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  },

  /**
   * Generate a cache key from URL
   */
  async getCacheKey(url: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, url);
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    return `${CACHE_DIR}${hash}.${ext}`;
  },

  /**
   * Check if thumbnail is cached
   */
  async isCached(url: string): Promise<boolean> {
    const cachePath = await this.getCacheKey(url);
    const info = await FileSystem.getInfoAsync(cachePath);
    return info.exists;
  },

  /**
   * Pre-cache a list of thumbnails (for upcoming items in list).
   * Prefers expo-image's own disk cache (cheaper than manual download).
   */
  async precacheThumbnails(urls: string[]): Promise<void> {
    const unique = [...new Set(urls.filter(Boolean))].slice(0, 20);
    if (unique.length === 0) return;

    try {
      await Image.prefetch(unique, { cachePolicy: 'memory-disk' });
    } catch {
      // Silently fail for pre-cache
    }
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalFiles: number;
    totalSizeMB: number;
    oldestFile: string;
  }> {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;
      let oldestTime = Date.now();
      let oldestFile = '';

      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
        totalSize += getFileSize(info);
        const modTime = getModTimeMs(info);
        if (modTime > 0 && modTime < oldestTime) {
          oldestTime = modTime;
          oldestFile = file;
        }
      }

      return {
        totalFiles: files.length,
        totalSizeMB: totalSize / (1024 * 1024),
        oldestFile,
      };
    } catch {
      return { totalFiles: 0, totalSizeMB: 0, oldestFile: '' };
    }
  },

  /**
   * Clean expired cache files
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const now = Date.now();
      const maxAge = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
      let cleaned = 0;

      for (const file of files) {
        const path = `${CACHE_DIR}${file}`;
        const info = await FileSystem.getInfoAsync(path);
        const modTime = getModTimeMs(info);
        if (modTime > 0 && now - modTime > maxAge) {
          await FileSystem.deleteAsync(path, { idempotent: true });
          cleaned++;
        }
      }

      return cleaned;
    } catch {
      return 0;
    }
  },

  /**
   * Enforce max cache size (LRU eviction)
   */
  async enforceMaxSize(): Promise<void> {
    const stats = await this.getCacheStats();
    if (stats.totalSizeMB <= MAX_CACHE_SIZE_MB) return;

    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const path = `${CACHE_DIR}${file}`;
          const info = await FileSystem.getInfoAsync(path);
          return {
            path,
            size: getFileSize(info),
            modTime: getModTimeMs(info),
          };
        })
      );

      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.modTime - b.modTime);

      let currentSize = stats.totalSizeMB * 1024 * 1024;
      const targetSize = MAX_CACHE_SIZE_MB * 0.8 * 1024 * 1024; // 80% of max

      for (const fileInfo of fileInfos) {
        if (currentSize <= targetSize) break;
        await FileSystem.deleteAsync(fileInfo.path, { idempotent: true });
        currentSize -= fileInfo.size;
      }
    } catch (error) {
      console.error('[ThumbnailCache] Eviction failed:', error);
    }
  },

  /**
   * Clear entire thumbnail cache
   */
  async clearAll(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await this.initialize();
      // Also clear expo-image memory cache
      await Image.clearMemoryCache();
      await Image.clearDiskCache();
    } catch (error) {
      console.error('[ThumbnailCache] Clear failed:', error);
    }
  },
};
