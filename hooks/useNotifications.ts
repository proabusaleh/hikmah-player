import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { ContentNotifications } from '@/services/notifications/contentNotifications';
import { MediaNotification } from '@/services/notifications/mediaNotification';
import { NotificationService } from '@/services/notifications/notificationService';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

type NotificationData = {
  type?: string;
  mediaId?: string;
  mediaType?: 'audio' | 'video';
  playlistId?: string;
  contentId?: string;
  action?: string;
};

export const useNotifications = () => {
  const router = useRouter();
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);
  const mediaUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const status = usePlayerStore((s) => s.status);

  // ── Initialize (permissions + channels + categories) ──
  useEffect(() => {
    void NotificationService.initialize();
  }, []);

  // ── Handle Notification Actions ──
  const handleNotificationAction = useCallback(
    (data: NotificationData | undefined, actionId: string) => {
      if (!data) return;
      const player = usePlayerStore.getState();

      switch (data.type) {
        case 'media':
          if (actionId === 'PREVIOUS') {
            void player.previousTrack();
          } else if (actionId === 'PLAY_PAUSE') {
            void player.togglePlayPause();
          } else if (actionId === 'NEXT') {
            void player.nextTrack();
          } else {
            router.navigate('/player');
          }
          break;

        case 'download_complete':
          router.navigate('/(tabs)/downloads');
          break;

        case 'download_failed':
          router.navigate('/(tabs)/downloads');
          break;

        case 'download_summary':
          router.navigate('/(tabs)/downloads');
          break;

        case 'new_content':
          router.navigate('/(tabs)/library');
          break;

        case 'playlist_update':
          if (data.playlistId) {
            router.push({
              pathname: '/library/playlist',
              params: { playlistId: data.playlistId },
            });
          }
          break;

        default:
          router.navigate('/(tabs)');
      }
    },
    [router]
  );

  // ── Listen for Notification Responses (user taps / actions) ──
  useEffect(() => {
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | NotificationData
          | undefined;
        handleNotificationAction(data, response.actionIdentifier);
      }
    );

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
        responseListenerRef.current = null;
      }
    };
  }, [handleNotificationAction]);

  // ── Media Playback Notification Sync ──
  const startMediaNotification = useCallback(() => {
    if (Platform.OS !== 'android' || mediaUpdateIntervalRef.current) return;

    const updateNotification = () => {
      const { currentTrack, status: playerStatus, position, duration } =
        usePlayerStore.getState();

      if (currentTrack && (playerStatus === 'playing' || playerStatus === 'paused')) {
        // Player position is ms; notification shows percent only.
        void MediaNotification.show(currentTrack, playerStatus, position, duration);
      } else {
        void MediaNotification.dismiss();
      }
    };

    // Update every 5 seconds (re-scheduling replaces the same identifier)
    updateNotification();
    mediaUpdateIntervalRef.current = setInterval(updateNotification, 5000);
  }, []);

  const stopMediaNotification = useCallback(() => {
    if (mediaUpdateIntervalRef.current) {
      clearInterval(mediaUpdateIntervalRef.current);
      mediaUpdateIntervalRef.current = null;
    }
    void MediaNotification.dismiss();
  }, []);

  // Auto-sync media notification with player state
  useEffect(() => {
    if (status === 'playing' || status === 'paused') {
      startMediaNotification();
    } else {
      stopMediaNotification();
    }
  }, [status, startMediaNotification, stopMediaNotification]);

  // ── Download Notification Helpers ──
  const notifyDownloadProgress = useCallback(
    (item: MediaItem, progress: number, downloaded: number, total: number) => {
      void ContentNotifications.showDownloadProgress(
        item.id,
        item.title,
        progress,
        downloaded,
        total
      );
    },
    []
  );

  const notifyDownloadComplete = useCallback(
    (item: MediaItem, fileSizeMB: number) => {
      void ContentNotifications.showDownloadComplete(item.id, item.title, item.type, fileSizeMB);
    },
    []
  );

  const notifyDownloadFailed = useCallback((item: MediaItem, error: string) => {
    void ContentNotifications.showDownloadFailed(item.id, item.title, error);
  }, []);

  return {
    startMediaNotification,
    stopMediaNotification,
    notifyDownloadProgress,
    notifyDownloadComplete,
    notifyDownloadFailed,
  };
};
