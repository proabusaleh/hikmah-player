import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { MediaItem } from '@/types/media';

import {
  NotificationCategories,
  NotificationChannels,
  NotificationService,
} from './notificationService';

// Throttle progress updates: only re-schedule when percent moved ≥10 points.
const lastProgressPercent = new Map<string, number>();

const channelTrigger = (channelId: string) => ({ channelId });

export const ContentNotifications = {
  // ═══════════════════════════════════════════════════
  // DOWNLOAD NOTIFICATIONS
  // ═══════════════════════════════════════════════════

  /**
   * Show download progress notification (ongoing, silent).
   */
  async showDownloadProgress(
    mediaId: string,
    title: string,
    progress: number,
    bytesDownloaded: number,
    totalBytes: number
  ): Promise<void> {
    if (Platform.OS === 'web' || !NotificationService.isEnabled()) return;

    const percent = Math.round(progress * 100);
    const last = lastProgressPercent.get(mediaId);
    if (last !== undefined && percent - last < 10 && percent < 100) return;
    lastProgressPercent.set(mediaId, percent);

    const downloadedMB = (bytesDownloaded / (1024 * 1024)).toFixed(1);
    const totalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '?';

    await Notifications.scheduleNotificationAsync({
      identifier: `download-progress-${mediaId}`,
      content: {
        title: 'Downloading...',
        body: `${title}\n${downloadedMB} MB / ${totalMB} MB (${percent}%)`,
        data: { type: 'download', mediaId },
        color: '#38BDF8',
        sticky: true,
        autoDismiss: false,
      },
      trigger: channelTrigger(NotificationChannels.DOWNLOAD_PROGRESS),
    });
  },

  /**
   * Show download completed notification.
   */
  async showDownloadComplete(
    mediaId: string,
    title: string,
    mediaType: 'audio' | 'video',
    fileSizeMB: number
  ): Promise<void> {
    if (Platform.OS === 'web') return;
    lastProgressPercent.delete(mediaId);
    try {
      await Notifications.dismissNotificationAsync(`download-progress-${mediaId}`);
    } catch {
      // Non-critical (unsupported on web).
    }
    if (!NotificationService.isEnabled()) return;

    const typeEmoji = mediaType === 'video' ? '🎬' : '🎵';

    await Notifications.scheduleNotificationAsync({
      identifier: `download-complete-${mediaId}-${Date.now()}`,
      content: {
        title: `${typeEmoji} Download Complete`,
        body: `"${title}" (${fileSizeMB.toFixed(1)} MB) is ready for offline playback`,
        categoryIdentifier: NotificationCategories.DOWNLOAD_ACTIONS,
        data: { type: 'download_complete', mediaId, mediaType, action: 'play_now' },
        color: '#10B981',
      },
      trigger: channelTrigger(NotificationChannels.DOWNLOAD_COMPLETE),
    });
  },

  /**
   * Show download failed notification.
   */
  async showDownloadFailed(mediaId: string, title: string, error: string): Promise<void> {
    if (Platform.OS === 'web') return;
    lastProgressPercent.delete(mediaId);
    try {
      await Notifications.dismissNotificationAsync(`download-progress-${mediaId}`);
    } catch {
      // Non-critical (unsupported on web).
    }
    if (!NotificationService.isEnabled()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `download-failed-${mediaId}-${Date.now()}`,
      content: {
        title: '❌ Download Failed',
        body: `"${title}" could not be downloaded.\n${error}`,
        data: { type: 'download_failed', mediaId, action: 'retry' },
        color: '#EF4444',
      },
      trigger: channelTrigger(NotificationChannels.DOWNLOAD_COMPLETE),
    });
  },

  /**
   * Show batch download summary.
   */
  async showBatchDownloadSummary(completed: number, failed: number, total: number): Promise<void> {
    if (Platform.OS === 'web' || (completed === 0 && failed === 0) || !NotificationService.isEnabled()) return;

    const parts: string[] = [];
    if (completed > 0) parts.push(`✅ ${completed} completed`);
    if (failed > 0) parts.push(`❌ ${failed} failed`);

    await Notifications.scheduleNotificationAsync({
      identifier: `download-batch-${Date.now()}`,
      content: {
        title: 'Download Summary',
        body: `${parts.join(', ')} out of ${total} files`,
        data: { type: 'download_summary', action: 'open_downloads' },
        color: completed > 0 ? '#10B981' : '#EF4444',
      },
      trigger: channelTrigger(NotificationChannels.DOWNLOAD_COMPLETE),
    });
  },

  // ═══════════════════════════════════════════════════
  // NEW CONTENT NOTIFICATIONS
  // ═══════════════════════════════════════════════════

  /**
   * Notify about new content available.
   */
  async showNewContent(
    title: string,
    description: string,
    category: string,
    contentId: string
  ): Promise<void> {
    if (Platform.OS === 'web' || !NotificationService.isEnabled()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `new-content-${contentId}-${Date.now()}`,
      content: {
        title: `🆕 New ${category}`,
        body: `${title}\n${description}`,
        data: { type: 'new_content', contentId, category, action: 'open_content' },
        color: '#38BDF8',
      },
      trigger: channelTrigger(NotificationChannels.NEW_CONTENT),
    });
  },

  /**
   * Schedule a new content notification for later.
   */
  async scheduleNewContent(
    title: string,
    description: string,
    category: string,
    contentId: string,
    triggerDate: Date
  ): Promise<void> {
    if (Platform.OS === 'web' || !NotificationService.isEnabled()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🆕 New ${category}`,
        body: `${title}\n${description}`,
        data: { type: 'new_content', contentId, category, action: 'open_content' },
        color: '#38BDF8',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: NotificationChannels.NEW_CONTENT,
      },
    });
  },

  // ═══════════════════════════════════════════════════
  // PLAYLIST NOTIFICATIONS
  // ═══════════════════════════════════════════════════

  /**
   * Notify about playlist update.
   */
  async showPlaylistUpdated(
    playlistName: string,
    changeDescription: string,
    playlistId: string
  ): Promise<void> {
    if (Platform.OS === 'web' || !NotificationService.isEnabled()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `playlist-${playlistId}-${Date.now()}`,
      content: {
        title: '📁 Playlist Updated',
        body: `"${playlistName}" — ${changeDescription}`,
        data: { type: 'playlist_update', playlistId, action: 'open_playlist' },
        color: '#34D399',
      },
      trigger: channelTrigger(NotificationChannels.PLAYLIST_UPDATE),
    });
  },

  /**
   * Notify when items are added to a playlist.
   */
  async showPlaylistItemsAdded(
    playlistName: string,
    itemCount: number,
    playlistId: string
  ): Promise<void> {
    await this.showPlaylistUpdated(
      playlistName,
      `${itemCount} new item${itemCount > 1 ? 's' : ''} added`,
      playlistId
    );
  },
};
