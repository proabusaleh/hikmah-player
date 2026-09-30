import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { StorageService } from '@/services/storage/storageService';

// ─── Notification Channel IDs ────────────────────────
export const NotificationChannels = {
  MEDIA_PLAYBACK: 'media-playback',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  NEW_CONTENT: 'new-content',
  PLAYLIST_UPDATE: 'playlist-update',
  GENERAL: 'general',
} as const;

// ─── Notification Category IDs (for actions) ─────────
export const NotificationCategories = {
  MEDIA_CONTROLS: 'media-controls',
  DOWNLOAD_ACTIONS: 'download-actions',
} as const;

const ENABLED_KEY = '@hikmah_notifications_enabled';

// In-memory gate so every notify call stays cheap (loaded at initialize).
let notificationsEnabled = true;

const SILENT_TYPES = new Set(['media', 'download']);

// ─── Configure Notification Behavior ─────────────────
// NOTE: this must run at module load (before any notification arrives).
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as { type?: string } | undefined;

    // Media playback + download progress update silently (no popup/sound).
    if (data && SILENT_TYPES.has(data.type ?? '')) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // All others: show alert
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export const NotificationService = {
  /**
   * Request notification permissions (no-op on simulators).
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!Device.isDevice) {
      console.warn('[Notifications] Notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Create all notification channels (Android).
   */
  async setupChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // ── Media Playback Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.MEDIA_PLAYBACK, {
      name: 'Now Playing',
      importance: Notifications.AndroidImportance.LOW,
      description: 'Media playback controls and status',
      showBadge: false,
      enableVibrate: false,
      enableLights: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    // ── Download Progress Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.DOWNLOAD_PROGRESS, {
      name: 'Download Progress',
      importance: Notifications.AndroidImportance.LOW,
      description: 'Ongoing download progress updates',
      showBadge: false,
      enableVibrate: false,
      enableLights: false,
    });

    // ── Download Complete Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.DOWNLOAD_COMPLETE, {
      name: 'Download Complete',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notifications when downloads finish or fail',
      showBadge: true,
      enableVibrate: true,
      enableLights: true,
      lightColor: '#10B981',
    });

    // ── New Content Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.NEW_CONTENT, {
      name: 'New Content',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Notifications about new lectures and recitations',
      showBadge: true,
      enableVibrate: true,
      enableLights: true,
      lightColor: '#38BDF8',
    });

    // ── Playlist Update Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.PLAYLIST_UPDATE, {
      name: 'Playlist Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Notifications about playlist changes',
      showBadge: true,
      enableVibrate: false,
      enableLights: false,
    });

    // ── General Channel ──
    await Notifications.setNotificationChannelAsync(NotificationChannels.GENERAL, {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'General app notifications',
      showBadge: true,
      enableVibrate: true,
    });

    if (__DEV__) {
      console.log('[Notifications] All channels created');
    }
  },

  /**
   * Setup notification action categories (buttons on notifications).
   */
  async setupCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync(NotificationCategories.MEDIA_CONTROLS, [
      {
        identifier: 'PREVIOUS',
        buttonTitle: '⏮',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'PLAY_PAUSE',
        buttonTitle: '⏯',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'NEXT',
        buttonTitle: '⏭',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategories.DOWNLOAD_ACTIONS, [
      {
        identifier: 'PLAY_NOW',
        buttonTitle: 'Play Now',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);
  },

  /**
   * Initialize the full notification system.
   */
  async initialize(): Promise<boolean> {
    try {
      notificationsEnabled = (await StorageService.getItem<boolean>(ENABLED_KEY)) ?? true;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        if (__DEV__) {
          console.warn('[Notifications] Permission denied');
        }
        return false;
      }

      await this.setupChannels();
      await this.setupCategories();
      return true;
    } catch {
      // Notifications are non-critical: never crash startup.
      return false;
    }
  },

  /** App-level master switch (persisted). */
  async setEnabled(enabled: boolean): Promise<void> {
    notificationsEnabled = enabled;
    await StorageService.setItem(ENABLED_KEY, enabled);
  },

  isEnabled(): boolean {
    return notificationsEnabled;
  },

  /**
   * Dismiss a specific notification (no-op where unsupported, e.g. web).
   */
  async dismissNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch {
      // Non-critical.
    }
  },

  /**
   * Dismiss all notifications (no-op where unsupported, e.g. web).
   */
  async dismissAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch {
      // Non-critical.
    }
  },

  /**
   * Get notification permission status.
   */
  async getPermissionStatus(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },
};
