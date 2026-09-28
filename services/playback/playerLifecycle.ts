import { Image } from 'expo-image';
import {
  AppState,
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  Platform,
  type AppStateStatus,
} from 'react-native';

import { audioService } from '@/services/audio/audioService';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { usePlayerStore } from '@/store/usePlayerStore';

// ─── Player Lifecycle Manager ────────────────────────
class PlayerLifecycleManager {
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private memoryWarningSubscription: { remove: () => void } | null = null;
  private dimensionSubscription: ReturnType<typeof Dimensions.addEventListener> | null = null;
  private isInBackground = false;
  private wasPlayingBeforeBackground = false;
  private orientationChangeTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize all lifecycle listeners
   */
  initialize(): void {
    this.setupAppStateListener();
    this.setupMemoryWarningListener();
    this.setupOrientationListener();
    console.log('[PlayerLifecycle] Initialized');
  }

  /**
   * Clean up all listeners
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    if (this.memoryWarningSubscription) {
      this.memoryWarningSubscription.remove();
      this.memoryWarningSubscription = null;
    }
    if (this.dimensionSubscription) {
      this.dimensionSubscription.remove();
      this.dimensionSubscription = null;
    }
    if (this.orientationChangeTimeout) {
      clearTimeout(this.orientationChangeTimeout);
      this.orientationChangeTimeout = null;
    }
    console.log('[PlayerLifecycle] Destroyed');
  }

  // ── App State (Background/Foreground) ──
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = async (nextState: AppStateStatus): Promise<void> => {
    const { status, currentTrack } = usePlayerStore.getState();

    switch (nextState) {
      case 'background':
      case 'inactive':
        this.isInBackground = true;
        this.wasPlayingBeforeBackground = status === 'playing';

        // For VIDEO: pause when going to background (save battery)
        // For AUDIO: continue playing (background audio)
        if (currentTrack?.type === 'video' && status === 'playing') {
          await audioService.pause();
          usePlayerStore.getState().updateStatus('paused');
        }

        // Save progress immediately
        this.saveCurrentProgress();
        break;

      case 'active':
        this.isInBackground = false;

        // Resume video if it was playing before background
        if (
          currentTrack?.type === 'video' &&
          this.wasPlayingBeforeBackground &&
          status === 'paused'
        ) {
          await audioService.play();
          usePlayerStore.getState().updateStatus('playing');
        }
        this.wasPlayingBeforeBackground = false;
        break;
      default:
        break;
    }
  };

  // ── Memory Warning ──
  private setupMemoryWarningListener(): void {
    // Stock React Native has no cross-platform memory-warning event;
    // listen on Android's DeviceEventManager where available (best-effort).
    if (Platform.OS === 'android') {
      try {
        if (NativeModules.DeviceEventManager) {
          const emitter = new NativeEventEmitter(NativeModules.DeviceEventManager);
          this.memoryWarningSubscription = emitter.addListener(
            'memoryWarning',
            this.handleMemoryWarning
          );
        }
      } catch {
        // Fallback: no native memory warning listener
      }
    }
  }

  private handleMemoryWarning = async (): Promise<void> => {
    console.warn('[PlayerLifecycle] Memory warning received!');

    // Release non-essential resources
    const { status } = usePlayerStore.getState();

    // If not playing, unload the player entirely
    if (status === 'idle' || status === 'stopped') {
      await audioService.unload();
    }

    // Clear image caches
    try {
      await Image.clearMemoryCache();
    } catch {
      // Ignore
    }
  };

  // ── Orientation Changes ──
  private setupOrientationListener(): void {
    this.dimensionSubscription = Dimensions.addEventListener('change', this.handleDimensionChange);
  }

  private handleDimensionChange = ({
    window,
  }: {
    window: { width: number; height: number };
  }): void => {
    // Debounce orientation changes to prevent rapid re-renders
    if (this.orientationChangeTimeout) {
      clearTimeout(this.orientationChangeTimeout);
    }

    this.orientationChangeTimeout = setTimeout(() => {
      const isLandscape = window.width > window.height;
      console.log(`[PlayerLifecycle] Orientation: ${isLandscape ? 'Landscape' : 'Portrait'}`);

      // Notify store about orientation for UI adjustments
      // (VideoPlayerView reads this via useScreenOrientation hook)
    }, 150); // 150ms debounce
  };

  // ── Progress Save ──
  private saveCurrentProgress(): void {
    const { currentTrack, position, duration } = usePlayerStore.getState();
    if (!currentTrack || position <= 0 || duration <= 0) return;

    try {
      // Player position is ms, progress records are seconds
      void useContinueWatchingStore.getState().saveProgress({
        mediaId: currentTrack.id,
        title: currentTrack.title,
        thumbnailUrl: currentTrack.thumbnailUrl,
        mediaType: currentTrack.type,
        sourceUrl: currentTrack.url,
        position: position / 1000,
        duration: duration / 1000,
        speakerOrArtist: currentTrack.artistOrSpeaker,
      });
    } catch {
      // Silent fail during lifecycle events
    }
  }
}

export const playerLifecycle = new PlayerLifecycleManager();
