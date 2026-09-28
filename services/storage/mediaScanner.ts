import * as FileSystem from 'expo-file-system/legacy';

import { LocalMediaItem } from '@/types/library';
import { MediaType } from '@/types/media';

import { LibraryDatabase } from './libraryDatabase';

const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac', 'wma'];
const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv'];

const generateId = (filePath: string): string => {
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `local_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
};

const getExtension = (filePath: string): string => {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

const getMediaType = (extension: string): MediaType | null => {
  if (AUDIO_EXTENSIONS.includes(extension)) return 'audio';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return null;
};

const getMimeType = (extension: string): string => {
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    wma: 'audio/x-ms-wma',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    webm: 'video/webm',
    '3gp': 'video/3gpp',
    flv: 'video/x-flv',
  };
  return mimeMap[extension] || 'application/octet-stream';
};

const extractTitle = (filePath: string): string => {
  const fileName = filePath.split('/').pop() || 'Unknown';
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
};

export const MediaScanner = {
  async scanDirectory(dirUri: string): Promise<LocalMediaItem[]> {
    const foundItems: LocalMediaItem[] = [];
    const normalizedDir = dirUri.endsWith('/') ? dirUri : `${dirUri}/`;

    try {
      const entries = await FileSystem.readDirectoryAsync(normalizedDir);

      for (const entry of entries) {
        const fullPath = `${normalizedDir}${entry}`;
        const fileInfo = await FileSystem.getInfoAsync(fullPath);

        if (fileInfo.isDirectory === true) {
          const subItems = await this.scanDirectory(`${fullPath}/`);
          foundItems.push(...subItems);
        } else if (fileInfo.exists && fileInfo.isDirectory === false && typeof fileInfo.size === 'number' && fileInfo.size > 0) {
          const ext = getExtension(entry);
          const mediaType = getMediaType(ext);

          if (mediaType) {
            const item: LocalMediaItem = {
              id: generateId(fullPath),
              title: extractTitle(entry),
              duration: 0,
              filePath: fullPath,
              mediaType,
              fileSize: fileInfo.size,
              mimeType: getMimeType(ext),
              progress: 0,
              lastPlayed: null,
              playCount: 0,
              favorite: false,
              playlists: [],
              addedAt: Date.now(),
              modifiedAt: Date.now(),
            };
            foundItems.push(item);
          }
        }
      }
    } catch (error) {
      console.warn(`[MediaScanner] Cannot read directory ${normalizedDir}:`, error);
    }

    return foundItems;
  },

  async scanDeviceStorage(): Promise<{ added: number; total: number }> {
    const existingItems = await LibraryDatabase.getAllMedia();
    const existingPaths = new Set(existingItems.map((i) => i.filePath));

    const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? 'file:///cache/';
    const directoriesToScan = [
      baseDirectory,
      `${baseDirectory}hikmah_media/`,
    ];

    let allFound: LocalMediaItem[] = [];

    for (const dir of directoriesToScan) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (dirInfo.exists && dirInfo.isDirectory === true) {
          const items = await this.scanDirectory(dir);
          allFound.push(...items);
        }
      } catch {
        // Skip inaccessible directories.
      }
    }

    const newItems = allFound.filter((item) => !existingPaths.has(item.filePath));

    if (newItems.length > 0) {
      const merged = [...newItems, ...existingItems];
      await LibraryDatabase.saveAllMedia(merged);
    }

    return {
      added: newItems.length,
      total: existingItems.length + newItems.length,
    };
  },

  async addFileToLibrary(filePath: string): Promise<LocalMediaItem | null> {
    const ext = getExtension(filePath);
    const mediaType = getMediaType(ext);

    if (!mediaType) return null;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists || fileInfo.isDirectory === true || typeof fileInfo.size !== 'number') return null;

    const item: LocalMediaItem = {
      id: generateId(filePath),
      title: extractTitle(filePath),
      duration: 0,
      filePath,
      mediaType,
      fileSize: fileInfo.size || 0,
      mimeType: getMimeType(ext),
      progress: 0,
      lastPlayed: null,
      playCount: 0,
      favorite: false,
      playlists: [],
      addedAt: Date.now(),
      modifiedAt: Date.now(),
    };

    await LibraryDatabase.addMediaItem(item);
    return item;
  },
};
