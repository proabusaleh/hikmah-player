import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DownloadCloud } from 'lucide-react-native';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/MiniPlayer';
import { audioService } from '@/services/audio/audioService';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await audioService.initialize();
      } catch {
        // Ignore unsupported native audio initialization on web or unsupported engines.
      }

      try {
        await useSettingsStore.getState().loadSettings();

        const continueWatchingStore = useContinueWatchingStore.getState();
        await continueWatchingStore.loadProgress();
        await continueWatchingStore.cleanupExpired();
      } catch (error) {
        console.warn('[RootLayout] Store initialization failed:', error);
      }
    };

    void init();

    return () => {
      void audioService.destroy();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#020617',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Hikmah Player',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/downloads')}
                style={{ marginRight: 8 }}
                activeOpacity={0.7}
              >
                <DownloadCloud size={24} color="#38BDF8" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="player/index"
          options={{
            title: 'Now Playing',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="player/video"
          options={{
            title: 'Video Player',
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="downloads/index"
          options={{
            title: 'Offline Downloads',
          }}
        />
      </Stack>

      <MiniPlayer />
    </SafeAreaProvider>
  );
}
