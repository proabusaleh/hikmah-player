import { DarkTheme, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/MiniPlayer';
import { MediaPermissionGate } from '@/components/permissions/MediaPermissionGate';
import { Colors } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';
import { audioService } from '@/services/audio/audioService';
import { ThumbnailCache } from '@/services/cache/thumbnailCache';
import { initI18n } from '@/services/i18n/i18n';
import { perfMonitor } from '@/services/performance/performanceMonitor';
import { BackgroundAudioService } from '@/services/playback/backgroundAudioService';
import { playerLifecycle } from '@/services/playback/playerLifecycle';
import { downloadQueue } from '@/services/storage/downloadQueue';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSmartPlaybackStore } from '@/store/useSmartPlaybackStore';

// Keep the native splash visible until critical init completes.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const status = usePlayerStore((s) => s.status);

  const inTabsGroup = segments[0] === '(tabs)';
  const showMiniPlayer = inTabsGroup && Boolean(currentTrack) && status !== 'idle';

  // Notifications: permissions/channels, tap routing, media notification sync
  useNotifications();

  useEffect(() => {
    setupGlobalErrorHandler();
    perfMonitor.mark('appStart');

    const init = async () => {
      try {
        // ── Phase 1: Critical (blocking, but never fatal) ──
        await Promise.allSettled([
          audioService.initialize(),
          BackgroundAudioService.configureForBackground(),
          ThumbnailCache.initialize(),
        ]);
        perfMonitor.mark('criticalServicesReady');

        // ── Phase 2: Important (parallel) ──
        // i18n must never block startup: fall back to built-in English.
        const safeInitI18n = async () => {
          try {
            await initI18n();
          } catch (error) {
            console.warn('[RootLayout] i18n init failed, using defaults:', error);
          }
        };
        await Promise.allSettled([
          useSettingsStore.getState().loadSettings(),
          useSmartPlaybackStore.getState().loadConfig(),
          useContinueWatchingStore.getState().loadProgress(),
          useLibraryStore.getState().loadLibrary(),
          safeInitI18n(),
        ]);
        perfMonitor.mark('storesLoaded');

        // ── Lifecycle Manager ──
        try {
          playerLifecycle.initialize();
        } catch {
          // Non-critical.
        }

        perfMonitor.mark('firstRender');
      } catch {
        // Never let init crash the app: fall through to interactive.
      } finally {
        setIsReady(true);
        perfMonitor.mark('interactive');
        void SplashScreen.hideAsync().catch(() => {});
      }

      if (__DEV__) perfMonitor.startFPSMonitor();

      // ── Phase 3: Non-critical (deferred until interactive) ──
      setTimeout(() => {
        void Promise.allSettled([
          useSmartPlaybackStore.getState().refreshNetwork(),
          useContinueWatchingStore.getState().cleanupExpired(),
          downloadQueue.initialize(),
          ThumbnailCache.cleanExpiredCache(),
          ThumbnailCache.enforceMaxSize(),
        ]).then(() => {
          perfMonitor.mark('deferredTasksDone');
          if (__DEV__) perfMonitor.logReport();
        });
      }, 2000);
    };

    void init();

    return () => {
      void audioService.destroy();
      playerLifecycle.destroy();
      useSmartPlaybackStore.getState().stopNetworkMonitoring();
      perfMonitor.stopFPSMonitor();
    };
  }, []);

  return (
    <ErrorBoundary screenName="RootLayout">
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <StatusBar style="light" />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="splash" options={{ animation: 'none' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="library/playlist"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            {/* Directory route: src/app/player/index.tsx → URL `/player`. */}
            <Stack.Screen
              name="player"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
            <Stack.Screen
              name="player/video"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>

          {isReady && showMiniPlayer && <MiniPlayer />}
          {isReady && <MediaPermissionGate />}
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
