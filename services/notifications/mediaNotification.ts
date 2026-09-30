import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { MediaItem, PlaybackStatus } from '@/types/media';

import { NotificationCategories, NotificationChannels, NotificationService } from './notificationService';

const MEDIA_NOTIFICATION_ID = 'hikmah-media-playback';

export const MediaNotification = {
  /**
   * Show or update the media playback notification (Android).
   * Same identifier re-schedules → updates in place. SDK 57 local
   * notifications have no progress-bar API, so progress is text.
   */
  async show(
    track: MediaItem,
    status: PlaybackStatus,
    position: number,
    duration: number
  ): Promise<void> {
    if (Platform.OS !== 'android' || !NotificationService.isEnabled()) return;

    const isPlaying = status === 'playing';
    const progressPercent = duration > 0 ? Math.round((position / duration) * 100) : 0;
    const statusText =
      isPlaying
        ? `Playing • ${progressPercent}%`
        : status === 'paused'
          ? `Paused • ${progressPercent}%`
          : status === 'buffering'
            ? 'Loading...'
            : 'Stopped';

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: MEDIA_NOTIFICATION_ID,
        content: {
          title: track.title,
          body: `${track.artistOrSpeaker || 'Hikmah Player'} • ${statusText}`,
          categoryIdentifier: NotificationCategories.MEDIA_CONTROLS,
          data: { type: 'media', mediaId: track.id, action: 'open_player' },
          color: '#10B981',
          sticky: isPlaying,
          autoDismiss: false,
        },
        trigger: { channelId: NotificationChannels.MEDIA_PLAYBACK },
      });
    } catch {
      // Notifications are non-critical: never crash playback.
    }
  },

  /**
   * Dismiss the media notification.
   * No-op off Android: `dismissNotificationAsync` throws UnavailabilityError
   * on web (no native NotificationPresenter module).
   */
  async dismiss(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.dismissNotificationAsync(MEDIA_NOTIFICATION_ID);
    } catch {
      // Non-critical: never crash playback.
    }
  },
};
