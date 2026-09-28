import {
  Asset,
  AssetField,
  MediaType as DeviceMediaType,
  Query,
  getPermissionsAsync,
  requestPermissionsAsync,
  type PermissionResponse,
} from 'expo-media-library';

import { LocalMediaItem } from '@/types/library';
import { MediaType } from '@/types/media';

import { LibraryDatabase } from './libraryDatabase';

const PAGE_SIZE = 200;
const GRANULAR_PERMISSIONS = ['audio', 'video'] as const;

export type PhoneMediaPermissionState = 'granted' | 'limited' | 'denied' | 'undetermined';

export interface PhoneMediaImportResult {
  status: 'imported' | 'denied' | 'unavailable';
  added: number;
  total: number;
}

// ─── Permission helpers ──────────────────────────────

/** Check current media-library permission without prompting. */
export async function checkPhoneMediaPermission(): Promise<PermissionResponse> {
  return getPermissionsAsync(false, [...GRANULAR_PERMISSIONS]);
}

/** Ask the user for video + audio access. */
export async function requestPhoneMediaPermission(): Promise<PermissionResponse> {
  return requestPermissionsAsync(false, [...GRANULAR_PERMISSIONS]);
}

export function toPermissionState(response: PermissionResponse): PhoneMediaPermissionState {
  if (response.granted) {
    return response.accessPrivileges === 'limited' ? 'limited' : 'granted';
  }
  return response.status === 'denied' && response.canAskAgain === false
    ? 'denied'
    : 'undetermined';
}

// ─── Asset mapping ───────────────────────────────────

const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

const getMimeType = (extension: string, mediaType: MediaType): string => {
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    opus: 'audio/opus',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    webm: 'video/webm',
    '3gp': 'video/3gpp',
  };
  return mimeMap[extension] || (mediaType === 'audio' ? 'audio/*' : 'video/*');
};

const prettifyTitle = (filename: string): string =>
  filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() ||
  'Unknown';

async function mapAssetToMediaItem(
  metadata: { id: string; filename: string | null; duration: number | null; creationTime: number | null; isFavorite: boolean },
  mediaType: MediaType
): Promise<LocalMediaItem | null> {
  try {
    const asset = new Asset(metadata.id);
    const uri = await asset.getUri();
    if (!uri) return null;

    const filename = metadata.filename || uri.split('/').pop() || 'Unknown';
    const durationMs = metadata.duration ?? 0;

    return {
      // Asset IDs are stable (content:// URI on Android), so re-scans dedupe cleanly.
      id: `device_${metadata.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-64)}`,
      title: prettifyTitle(filename),
      duration: Math.round(durationMs / 1000),
      filePath: uri,
      mediaType,
      fileSize: 0,
      mimeType: getMimeType(getExtension(filename), mediaType),
      progress: 0,
      lastPlayed: null,
      playCount: 0,
      favorite: metadata.isFavorite === true,
      playlists: [],
      addedAt: metadata.creationTime ?? Date.now(),
      modifiedAt: Date.now(),
    };
  } catch (error) {
    console.warn('[DeviceMedia] Skipping unreadable asset:', error);
    return null;
  }
}

// ─── Import ──────────────────────────────────────────

/**
 * Import the phone's real videos + audio into the library.
 * Returns `denied` when permission is missing so the UI can guide
 * the user to Settings, `unavailable` when the media store is missing.
 */
export async function importPhoneMedia(
  onProgress?: (imported: number, total: number) => void
): Promise<PhoneMediaImportResult> {
  let permission = await checkPhoneMediaPermission();
  if (!permission.granted) {
    permission = await requestPhoneMediaPermission();
  }
  if (!permission.granted) {
    return { status: 'denied', added: 0, total: 0 };
  }

  const existing = await LibraryDatabase.getAllMedia();
  const existingIds = new Set(existing.map((i) => i.id));

  const targets: { deviceType: DeviceMediaType; appType: MediaType }[] = [
    { deviceType: DeviceMediaType.VIDEO, appType: 'video' },
    { deviceType: DeviceMediaType.AUDIO, appType: 'audio' },
  ];

  const fresh: LocalMediaItem[] = [];

  for (const { deviceType, appType } of targets) {
    let offset = 0;
    // Paginate until a short page arrives.
    for (;;) {
      let page;
      try {
        page = await new Query()
          .eq(AssetField.MEDIA_TYPE, deviceType)
          .orderBy(AssetField.CREATION_TIME)
          .limit(PAGE_SIZE)
          .offset(offset)
          .exeForMetadata();
      } catch (error) {
        console.warn('[DeviceMedia] Media store query failed:', error);
        return { status: 'unavailable', added: fresh.length, total: existing.length + fresh.length };
      }

      if (page.length === 0) break;

      for (const meta of page) {
        const item = await mapAssetToMediaItem(meta, appType);
        if (item && !existingIds.has(item.id)) {
          existingIds.add(item.id);
          fresh.push(item);
        }
      }

      offset += page.length;
      onProgress?.(fresh.length, offset);
      if (page.length < PAGE_SIZE) break;
    }
  }

  if (fresh.length > 0) {
    await LibraryDatabase.saveAllMedia([...fresh, ...existing]);
  }

  return { status: 'imported', added: fresh.length, total: existing.length + fresh.length };
}
